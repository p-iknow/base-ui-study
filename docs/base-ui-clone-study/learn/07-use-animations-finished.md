# 07. `useAnimationsFinished`가 실제 CSS animation 완료를 기다리는 방식

대상 파일:

- `packages/react/src/internals/useAnimationsFinished.ts`
- `packages/react/src/internals/useOpenChangeComplete.ts`
- `packages/react/src/internals/useTransitionStatus.ts`
- `packages/utils/src/useAnimationFrame.ts`
- `packages/react/src/avatar/image/AvatarImage.tsx`

관련 원본:

- `/Users/youngchang/dev/references/base-ui/packages/react/src/internals/useAnimationsFinished.ts`
- `/Users/youngchang/dev/references/base-ui/packages/react/src/internals/useOpenChangeComplete.tsx`
- `/Users/youngchang/dev/references/base-ui/packages/react/src/internals/useTransitionStatus.ts`

## 전체 역할

`useAnimationsFinished`는 특정 DOM element에 걸린 CSS animation 또는 transition이 모두 끝난 뒤 callback을 실행하는 낮은 레벨 hook이다.

이 hook은 Avatar에서 직접 호출되지 않는다. Avatar에서는 `useOpenChangeComplete`가 이 hook을 사용한다.

```ts
const runOnceAnimationsFinish = useAnimationsFinished(ref, open, false)
```

전체 관계는 다음과 같다.

```txt
Avatar.Image
  imageLoadingStatus로 isVisible을 계산한다.
  useTransitionStatus(isVisible)로 starting/ending 상태를 만든다.

useOpenChangeComplete
  isVisible이 바뀔 때 animation 완료 감시를 시작한다.

useAnimationsFinished
  실제 DOM element의 getAnimations().finished를 기다린다.
  모든 animation이 끝나면 callback을 실행한다.
```

즉 `useTransitionStatus`가 "animation을 걸 수 있는 DOM 상태"를 만들고, `useAnimationsFinished`는 "그 animation이 실제로 끝났는지"를 브라우저 API로 확인한다.

## 함수 시그니처

로컬 구현은 다음 형태다.

```ts
export function useAnimationsFinished(
  elementOrRef: React.RefObject<HTMLElement | null> | HTMLElement | null,
  waitForStartingStyleRemoved = false,
  treatAbortedAsFinished = true,
)
```

세 인자의 의미는 다음과 같다.

- `elementOrRef`: animation 완료를 감시할 DOM element 또는 ref다.
- `waitForStartingStyleRemoved`: `data-starting-style`이 제거된 뒤 animation을 확인할지 여부다.
- `treatAbortedAsFinished`: animation이 중간에 취소되었을 때 완료로 취급할지 여부다.

Avatar에서 `useOpenChangeComplete`는 다음처럼 호출한다.

```ts
const runOnceAnimationsFinish = useAnimationsFinished(ref, open, false)
```

이 호출은 다음 의미를 가진다.

```txt
ref
  Avatar Image의 img element다.

open
  open === true이면 data-starting-style 제거를 기다린 뒤 animation을 확인한다.
  open === false이면 다음 frame에 바로 animation을 확인한다.

false
  animation abort를 완료로 보지 않는다.
  abort 뒤에 새 animation이 있으면 다시 기다린다.
```

## 반환값

`useAnimationsFinished`는 "완료 감시를 시작하는 함수"를 반환한다.

```ts
return useStableCallback(
  (callback: () => void, signal: AbortSignal | null = null) => {
    // animation 완료 후 callback 실행
  },
)
```

즉 hook을 호출한다고 즉시 감시가 시작되는 것이 아니다. 반환된 함수를 호출해야 한다.

`useOpenChangeComplete`는 effect 안에서 반환 함수를 호출한다.

```ts
React.useEffect(() => {
  const abortController = new AbortController()
  runOnceAnimationsFinish(onComplete, abortController.signal)

  return () => {
    abortController.abort()
  }
}, [enabled, open, onComplete, runOnceAnimationsFinish])
```

이 구조 덕분에 `open` 값이 바뀔 때마다 새 감시를 시작하고, 이전 감시는 cleanup에서 abort할 수 있다.

## 기본 흐름

내부 로직을 단계로 풀면 다음과 같다.

