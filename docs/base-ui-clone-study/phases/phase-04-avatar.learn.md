# Phase 04. Avatar 완료

완료일: 2026-05-21

## 구현 요약

- 구현한 파일:
  - `packages/react/src/avatar/root/AvatarRoot.tsx`
  - `packages/react/src/avatar/image/AvatarImage.tsx`
  - `packages/react/src/avatar/image/useImageLoadingStatus.ts`
  - `packages/react/src/avatar/fallback/AvatarFallback.tsx`
  - `packages/react/src/internals/useTransitionStatus.ts`
  - `packages/react/src/internals/useOpenChangeComplete.ts`
  - `packages/react/src/internals/useAnimationsFinished.ts`
  - `packages/react/src/internals/stateAttributesMapping.ts`
  - `packages/utils/src/useTimeout.ts`
  - `packages/utils/src/useAnimationFrame.ts`
  - `packages/utils/src/useRefWithInit.ts`
  - `packages/utils/src/useOnMount.ts`
- playground:
  - `apps/playground/src/routes/phase-4.tsx`
  - `/phase-4` route link and styles
- 검증:
  - `pnpm typecheck`
  - `pnpm build`

## 학습 기록

- 이번 phase의 학습 요소:
  - Avatar parts가 Root context로 image loading status를 공유하는 방식.
  - `src` 없음, loading, loaded, error 상태가 fallback/image mount 여부를 결정하는 방식.
  - cached image를 `Image.complete`와 `naturalWidth`로 빠르게 판별하는 방식.
  - transition 상태를 `data-starting-style`, `data-ending-style`로 DOM에 노출하는 방식.
  - `getAnimations().finished`를 기다린 뒤 exit unmount를 완료하는 방식.
- Base UI의 설계 의도:
  - public component는 작고 declarative하게 유지하고, loading/transition side effect는 hook으로 분리한다.
  - Root는 자체 DOM을 렌더링하면서 동시에 하위 part의 상태 동기화를 위한 context boundary가 된다.
  - transition data attribute는 CSS와 JS lifecycle 사이의 최소 계약으로 사용된다.
- 구현하면서 확인한 public surface:
  - `Avatar.Root`: `span` 기반, `render`, function `className/style`, forwarded ref 지원.
  - `Avatar.Image`: `img` 기반, `onLoadingStatusChange`, `data-starting-style`, `data-ending-style`, forwarded ref 지원.
  - `Avatar.Fallback`: `span` 기반, `delay`, forwarded ref 지원.
- 원본에서 학습용으로 줄인 부분:
  - broad context helper는 만들지 않고 Avatar 전용 context로 제한했다.
  - transition hook은 이번 Avatar가 쓰는 기본 starting/ending path만 구현했다.
  - `useAnimationsFinished`는 `flushSync` 없이 callback을 실행한다.
- 다음 phase에서 다시 볼 부분:
  - shared context helper가 여러 compound component에서 반복되면 추출한다.
  - transition idle state, deferred ending state, animation abort 재검사 정책을 더 넓은 component에서 재검토한다.

## Avatar 상태 흐름

Avatar는 `Root`, `Image`, `Fallback`이 서로 다른 책임을 나눠 갖는 compound component다. 상태 흐름의 중심은 `imageLoadingStatus`이며 가능한 값은 `idle`, `loading`, `loaded`, `error`다.

```tsx
<Avatar.Root>
  <Avatar.Image src="..." />
  <Avatar.Fallback>YC</Avatar.Fallback>
</Avatar.Root>
```

전체 흐름은 다음과 같다.

```txt
Avatar.Root
  imageLoadingStatus = 'idle'로 시작
  context로 imageLoadingStatus와 setImageLoadingStatus 제공

Avatar.Image
  useImageLoadingStatus(src)로 실제 이미지 로딩 상태 계산
  local imageLoadingStatus가 idle이 아니면 Root context에 전파
  loaded일 때만 image를 mount/visible 처리

Avatar.Fallback
  Root context의 imageLoadingStatus를 읽음
  imageLoadingStatus !== 'loaded'이고 delay가 지났을 때 렌더링
```

### 상태 생산자: Avatar.Image

`Avatar.Image`는 이미지 로딩 상태를 실제로 만들어 내는 part다. `src`, `crossOrigin`, `referrerPolicy`는 `Image`의 props이므로 Root나 Fallback이 직접 로딩을 판단하지 않는다.

