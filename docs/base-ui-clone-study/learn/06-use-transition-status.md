# 06. `useTransitionStatus`가 mount와 transition을 분리하는 방식

대상 파일:

- `packages/react/src/internals/useTransitionStatus.ts`
- `packages/react/src/internals/stateAttributesMapping.ts`
- `packages/react/src/internals/useOpenChangeComplete.ts`
- `packages/react/src/avatar/image/AvatarImage.tsx`

관련 원본:

- `/Users/youngchang/dev/references/base-ui/packages/react/src/internals/useTransitionStatus.ts`
- `/Users/youngchang/dev/references/base-ui/packages/react/src/internals/stateAttributesMapping.ts`
- `/Users/youngchang/dev/references/base-ui/packages/react/src/avatar/image/AvatarImage.tsx`

## 전체 역할

`useTransitionStatus`는 `open`이라는 목표 상태를 받아서 실제 DOM mount 여부와 CSS transition phase를 분리해 주는 hook이다.

Avatar에서는 `Avatar.Image`가 이 hook을 사용한다.

```ts
const isVisible = imageLoadingStatus === 'loaded'
const { mounted, setMounted, transitionStatus } =
  useTransitionStatus(isVisible)
```

여기서 `isVisible`은 "이미지가 로드되어 보여야 하는가"이고, `mounted`는 "실제 `<img>`를 DOM에 남겨 둘 것인가"다.

둘을 분리하는 이유는 exit animation 때문이다. 닫히는 순간 DOM을 바로 제거하면 `data-ending-style`을 붙일 대상이 사라져서 사라지는 transition을 실행할 수 없다.

## 반환값의 의미

`useTransitionStatus`는 세 값을 반환한다.

```ts
return {
  mounted,
  setMounted,
  transitionStatus,
}
```

- `mounted`: 실제 DOM 렌더링 여부다.
- `setMounted`: animation 완료 후 외부에서 unmount를 확정할 때 사용한다.
- `transitionStatus`: 현재 transition phase다.

`transitionStatus` 타입은 다음과 같다.

```ts
export type TransitionStatus = 'starting' | 'ending' | 'idle' | undefined
```

현재 로컬 구현에서는 `idle` 타입은 남아 있지만 실제 흐름에서는 `starting`, `ending`, `undefined`만 사용한다. 원본 Base UI에는 `enableIdleState`, `deferEndingState` 옵션이 있어 더 넓은 transition 흐름을 처리하지만, 로컬 구현은 Avatar phase에 필요한 최소 경로만 구현했다.

## open과 mounted는 왜 다른가

transition이 없는 컴포넌트라면 `mounted = open`으로 충분하다.

```txt
open = true
  DOM 렌더링

open = false
  DOM 제거
```

하지만 exit animation을 지원하려면 `open = false`가 되는 순간에도 DOM이 잠시 남아 있어야 한다.

```txt
open = false
mounted = true
transitionStatus = ending
DOM은 남아 있고 data-ending-style이 붙음
```

그 뒤 실제 animation 또는 transition이 끝났을 때 `mounted = false`로 바꾼다.

```txt
animation 완료
mounted = false
DOM 제거
```

따라서 `open`은 목표 상태이고, `mounted`는 실제 DOM 생존 상태다.

## 초기 상태

로컬 구현의 초기 상태는 다음과 같다.

```ts
const [mounted, setMounted] = React.useState(open)
const [transitionStatus, setTransitionStatus] =
  React.useState<TransitionStatus>(undefined)
```

처음부터 `open`이면 바로 mount된 상태로 시작한다.

```txt
초기 open = true
  mounted = true
  transitionStatus = undefined
```

처음부터 닫힌 상태면 DOM을 만들지 않는다.

```txt
초기 open = false
  mounted = false
  transitionStatus = undefined
```

초기 렌더에서는 `starting`을 주지 않는다. 즉 "처음부터 열려 있는 상태"와 "닫혀 있다가 나중에 열리는 상태"를 구분한다.

## 열리는 흐름

열리는 조건은 다음 분기에서 처리된다.

```ts
if (open && !mounted) {
  setMounted(true)
  setTransitionStatus('starting')
}
```

이 분기는 목표 상태는 열림인데 아직 DOM이 mount되어 있지 않을 때 실행된다.

Avatar Image 기준으로는 이미지 로딩이 성공한 순간이다.

```txt
이전 상태
  imageLoadingStatus = loading
  open = false
  mounted = false

이미지 로드 성공
  imageLoadingStatus = loaded
  open = true
  mounted = false

useTransitionStatus 보정
  mounted = true
  transitionStatus = starting
```

그 결과 `<img>`가 렌더링되고 `transitionStatusMapping`을 통해 `data-starting-style`이 붙을 수 있다.

```ts
if (value === 'starting') {
  return { 'data-starting-style': '' }
}
```

이 상태는 enter transition의 시작점을 표현한다.

## 열림 완료 처리

열림 상태에서는 layout effect가 다음 animation frame에 `transitionStatus`를 정리한다.