```txt
1. 이전에 예약한 animation frame을 취소한다.
2. ref 또는 element에서 실제 DOM element를 얻는다.
3. element가 없으면 종료한다.
4. getAnimations API가 없거나 animation disabled 상태면 callback을 즉시 실행한다.
5. run 함수를 만든다.
6. 필요하면 data-starting-style 제거를 기다린다.
7. 다음 animation frame에 run을 실행한다.
8. run에서 element.getAnimations()를 읽는다.
9. 모든 animation.finished Promise를 기다린다.
10. signal이 abort되지 않았으면 callback을 실행한다.
11. animation이 abort되면 옵션에 따라 완료 처리하거나 현재 animation을 다시 확인한다.
```

## 이전 frame 예약을 취소하는 이유

가장 먼저 실행되는 코드는 다음이다.

```ts
frame.cancel()
```

`frame`은 `useAnimationFrame()`으로 만든 인스턴스다.

```ts
const frame = useAnimationFrame()
```

이 hook은 내부에서 하나의 예약된 frame만 유지한다. 새 감시 요청이 들어오면 이전 frame callback을 취소한다.

예를 들어 open 상태가 빠르게 바뀌면 다음 일이 생길 수 있다.

```txt
1. close 감시 시작
   다음 frame에 getAnimations()를 읽기로 예약

2. 다음 frame이 오기 전에 open 상태로 다시 변경
   새 감시 시작

3. 이전 close frame이 그대로 살아 있으면
   오래된 상태 기준으로 callback이 실행될 수 있음
```

그래서 새 감시를 시작할 때 이전 frame 예약을 먼저 취소한다.

## element 또는 ref 해석

이 hook은 element와 ref를 둘 다 받을 수 있다.

```ts
const element =
  elementOrRef && 'current' in elementOrRef
    ? elementOrRef.current
    : elementOrRef
```

사용 예시는 두 가지다.

```ts
const ref = React.useRef<HTMLDivElement | null>(null)
const run = useAnimationsFinished(ref)
```

또는:

```ts
const element = document.querySelector('[data-popup]') as HTMLElement | null
const run = useAnimationsFinished(element)
```

현재 Avatar 경로에서는 ref를 넘긴다.

```ts
const imageRef = React.useRef<HTMLImageElement | null>(null)
```

ref가 아직 연결되지 않았다면 아무것도 하지 않는다.

```ts
if (!element) {
  return
}
```

이 경우 callback도 실행하지 않는다. 기다릴 대상 자체가 없기 때문이다.

## getAnimations API가 없을 때

다음 분기는 브라우저 지원과 테스트 설정을 처리한다.

```ts
if (
  typeof element.getAnimations !== 'function' ||
  globalThis.BASE_UI_ANIMATIONS_DISABLED
) {
  callback()
  return
}
```

`element.getAnimations()`는 Web Animations API다. 해당 element에 현재 연결된 CSS transition, CSS animation, Web Animation을 `Animation` 객체 배열로 반환한다.

API가 없으면 animation 완료를 정확히 알 방법이 없다. 이때는 기다리지 않고 callback을 즉시 실행한다.

`BASE_UI_ANIMATIONS_DISABLED`는 테스트나 전역 설정에서 animation을 끄고 싶을 때 쓰는 플래그다. 이 값이 true이면 transition lifecycle을 기다리지 않고 바로 완료 처리한다.

예를 들어 테스트에서 다음처럼 설정할 수 있다.

```ts
globalThis.BASE_UI_ANIMATIONS_DISABLED = true
```

그러면 Avatar Image의 exit transition을 기다리지 않고 바로 `setMounted(false)` 흐름으로 넘어간다.

## run 함수의 핵심

실제 대기는 `run` 함수가 담당한다.

```ts
const run = () => {
  Promise.all(
    element.getAnimations().map((animation) => animation.finished),
  )
    .then(() => {
      if (!signal?.aborted) {
        callback()
      }
    })
    .catch(() => {
      // abort 처리
    })
}
```

`getAnimations()`가 반환한 각 `Animation` 객체에는 `finished` Promise가 있다. 이 Promise는 animation이 정상적으로 끝났을 때 resolve된다.

`Promise.all`을 쓰기 때문에 element에 animation이 여러 개 걸려 있으면 모두 끝날 때까지 기다린다.

예를 들어 CSS가 다음과 같다고 하자.

```css
.AvatarImage {
  transition:
    opacity 150ms ease,
    transform 220ms ease;
}

.AvatarImage[data-ending-style] {
  opacity: 0;
  transform: scale(0.96);
}
```

이 경우 브라우저는 opacity transition과 transform transition을 animation 목록으로 노출할 수 있다. `useAnimationsFinished`는 둘 중 하나만 끝났다고 완료 처리하지 않고, 모든 `animation.finished`가 resolve될 때까지 기다린다.