`useImageLoadingStatus(src)`는 내부에서 `window.Image()`를 만든 뒤 다음 순서로 상태를 갱신한다.

```txt
초기값
  idle

src가 없음
  error

src가 있음
  loading
  onload  -> loaded
  onerror -> error

cached image fast path
  image.complete === true이면 naturalWidth > 0 여부로 loaded/error 즉시 판정
```

이 local 상태는 `Avatar.Image` 자신의 렌더링과 transition 판단에 즉시 사용된다.

```txt
imageLoadingStatus === 'loaded'
  -> isVisible = true
  -> useTransitionStatus(true)
  -> img mount

imageLoadingStatus !== 'loaded'
  -> isVisible = false
  -> img는 mount되지 않거나 exit transition 이후 unmount
```

### 공유 상태: Avatar.Root context

`Avatar.Root`도 `imageLoadingStatus` state를 갖지만, Root가 직접 이미지를 로딩하는 것은 아니다. 이 상태는 `Image`가 계산한 결과를 다른 Avatar part들이 읽을 수 있게 보관하는 shared snapshot이다.

`Avatar.Image`는 local status가 바뀔 때 layout effect에서 다음 두 일을 한다.

```txt
onLoadingStatusChange?.(status)
context.setImageLoadingStatus(status)
```

첫 번째는 사용자에게 상태 변화를 알려 주는 public callback이다. 두 번째는 Avatar 내부 part 사이의 동기화를 위한 전파다.

이 구조 때문에 `Image`와 `Root`에 status가 둘 다 존재한다.

- `Image`의 local status: 실제 preload 결과를 계산하는 source다.
- `Root`의 context status: sibling part인 `Fallback`과 Root render state가 읽을 수 있게 복사된 공유 상태다.

하나로 합치지 않는 이유는 책임이 다르기 때문이다. Root가 로딩을 직접 담당하면 Root가 `Image` 전용 props인 `src`, `crossOrigin`, `referrerPolicy`를 알아야 한다. 반대로 Image local state만 두면 sibling인 Fallback이 상태를 읽을 방법이 없다. 그래서 Image가 상태를 생산하고 Root가 그 결과를 공유한다.

### 상태 소비자: Avatar.Fallback

`Avatar.Fallback`은 이미지를 직접 preload하지 않는다. Root context에서 `imageLoadingStatus`를 읽고, fallback을 보여 줄지 여부만 결정한다.

```txt
enabled = imageLoadingStatus !== 'loaded' && delayPassed
```

이 값은 `useRenderElement`의 `enabled` 옵션으로 전달된다. 따라서 fallback을 보여 줄 조건이 아니면 `Avatar.Fallback`은 내부 props와 render override를 계산해도 최종적으로 `null`을 반환한다.

상태별 fallback 동작은 다음과 같다.

```txt
idle
  Root 초기 상태다.
  delay가 없거나 delay가 지난 경우 fallback이 보일 수 있다.

loading
  Image가 preload 중이다.
  image는 아직 mount되지 않고 fallback이 보일 수 있다.

loaded
  Image preload가 성공했다.
  image가 mount되고 fallback은 사라진다.

error
  src가 없거나 image preload가 실패했다.
  image는 mount되지 않고 fallback이 보인다.
```

`delay` prop은 loading이 아주 짧게 끝나는 경우 fallback이 순간적으로 깜빡이는 것을 줄이기 위한 장치다. `delay`가 있으면 `useTimeout`으로 일정 시간이 지난 뒤에만 fallback 렌더링을 허용하고, effect cleanup에서 timeout을 정리한다.

### transition 상태와 DOM 노출

`Avatar.Image`는 로딩 상태와 별개로 transition 상태도 가진다. `imageLoadingStatus === 'loaded'`이면 `isVisible`이 되고, 이 값이 `useTransitionStatus`에 전달된다.

```txt
loaded가 됨
  mounted = true
  transitionStatus = 'starting'
  data-starting-style 노출 가능

loaded가 아니게 됨
  transitionStatus = 'ending'
  data-ending-style 노출 가능
  animation/transition 완료 후 mounted = false
```