```ts
useIsoLayoutEffect(() => {
  if (!open) {
    return undefined
  }

  const frame = AnimationFrame.request(() => {
    setTransitionStatus(undefined)
  })

  return () => {
    AnimationFrame.cancel(frame)
  }
}, [open])
```

흐름은 다음과 같다.

```txt
open = true로 변경
  mounted = true
  transitionStatus = starting
  img[data-starting-style]

다음 animation frame
  transitionStatus = undefined
  data-starting-style 제거
  img 일반 상태
```

첫 frame에 starting style을 적용하고 다음 frame에 attribute를 제거하면, 브라우저는 starting style에서 일반 style로 transition할 수 있다.

예를 들어 CSS가 다음과 같다면:

```css
.AvatarImage {
  opacity: 1;
  transition: opacity 150ms ease;
}

.AvatarImage[data-starting-style] {
  opacity: 0;
}
```

처음 렌더된 frame에서는 `opacity: 0`이고, 다음 frame에 `data-starting-style`이 제거되면 `opacity: 1`로 transition된다.

## 닫히는 흐름

닫히는 조건은 다음 분기에서 처리된다.

```ts
if (!open && mounted && transitionStatus !== 'ending') {
  setTransitionStatus('ending')
}
```

여기서 중요한 점은 `setMounted(false)`를 하지 않는다는 것이다. 닫힘이 시작되었을 뿐이고, exit animation이 끝나기 전까지 DOM은 유지되어야 한다.

Avatar Image 기준으로는 이미지가 더 이상 `loaded`가 아닌 상태가 되었을 때다.

```txt
이전 상태
  imageLoadingStatus = loaded
  open = true
  mounted = true
  transitionStatus = undefined

src 변경, loading 재시작, error 등
  imageLoadingStatus = loading 또는 error
  open = false
  mounted = true

useTransitionStatus 보정
  mounted = true 유지
  transitionStatus = ending
```

`ending` 상태는 mapping을 통해 `data-ending-style`로 노출된다.

```ts
if (value === 'ending') {
  return { 'data-ending-style': '' }
}
```

CSS는 이 attribute를 이용해 exit transition을 줄 수 있다.

```css
.AvatarImage {
  opacity: 1;
  transition: opacity 150ms ease;
}

.AvatarImage[data-ending-style] {
  opacity: 0;
}
```

## 닫힘 완료는 이 hook이 직접 판단하지 않는다

`useTransitionStatus`는 닫힘 상태를 `ending`으로 만들지만, animation이 끝났는지는 직접 알지 않는다.

닫힘 완료는 `useOpenChangeComplete`가 DOM animation을 관찰해서 처리한다.

```ts
useOpenChangeComplete({
  open: isVisible,
  ref: imageRef,
  onComplete() {
    if (!isVisible) {
      setMounted(false)
    }
  },
})
```

역할을 나누면 다음과 같다.

```txt
useTransitionStatus
  open 변화에 맞춰 mounted와 starting/ending 상태를 만든다.

useOpenChangeComplete
  실제 DOM animation/transition 완료를 기다린다.
  완료 후 setMounted(false)를 호출한다.
```

이 분리가 중요하다. `useTransitionStatus`가 임의의 timeout으로 `mounted`를 내리면 CSS duration과 JS duration을 맞춰야 한다. Base UI는 CSS를 public styling surface로 열어 두기 때문에 실제 DOM animation 완료를 기준으로 unmount하는 편이 더 자연스럽다.

## unmount 후 transitionStatus 정리

`setMounted(false)`가 호출된 뒤에는 다음 분기가 transition 상태를 정리한다.

```ts
if (!open && !mounted && transitionStatus === 'ending') {
  setTransitionStatus(undefined)
}
```

흐름은 다음과 같다.

```txt
닫힘 시작
  open = false
  mounted = true
  transitionStatus = ending

animation 완료
  setMounted(false)

다음 render
  open = false
  mounted = false
  transitionStatus = ending

useTransitionStatus 정리
  transitionStatus = undefined
```

DOM이 이미 제거된 뒤에는 `ending` 상태를 유지할 이유가 없으므로 내부 상태를 기본값으로 되돌린다.

## render 중 setState를 하는 이유

이 구현에서 눈에 띄는 부분은 render 중에 `setMounted`와 `setTransitionStatus`를 호출한다는 점이다.

```ts
if (open && !mounted) {
  setMounted(true)
  setTransitionStatus('starting')
}

if (!open && mounted && transitionStatus !== 'ending') {
  setTransitionStatus('ending')
}
```

일반적으로 render 중 setState는 피해야 한다. 하지만 이 hook은 새 `open` 값이 반영되는 commit 전에 mount와 transition phase를 맞춰야 한다.

예를 들어 `open`이 `true`가 되었는데 effect에서 나중에 `mounted`를 true로 만들면, 한 번의 commit 동안 DOM이 없는 상태가 지나갈 수 있다. 그러면 starting style이 붙은 첫 paint를 놓칠 수 있다.