```txt
opacity transition
  150ms 후 finished

transform transition
  220ms 후 finished

Promise.all
  220ms 후 resolve

callback
  그 뒤 실행
```

따라서 Avatar Image는 가장 긴 transition까지 끝난 뒤 unmount된다.

## animation이 없으면 어떻게 되는가

`element.getAnimations()`가 빈 배열을 반환할 수 있다.

```ts
Promise.all([])
```

JavaScript에서 `Promise.all([])`은 즉시 resolve된다. 즉 element에 animation이 없으면 callback은 곧바로 실행된다.

이 동작은 중요하다. 사용자가 Avatar Image에 transition CSS를 주지 않았다면 unmount를 지연할 이유가 없다.

```txt
img[data-ending-style]은 붙었지만 CSS transition 없음
getAnimations() = []
Promise.all([]) 즉시 resolve
setMounted(false)
```

즉 animation이 있으면 기다리고, 없으면 바로 완료된다.

## 왜 바로 run하지 않고 다음 frame에 실행하는가

기본 경로에서는 다음 animation frame에 `run`을 실행한다.

```ts
if (!waitForStartingStyleRemoved) {
  frame.request(run)
  return
}
```

이 한 frame 지연은 CSS transition 등록을 기다리기 위한 것이다.

React commit에서 attribute가 붙은 직후에는 브라우저가 아직 style 계산과 transition 등록을 끝내지 않았을 수 있다.

```txt
현재 commit
  img[data-ending-style] 반영

바로 getAnimations()
  transition이 아직 등록되지 않아 빈 배열일 수 있음

다음 animation frame
  브라우저가 style 계산 완료
  transition이 등록됨
  getAnimations()에서 확인 가능
```

만약 바로 `getAnimations()`를 읽었다가 빈 배열이 나오면 callback이 즉시 실행된다. 그러면 exit transition을 보여 주지 못하고 바로 unmount될 수 있다.

그래서 close animation도 한 frame 뒤에 읽는다.

## waitForStartingStyleRemoved가 필요한 이유

enter animation에서는 close animation보다 한 단계가 더 필요하다.

`useTransitionStatus`는 열릴 때 먼저 `data-starting-style`을 붙인다.

```txt
첫 render
  img[data-starting-style]
  시작 스타일 적용
```

그 다음 frame에서 `data-starting-style`을 제거한다.

```txt
다음 frame
  data-starting-style 제거
  일반 스타일로 전환
  enter transition 시작
```

따라서 open animation을 기다리려면 `data-starting-style`이 제거된 뒤에 `getAnimations()`를 읽어야 한다. 제거되기 전에 읽으면 아직 transition이 시작되지 않았을 수 있다.

이 옵션이 true이면 다음 로직이 실행된다.

```ts
if (!element.hasAttribute('data-starting-style')) {
  frame.request(run)
  return
}
```

이미 starting attribute가 없다면 한 frame 뒤에 run한다.

반대로 attribute가 아직 있으면 `MutationObserver`로 제거를 기다린다.

```ts
const observer = new MutationObserver(() => {
  if (!element.hasAttribute('data-starting-style')) {
    observer.disconnect()
    run()
  }
})

observer.observe(element, {
  attributes: true,
  attributeFilter: ['data-starting-style'],
})
```

예를 들어 enter CSS가 다음과 같다고 하자.

```css
.AvatarImage {
  opacity: 1;
  transform: scale(1);
  transition:
    opacity 160ms ease,
    transform 160ms ease;
}

.AvatarImage[data-starting-style] {
  opacity: 0;
  transform: scale(0.96);
}
```

open 흐름은 다음과 같다.

```txt
1. 이미지 로드 성공
2. useTransitionStatus가 transitionStatus = starting으로 설정
3. img[data-starting-style] 렌더링
4. useOpenChangeComplete가 open=true로 useAnimationsFinished 호출
5. waitForStartingStyleRemoved = true
6. MutationObserver가 data-starting-style 제거를 기다림
7. 다음 frame에 useTransitionStatus가 transitionStatus를 undefined로 변경
8. data-starting-style 제거
9. observer가 run 실행
10. getAnimations().finished 대기
11. enter transition 완료 후 callback 실행
```

Avatar의 현재 `onComplete`는 닫힘일 때만 `setMounted(false)`를 하므로 open 완료 callback은 큰 일을 하지 않는다.