`transitionStatus`는 `data-starting-style`, `data-ending-style`로 DOM에 노출된다. 반면 `imageLoadingStatus`는 현재 `avatarStateAttributesMapping`에서 `null`로 매핑되어 `data-imageloadingstatus` 같은 public attribute를 만들지 않는다. 즉 image loading status는 렌더링 판단과 render prop state에는 쓰이지만, 현재 public DOM styling surface로는 열지 않는 설계다.

### mounted가 필요한 이유

`useTransitionStatus`에서 `mounted`는 `open`과 같은 의미가 아니다. `open`은 외부에서 들어오는 목표 상태이고, `mounted`는 실제 DOM에 남겨 둘지 여부다.

```txt
open
  외부 목표 상태다.
  true이면 보여야 하고, false이면 닫혀야 한다.

mounted
  실제 DOM 렌더링 여부다.
  true이면 DOM에 남아 있고, false이면 unmount된다.

transitionStatus
  현재 transition phase다.
  starting이면 entering style, ending이면 exiting style을 노출한다.
```

transition이 없는 컴포넌트라면 `mounted = open`으로 충분하다. 하지만 exit animation을 지원하려면 `open`이 `false`가 되는 순간 DOM을 바로 제거하면 안 된다.

```txt
open 하나만 쓰는 경우

loaded 상태
  open = true
  img 렌더링

loaded가 아니게 됨
  open = false
  img 즉시 unmount
  data-ending-style을 붙일 DOM이 없음
  exit animation 불가능
```

`mounted`를 분리하면 닫히는 동안 DOM을 유지할 수 있다.

```txt
mounted를 분리한 경우

loaded 상태
  open = true
  mounted = true
  img 렌더링

loaded가 아니게 됨
  open = false
  mounted = true
  transitionStatus = ending
  data-ending-style 노출

animation/transition 완료
  mounted = false
  img unmount
```

Avatar Image에서 `open`에 해당하는 값은 `isVisible`이다.

```txt
isVisible = imageLoadingStatus === 'loaded'
```

이미지가 로드되면 `isVisible`이 `true`가 되고, `useTransitionStatus`는 `mounted`를 `true`로 만들어 실제 `img`를 렌더링할 수 있게 한다. 이미지가 다시 로드되지 않은 상태가 되면 `isVisible`은 `false`가 되지만, `mounted`는 바로 `false`가 되지 않는다. 먼저 `transitionStatus = 'ending'` 상태로 DOM을 유지하고, `useOpenChangeComplete`가 CSS animation/transition 완료를 확인한 뒤 `setMounted(false)`를 호출한다.

상태 조합은 다음처럼 해석한다.

```txt
open = true, mounted = true
  열린 상태다.
  DOM에 있고 image가 표시될 수 있다.

open = false, mounted = true
  닫히는 중이다.
  외부 목표는 닫힘이지만 exit animation을 위해 DOM에 남아 있다.
  data-ending-style을 노출할 수 있다.

open = false, mounted = false
  닫힌 상태다.
  DOM에서 제거되어 있다.

open = true, mounted = false
  열리는 순간의 불일치 상태다.
  render 중 mounted = true, transitionStatus = starting으로 보정해서
  첫 commit부터 data-starting-style을 노출할 수 있게 한다.
```

그래서 `mounted`는 `open`의 중복 상태가 아니라, "외부 목표 상태"와 "DOM 생존 기간"을 분리하기 위한 상태다. 이 분리가 있어야 entering transition과 exiting transition을 모두 자연스럽게 처리할 수 있다.

## useImageLoadingStatus

`useImageLoadingStatus`는 `Avatar.Image`가 실제 이미지 로딩 상태를 계산하기 위해 사용하는 hook이다. DOM에 렌더링되는 `<img>`와 별개로 preload용 `window.Image()` 인스턴스를 만들고, 그 인스턴스의 load/error 결과를 `idle`, `loading`, `loaded`, `error` 상태로 변환한다.

이 hook이 맡는 책임은 다음과 같다.

```txt
src 없음
  -> error

src 있음
  -> loading
  -> image.onload  -> loaded
  -> image.onerror -> error

이미 캐시된 이미지
  -> image.complete / image.naturalWidth로 즉시 loaded 또는 error 판정

src, crossOrigin, referrerPolicy 변경
  -> 이전 preload callback이 현재 상태를 덮어쓰지 않도록 cleanup
```

### 왜 DOM img가 아니라 window.Image로 먼저 확인하는가