반대로 render 단계에서 상태를 보정하면 다음 commit에 다음 값들이 함께 반영된다.

```txt
open = true
mounted = true
transitionStatus = starting
```

닫힐 때도 마찬가지다. `open = false`가 된 commit에서 바로 `transitionStatus = ending`을 만들어야 기존 DOM이 `data-ending-style`을 받을 수 있다.

무한 render loop를 피하려면 각 분기가 다음 render에서 수렴해야 한다. 로컬 구현의 조건들은 한 번 상태가 바뀌면 같은 분기가 계속 실행되지 않도록 구성되어 있다.

```txt
open && !mounted
  mounted를 true로 바꾸므로 다음 render에서 false가 됨

!open && mounted && transitionStatus !== ending
  transitionStatus를 ending으로 바꾸므로 다음 render에서 false가 됨

!open && !mounted && transitionStatus === ending
  transitionStatus를 undefined로 바꾸므로 다음 render에서 false가 됨
```

## `useIsoLayoutEffect`를 쓰는 이유

열림 완료 처리는 `useIsoLayoutEffect`에서 한다.

```ts
useIsoLayoutEffect(() => {
  if (!open) {
    return undefined
  }

  const frame = AnimationFrame.request(() => {
    setTransitionStatus(undefined)
  })

  return () => {
    AnimationFrame.cancel(frame)
  }
}, [open])
```

`useIsoLayoutEffect`는 브라우저 환경에서는 layout effect처럼 동작하고, 서버 환경에서는 hydration warning을 피하기 위한 형태로 동작하는 utility다.

여기서는 DOM이 commit된 직후 다음 frame에 starting attribute를 제거해야 하므로 layout timing이 중요하다. effect cleanup에서 예약한 frame을 취소하는 것도 중요하다. open 상태가 빠르게 바뀌면 이전 frame callback이 늦게 실행되어 현재 transition state를 잘못 지울 수 있기 때문이다.

## 상태 머신으로 보기

Avatar Image 기준 전체 상태는 다음처럼 볼 수 있다.

```txt
초기: 이미지 없음 또는 loading
  open = false
  mounted = false
  transitionStatus = undefined
  img 없음

이미지 로드 성공
  open = true
  mounted = true
  transitionStatus = starting
  img[data-starting-style]

다음 frame
  open = true
  mounted = true
  transitionStatus = undefined
  img 일반 상태

이미지가 다시 visible하지 않게 됨
  open = false
  mounted = true
  transitionStatus = ending
  img[data-ending-style]

animation/transition 완료
  setMounted(false)

정리
  open = false
  mounted = false
  transitionStatus = undefined
  img 없음
```

## 원본 Base UI와 로컬 구현의 차이

원본 Base UI의 `useTransitionStatus`는 다음 옵션을 추가로 받는다.

```ts
export function useTransitionStatus(
  open: boolean,
  enableIdleState: boolean = false,
  deferEndingState: boolean = false,
)
```

로컬 구현은 현재 다음 형태다.

```ts
export function useTransitionStatus(open: boolean)
```

Avatar phase에서는 기본 enter/exit lifecycle만 필요하므로 옵션을 줄였다.

원본의 `enableIdleState`는 열림 상태에서 `starting` 이후 `idle` 상태를 명시적으로 둘 수 있게 한다. 로컬 구현은 starting 이후 `undefined`로 돌아간다.

원본의 `deferEndingState`는 닫힘 상태로 바뀌었을 때 `ending` 적용을 한 frame 지연할 수 있게 한다. 일부 컴포넌트에서는 닫힘 직전 layout이나 style 계산 순서가 더 복잡해서 이 옵션이 필요하다.

현재 Avatar에서는 다음만 필요하다.

- 닫혀 있다가 열릴 때 `starting`을 준다.
- 열림 시작 다음 frame에 `starting`을 제거한다.
- 열려 있다가 닫힐 때 `ending`을 준다.
- animation 완료 후 외부에서 `mounted`를 false로 내린다.

그래서 로컬 구현은 원본의 넓은 옵션을 아직 가져오지 않고, Avatar가 실제로 쓰는 경로만 남긴 학습용 구현이다.

## `useOpenChangeComplete`와 함께 이해해야 하는 이유

`useTransitionStatus`만 보면 `ending` 상태에서 언제 unmount되는지가 보이지 않는다. 이 hook은 의도적으로 그 결정을 하지 않는다.

닫힘 완료까지 포함한 전체 책임은 두 hook이 함께 나눠 가진다.

```txt
1. open이 false가 됨
2. useTransitionStatus가 transitionStatus = ending으로 만듦
3. img[data-ending-style] 상태로 CSS exit transition 실행
4. useOpenChangeComplete가 element.getAnimations().finished를 기다림
5. 완료되면 setMounted(false)
6. useTransitionStatus가 transitionStatus를 undefined로 정리
```

따라서 Avatar에서 자연스러운 이미지 fade-in/fade-out을 만들려면 `useTransitionStatus`와 `useOpenChangeComplete`를 한 세트로 이해해야 한다.