```ts
onComplete() {
  if (!isVisible) {
    setMounted(false)
  }
}
```

그래도 같은 hook으로 open/close completion을 모두 감시할 수 있게 설계되어 있다.

## AbortSignal이 필요한 이유

반환 함수는 optional `AbortSignal`을 받는다.

```ts
(callback: () => void, signal: AbortSignal | null = null) => {
  ...
}
```

완료 시점에는 signal을 확인한다.

```ts
.then(() => {
  if (!signal?.aborted) {
    callback()
  }
})
```

이 signal은 `useOpenChangeComplete`의 effect cleanup과 연결된다.

```ts
const abortController = new AbortController()
runOnceAnimationsFinish(onComplete, abortController.signal)

return () => {
  abortController.abort()
}
```

이 구조가 없으면 오래된 animation 완료 callback이 나중에 실행될 수 있다.

예시는 다음과 같다.

```txt
1. Avatar image가 loaded 상태다.
   open = true
   mounted = true

2. src가 바뀌어서 loading 상태가 된다.
   open = false
   transitionStatus = ending
   close animation 감시 시작

3. close animation이 끝나기 전에 새 src가 빠르게 loaded 된다.
   open = true
   이전 effect cleanup에서 close 감시 signal abort
   새 open 감시 시작

4. 이전 close animation Promise가 뒤늦게 resolve된다.
   signal.aborted === true
   callback 실행 안 함

5. img는 잘못 unmount되지 않는다.
```

AbortSignal은 "이 completion callback이 아직 현재 상태에 유효한가"를 확인하는 장치다.

## animation.finished가 reject되는 경우

`animation.finished` Promise는 animation이 정상 종료되면 resolve되지만, animation이 취소되면 reject될 수 있다.

예를 들어 다음 상황이 가능하다.

```txt
1. img[data-ending-style]로 opacity 1 -> 0 transition 시작
2. transition 도중 className이나 style이 바뀜
3. 기존 transition이 cancel됨
4. 새 transition이 시작되거나 아무 animation도 남지 않음
5. 기존 animation.finished Promise reject
```

이때 catch 블록이 실행된다.

```ts
.catch(() => {
  if (treatAbortedAsFinished) {
    if (!signal?.aborted) {
      callback()
    }
    return
  }

  const activeAnimations = element.getAnimations()
  if (
    !signal?.aborted &&
    activeAnimations.some(
      (animation) =>
        animation.pending || animation.playState !== 'finished',
    )
  ) {
    run()
  }
})
```

## treatAbortedAsFinished가 true인 경우

기본값은 true다.

```ts
treatAbortedAsFinished = true
```

이 경우 animation이 취소되어 `finished` Promise가 reject되면, 그것도 완료로 간주하고 callback을 실행한다.

```txt
animation cancel
  catch 실행

treatAbortedAsFinished = true
  signal이 abort되지 않았으면 callback 실행
```

이 정책은 "animation이 어떤 이유로든 더 이상 진행되지 않으면 작업을 끝내도 된다"는 컴포넌트에 적합하다.

예를 들어 어떤 indicator가 사라지는 중에 animation이 취소되었고, 취소 후 새 animation이 없거나 의미가 없다면 완료로 처리하는 편이 단순하다.

## treatAbortedAsFinished가 false인 경우

Avatar의 `useOpenChangeComplete`는 이 값을 false로 넘긴다.

```ts
useAnimationsFinished(ref, open, false)
```

이 경우 animation cancel을 곧바로 완료로 보지 않는다. 대신 현재 element에 아직 진행 중인 animation이 있는지 다시 확인한다.

```ts
const activeAnimations = element.getAnimations()
if (
  !signal?.aborted &&
  activeAnimations.some(
    (animation) =>
      animation.pending || animation.playState !== 'finished',
  )
) {
  run()
}
```

진행 중인 animation이 있으면 `run()`을 다시 호출한다.

예시는 다음과 같다.

```txt
1. img[data-ending-style]로 fade-out 시작
   opacity 1 -> 0, 150ms

2. 50ms 지점에서 CSS class가 바뀜
   기존 fade-out animation cancel
   새 fade-out animation 시작

3. 기존 animation.finished reject

4. treatAbortedAsFinished = false
   현재 getAnimations() 재확인

5. 새 animation이 pending 또는 running 상태
   run() 재시도

6. 새 animation.finished를 다시 기다림

7. 새 animation까지 끝난 뒤 callback 실행
```