Avatar는 이미지가 성공적으로 로드된 경우에만 실제 `Avatar.Image`를 보여 주고, 그 전에는 `Avatar.Fallback`을 보여 주는 컴포넌트다. DOM에 `<img src="...">`를 먼저 렌더링한 뒤 load/error를 기다리면 로딩 중이거나 깨진 이미지가 사용자에게 노출될 수 있다.

그래서 `useImageLoadingStatus`는 화면에 보이는 `<img>`와 별개의 preload 객체를 만든다.

```txt
preload용 window.Image()
  -> 성공 여부 확인
  -> loaded일 때만 Avatar.Image가 mount됨
```

이렇게 하면 image가 `loading` 또는 `error`인 동안 실제 `img` DOM은 보이지 않고 fallback이 유지된다.

### 상태 전환 순서

초기 상태는 `idle`이다. 아직 effect가 실행되지 않았고 이미지 요청도 시작하지 않은 상태다.

```ts
const [loadingStatus, setLoadingStatus] =
  React.useState<ImageLoadingStatus>('idle')
```

`src`가 없으면 로딩 성공 가능성이 없으므로 `error`로 전환한다. Avatar 입장에서는 이 상태에서 fallback이 표시되어야 한다.

```txt
src 없음
  idle -> error
```

`src`가 있으면 preload를 시작하기 전에 `loading`으로 전환하고, load/error handler를 등록한다.

```txt
src 있음
  idle/error/loaded -> loading
  image.onload      -> loaded
  image.onerror     -> error
```

중요한 순서는 handler와 요청 옵션을 먼저 설정한 뒤 마지막에 `image.src = src`를 대입하는 것이다. `src`를 대입하는 순간 브라우저가 이미지 요청을 시작할 수 있으므로, `onload`, `onerror`, `crossOrigin`, `referrerPolicy`가 먼저 준비되어 있어야 한다.

```txt
1. window.Image() 생성
2. loading 상태로 전환
3. onload/onerror 등록
4. referrerPolicy 설정
5. crossOrigin 설정
6. src 설정으로 요청 시작
```

### cached image fast path

브라우저 캐시에 이미지가 있으면 `image.src = src` 직후 이미 로드가 끝난 상태일 수 있다. 이때는 `image.complete`가 `true`가 된다.

`complete`만으로는 성공 여부를 알 수 없으므로 `naturalWidth`를 같이 본다.

```txt
image.complete === true
  naturalWidth > 0  -> loaded
  naturalWidth <= 0 -> error
```

이 fast path는 fallback flash를 줄이는 데 중요하다. 캐시된 이미지는 사용자가 보기에는 이미 준비된 이미지이므로, 가능하면 첫 paint 전에 `loaded`로 보정해서 fallback이 잠깐 보였다가 사라지는 흐름을 피한다.

### cleanup과 stale callback 방지

이미지 요청은 비동기다. `src`가 A에서 B로 바뀐 뒤 A의 `onload`가 늦게 도착할 수 있고, 컴포넌트가 unmount된 뒤 callback이 실행될 수도 있다.

예를 들어 처음에는 A 이미지를 로드하다가, A의 요청이 끝나기 전에 `src`가 B로 바뀌는 상황을 생각할 수 있다.

```tsx
<Avatar.Image src="/user-a.png" />
```

첫 effect 실행분은 A 이미지를 위한 preload 요청을 만든다.

```txt
effect #1
  src = /user-a.png
  imageA = new Image()
  imageA.onload  = () => setLoadingStatus('loaded')
  imageA.onerror = () => setLoadingStatus('error')
  imageA.src = /user-a.png
```

그런데 A 이미지가 아직 로딩 중일 때 props가 B로 바뀔 수 있다.

```tsx
<Avatar.Image src="/user-b.png" />
```

dependency인 `src`가 바뀌었으므로 React는 이전 effect를 cleanup하고 새 effect를 실행한다.

```txt
cleanup of effect #1
  A 요청에 대한 effect 실행분을 더 이상 유효하지 않게 표시

effect #2
  src = /user-b.png
  imageB = new Image()
  imageB.onload  = () => setLoadingStatus('loaded')
  imageB.onerror = () => setLoadingStatus('error')
  imageB.src = /user-b.png
```

현재 Avatar가 관심 있는 이미지는 B다. 하지만 네트워크 응답 순서는 컴포넌트가 제어할 수 없다. B가 먼저 성공한 뒤, 과거 요청이었던 A가 나중에 실패할 수도 있다.

```txt
1. A 이미지 요청 시작
2. src가 B로 변경됨
3. B 이미지 요청 시작
4. B 이미지가 먼저 성공함
   -> loadingStatus = loaded
   -> Avatar는 B 이미지를 보여줄 준비가 됨
5. 뒤늦게 A 이미지가 실패함
   -> A의 onerror가 실행될 수 있음
```

방어 코드가 없다면 과거 요청인 A의 callback이 현재 상태를 덮어쓸 수 있다.

```txt
현재 src는 B인데
과거 src였던 A의 onerror가 늦게 실행됨
  -> setLoadingStatus('error')
  -> B는 성공했는데 Avatar가 fallback으로 돌아갈 수 있음
```

이런 callback을 stale callback이라고 볼 수 있다. callback 자체는 정상적으로 실행되지만, 그 callback이 속한 요청은 더 이상 현재 props와 일치하지 않는다.

이를 막기 위해 effect 내부에 `isMounted` 플래그를 둔다.

```txt
effect 시작
  isMounted = true

onload/onerror
  isMounted가 true일 때만 setLoadingStatus 실행

cleanup
  isMounted = false
```

effect 실행분마다 `isMounted`는 별도의 closure에 저장된다.

```txt
effect #1 for A
  isMounted_A = true

src가 B로 변경됨

cleanup #1
  isMounted_A = false

effect #2 for B
  isMounted_B = true
```

이후 A의 callback이 늦게 도착해도 A effect의 `isMounted_A`는 이미 `false`다.

```txt
A onerror 실행
  isMounted_A === false
  setLoadingStatus 실행하지 않음

B onload 실행
  isMounted_B === true
  setLoadingStatus('loaded') 실행
```

unmount 상황도 같은 원리다.

```txt
1. Avatar.Image mount
2. 이미지 preload 요청 시작
3. 페이지 이동 또는 조건부 렌더링 변경으로 Avatar.Image unmount
4. effect cleanup에서 isMounted = false
5. 이미지 요청이 뒤늦게 성공/실패
6. onload/onerror는 실행될 수 있지만 setLoadingStatus는 하지 않음
```

컴포넌트가 이미 사라졌는데 뒤늦은 callback이 state를 갱신하는 것은 불필요하고, 현재 UI와도 맞지 않는다. cleanup 플래그는 이런 업데이트를 막는다.

이름은 `isMounted`지만 실제 의미는 "컴포넌트 전체가 mounted인가"보다 "이 effect 실행분이 아직 유효한가"에 가깝다. 더 정확한 이름을 붙이면 `isCurrentRequest` 또는 `isActiveEffect`에 가깝다.

```ts
let isCurrentRequest = true

return () => {
  isCurrentRequest = false
}
```

즉 이 cleanup은 현재 `src`, `crossOrigin`, `referrerPolicy` 조합에 해당하는 최신 preload 요청만 상태를 바꿀 수 있게 하고, 이전 요청의 늦은 응답은 무시하게 만든다.

### 왜 useIsoLayoutEffect를 쓰는가

이 hook은 일반 `useEffect`가 아니라 `useIsoLayoutEffect`를 사용한다. 이유는 preload 결과를 브라우저 paint 전에 최대한 반영하기 위해서다.

일반 `useEffect`는 commit 후 브라우저가 화면을 그린 다음 실행된다. 그러면 cached image가 이미 준비되어 있어도 첫 paint에서는 아직 `idle` 또는 `loading` 상태일 수 있다.

```txt
useEffect를 쓰는 경우

render
  imageLoadingStatus = idle
  image는 보이지 않음
  fallback은 보일 수 있음

paint
  fallback이 잠깐 보임

effect
  image.complete 확인
  loaded로 전환

next render
  image 표시
  fallback 제거
```

반면 layout effect 계열은 commit 이후, paint 이전에 실행된다.

```txt
useIsoLayoutEffect를 쓰는 경우

render
  imageLoadingStatus = idle

commit

layout effect
  preload Image 생성
  cached image면 complete/naturalWidth로 loaded 판정

paint 전 re-render
  image 표시
  fallback 숨김
```

따라서 cached image나 빠르게 판정 가능한 상태를 paint 전에 보정할 수 있고, fallback이 순간적으로 깜빡이는 일을 줄일 수 있다.