이 정책은 Avatar exit unmount에 중요하다. 기존 animation이 취소되었다고 바로 `setMounted(false)`를 하면, 새로 시작된 exit transition을 보여 주지 못하고 DOM을 제거할 수 있기 때문이다.

## close animation 예시

Avatar Image에 다음 CSS가 있다고 하자.

```css
.AvatarImage {
  opacity: 1;
  transform: scale(1);
  transition:
    opacity 180ms ease,
    transform 180ms ease;
}

.AvatarImage[data-ending-style] {
  opacity: 0;
  transform: scale(0.94);
}
```

이미지가 loaded 상태에서 error 상태로 바뀌면:

```txt
imageLoadingStatus = error
isVisible = false
```

`useTransitionStatus`가 닫힘 상태를 만든다.

```txt
mounted = true
transitionStatus = ending
```

DOM은 다음 상태가 된다.

```html
<img class="AvatarImage" data-ending-style src="..." />
```

`useOpenChangeComplete`는 close 감시를 시작한다.

```txt
open = false
waitForStartingStyleRemoved = false
treatAbortedAsFinished = false
```

`useAnimationsFinished`는 다음 frame에 animation 목록을 읽는다.

```txt
getAnimations()
  opacity transition
  transform transition
```

두 transition이 모두 끝나면 callback이 실행된다.

```ts
onComplete() {
  if (!isVisible) {
    setMounted(false)
  }
}
```

그 결과 `<img>`가 DOM에서 제거된다.

## animation이 없는 close 예시

사용자가 아무 transition CSS도 작성하지 않았다면 다음과 같다.

```css
.AvatarImage[data-ending-style] {
  opacity: 0;
}
```

`transition` 속성이 없으므로 브라우저 animation 목록은 비어 있다.

```txt
getAnimations() = []
Promise.all([]) 즉시 resolve
callback 즉시 실행
setMounted(false)
```

즉 `data-ending-style`은 붙지만 사용자에게 보이는 exit animation 없이 바로 unmount된다. 이 동작도 자연스럽다. CSS transition이 없으면 기다릴 이유가 없기 때문이다.

## open animation 예시

enter CSS가 다음과 같다고 하자.

```css
.AvatarImage {
  opacity: 1;
  transform: scale(1);
  transition:
    opacity 160ms ease,
    transform 160ms ease;
}

.AvatarImage[data-starting-style] {
  opacity: 0;
  transform: scale(0.96);
}
```

이미지가 loaded가 되면 `useTransitionStatus`가 `starting`을 만든다.

```txt
open = true
mounted = true
transitionStatus = starting
```

첫 DOM 상태는 다음과 같다.

```html
<img class="AvatarImage" data-starting-style src="..." />
```

`useAnimationsFinished`는 `waitForStartingStyleRemoved = true`이므로 `data-starting-style`이 제거될 때까지 기다린다.

다음 frame에 `useTransitionStatus`가 `transitionStatus`를 `undefined`로 바꾸면 DOM은 다음처럼 된다.

```html
<img class="AvatarImage" src="..." />
```

이때 브라우저는 `opacity: 0 -> 1`, `transform: scale(0.96) -> scale(1)` transition을 시작한다. 그 뒤 `getAnimations().finished`를 기다릴 수 있다.

Avatar 현재 로직에서는 open 완료 callback이 특별히 상태를 바꾸지 않는다. 그래도 같은 completion pipeline을 사용하면 나중에 다른 컴포넌트에서 open 완료 후 focus 이동, mounted 상태 확정, popup lifecycle 후처리 같은 일을 붙일 수 있다.

## MutationObserver cleanup

`waitForStartingStyleRemoved`가 true이고 `data-starting-style`이 아직 있으면 observer를 만든다.

```ts
const observer = new MutationObserver(() => {
  if (!element.hasAttribute('data-starting-style')) {
    observer.disconnect()
    run()
  }
})
```

그리고 signal이 abort되면 observer도 정리한다.

```ts
signal?.addEventListener('abort', () => observer.disconnect(), {
  once: true,
})
```

이 cleanup이 필요한 이유는 open 감시 도중 상태가 바뀔 수 있기 때문이다.

```txt
1. open=true
   data-starting-style 제거를 기다리는 observer 생성

2. 제거되기 전에 open=false로 변경
   useOpenChangeComplete cleanup에서 signal abort

3. observer disconnect
   이전 open 감시가 더 이상 run을 실행하지 않음
```

observer를 정리하지 않으면 오래된 observer가 나중에 attribute 제거를 보고 stale `run`을 실행할 수 있다.

## useAnimationFrame과의 관계

`useAnimationsFinished`는 `useAnimationFrame`을 통해 frame callback을 예약한다.

```ts
const frame = useAnimationFrame()
```

`useAnimationFrame`은 다음 기능을 제공한다.

- 같은 인스턴스에서 이전 frame 예약을 취소할 수 있다.
- 컴포넌트 unmount 시 예약된 frame을 정리한다.
- 여러 request를 내부 queue로 관리한다.

`useAnimationsFinished`가 `requestAnimationFrame`을 직접 쓰지 않고 이 utility를 쓰는 이유는 cleanup을 hook lifecycle에 맞추기 위해서다.

```txt
component unmount
  useAnimationFrame disposeEffect 실행
  예약된 frame cancel
```

animation 완료 감시는 비동기 흐름이므로 frame cleanup이 없으면 unmount 이후 callback이 실행될 가능성이 커진다.

## 원본 Base UI와 로컬 구현의 차이

원본과 로컬 구현은 구조가 거의 같다. 다만 study 구현에서는 몇 가지를 단순화했다.

### 1. ref 해석

원본은 `resolveRef` helper를 사용한다.

```ts
const element = resolveRef(elementOrRef)
```

로컬은 inline으로 처리한다.

```ts
const element =
  elementOrRef && 'current' in elementOrRef
    ? elementOrRef.current
    : elementOrRef
```

현재 Avatar phase에서는 ref 또는 element만 처리하면 충분하므로 별도 helper를 만들지 않았다.

### 2. 완료 callback flush

원본은 완료 callback을 `ReactDOM.flushSync`로 감싼다.

```ts
ReactDOM.flushSync(fnToExecute)
```

로컬은 직접 callback을 호출한다.

```ts
callback()
```

원본의 의도는 animation 완료 직후 unmount 같은 상태 변경을 동기적으로 flush해서, 브라우저가 애매한 중간 상태를 paint하지 않게 하는 것이다.

로컬 study 구현은 Avatar phase의 핵심 lifecycle을 이해하는 데 집중하기 위해 이 부분을 단순화했다.

### 3. attribute 이름

원본은 `TransitionStatusDataAttributes.startingStyle` 상수를 사용한다.

```ts
const startingStyleAttribute = TransitionStatusDataAttributes.startingStyle
```

로컬은 문자열을 직접 사용한다.

```ts
element.hasAttribute('data-starting-style')
```

현재는 충분하지만, attribute 이름을 한 곳에서 관리하려면 원본처럼 enum을 공유하는 편이 좋다.

## 이 hook이 없으면 생기는 문제

`useAnimationsFinished` 없이 timeout으로 처리하면 CSS와 JS가 같은 duration을 중복으로 알아야 한다.

```css
.AvatarImage {
  transition: opacity 180ms ease;
}
```

```ts
setTimeout(() => {
  setMounted(false)
}, 180)
```

이 방식은 다음 상황에서 쉽게 깨진다.

- 사용자가 CSS duration을 240ms로 override한다.
- media query에서 reduced motion일 때 duration이 달라진다.
- opacity와 transform의 duration이 서로 다르다.
- animation이 중간에 cancel되고 새 animation이 시작된다.
- transition이 아예 없는 경우에도 불필요하게 기다린다.

`useAnimationsFinished`는 실제 DOM에 등록된 animation을 읽기 때문에 이런 문제를 줄인다.

```txt
transition 있음
  실제 transition.finished를 기다림

transition 여러 개
  모두 끝날 때까지 기다림

transition 없음
  즉시 완료

animation cancel 후 새 animation 있음
  새 animation을 다시 기다릴 수 있음
```

## 최종 정리

`useAnimationsFinished`는 Base UI transition pipeline의 가장 아래쪽에 있는 DOM 관찰 hook이다.

```txt
useTransitionStatus
  starting/ending 상태를 만든다.
  data-starting-style, data-ending-style을 DOM에 노출한다.

useOpenChangeComplete
  open 값 변화에 맞춰 완료 감시를 시작한다.
  effect cleanup으로 stale 감시를 abort한다.

useAnimationsFinished
  requestAnimationFrame과 getAnimations().finished를 사용한다.
  실제 CSS animation/transition 완료를 기다린다.
  완료 후 callback을 실행한다.
```

Avatar에서는 이 조합 덕분에 이미지가 로드될 때 자연스럽게 enter transition을 줄 수 있고, 이미지가 사라질 때 exit transition이 끝난 뒤 정확히 unmount할 수 있다.