직접 `useLayoutEffect`가 아니라 `useIsoLayoutEffect`를 쓰는 이유는 SSR 대응이다. 서버에는 `window.Image()`도 없고 layout도 없으므로 서버 렌더링 중에는 layout effect를 실행할 수 없다. `useIsoLayoutEffect`는 일반적으로 브라우저에서는 `useLayoutEffect`, 서버에서는 `useEffect`로 동작하게 만드는 wrapper다. 덕분에 클라이언트에서는 paint 전 보정을 얻고, 서버에서는 `useLayoutEffect` 경고를 피한다.

### Avatar.Image와의 연결

`useImageLoadingStatus`가 반환한 local status는 `Avatar.Image` 내부에서 세 가지 용도로 사용된다.

```txt
1. loaded 여부로 image mount/visibility 결정
2. transitionStatus 계산의 입력으로 사용
3. Root context에 전파해서 Fallback이 같은 상태를 읽게 함
```

`Avatar.Image`는 `imageLoadingStatus === 'loaded'`일 때만 `isVisible`을 true로 만든다. 이 값이 `useTransitionStatus`에 들어가 image의 mount, starting style, ending style을 결정한다.

```txt
imageLoadingStatus === 'loaded'
  -> isVisible = true
  -> mounted = true
  -> data-starting-style 노출 가능

imageLoadingStatus !== 'loaded'
  -> isVisible = false
  -> data-ending-style 노출 가능
  -> animation 완료 후 unmount
```

그리고 local status가 `idle`이 아니면 `Avatar.Image`는 `onLoadingStatusChange`를 호출하고 Root context의 `imageLoadingStatus`를 갱신한다.

```txt
useImageLoadingStatus
  -> Avatar.Image local status
  -> onLoadingStatusChange(status)
  -> context.setImageLoadingStatus(status)
  -> Avatar.Fallback 렌더링 조건 갱신
```

즉 `useImageLoadingStatus`는 "이미지 로딩을 감지하는 local producer"이고, Root context는 그 결과를 sibling part인 `Fallback`이 읽을 수 있도록 공유하는 통로다.

## 읽은 원본

- public component:
  - `/Users/youngchang/dev/references/base-ui/packages/react/src/avatar/index.ts`
  - `/Users/youngchang/dev/references/base-ui/packages/react/src/avatar/index.parts.ts`
  - `/Users/youngchang/dev/references/base-ui/packages/react/src/avatar/root/AvatarRoot.tsx`
  - `/Users/youngchang/dev/references/base-ui/packages/react/src/avatar/image/AvatarImage.tsx`
  - `/Users/youngchang/dev/references/base-ui/packages/react/src/avatar/fallback/AvatarFallback.tsx`
- context/store:
  - `/Users/youngchang/dev/references/base-ui/packages/react/src/avatar/root/AvatarRootContext.ts`
  - `/Users/youngchang/dev/references/base-ui/packages/react/src/avatar/root/stateAttributesMapping.ts`
- internals:
  - `/Users/youngchang/dev/references/base-ui/packages/react/src/internals/useTransitionStatus.ts`
  - `/Users/youngchang/dev/references/base-ui/packages/react/src/internals/useOpenChangeComplete.tsx`
  - `/Users/youngchang/dev/references/base-ui/packages/react/src/internals/useAnimationsFinished.ts`
  - `/Users/youngchang/dev/references/base-ui/packages/react/src/internals/stateAttributesMapping.ts`
- utils:
  - `/Users/youngchang/dev/references/base-ui/packages/utils/src/useTimeout.ts`
  - `/Users/youngchang/dev/references/base-ui/packages/utils/src/useAnimationFrame.ts`
  - `/Users/youngchang/dev/references/base-ui/packages/utils/src/useRefWithInit.ts`
  - `/Users/youngchang/dev/references/base-ui/packages/utils/src/useOnMount.ts`
- tests:
  - `/Users/youngchang/dev/references/base-ui/packages/react/src/avatar/root/AvatarRoot.test.tsx`
  - `/Users/youngchang/dev/references/base-ui/packages/react/src/avatar/image/AvatarImage.test.tsx`
  - `/Users/youngchang/dev/references/base-ui/packages/react/src/avatar/fallback/AvatarFallback.test.tsx`

## 남긴 TODO

- 현재 저장소에 component test harness가 없어서 upstream Avatar 테스트를 로컬 테스트로 이식하지 않았다.
