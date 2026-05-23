# 09. React render/commit과 browser animation frame의 순서

대상 파일:

- `packages/react/src/internals/useTransitionStatus.ts`
- `packages/react/src/internals/useOpenChangeComplete.ts`
- `packages/react/src/internals/useAnimationsFinished.ts`
- `packages/utils/src/useAnimationFrame.ts`

관련 문서:

- `docs/base-ui-clone-study/learn/05-use-open-change-complete.md`
- `docs/base-ui-clone-study/learn/06-use-transition-status.md`
- `docs/base-ui-clone-study/learn/07-use-animations-finished.md`
- `docs/base-ui-clone-study/learn/08-use-animation-frame-and-ref-with-init.md`

## 이 문서의 질문

`useAnimationsFinished`와 `useTransitionStatus`는 callback을 바로 실행하지 않고 `requestAnimationFrame`으로 다음 frame에 넘긴다.

이때 의문은 다음과 같다.

```txt
animation frame 하나는 대략 16ms 정도다.
다음 frame으로 넘겨도 animation 자체가 끊기지 않을 수 있다.
그렇다면 다음 frame에 callback을 등록하는 것이 어떤 의미가 있는가?
```

결론부터 말하면, 여기서 frame을 넘기는 목적은 "16ms 정도 기다리기"가 아니다.

목적은 React가 DOM을 바꾼 시점과 browser가 그 DOM 변경을 style, transition, animation 상태로 해석하는 시점을 분리하는 것이다.

```txt
React commit
  DOM attribute/class/style 변경

browser rendering pipeline
  style recalculation
  transition 생성
  animation timeline 갱신
  paint/composite

useAnimationsFinished
  transition이 browser에 등록된 뒤 getAnimations()를 읽고 싶음
```

따라서 `requestAnimationFrame`은 시간 지연 장치라기보다 frame boundary 장치다.

## 전체 흐름 요약

Avatar image의 open/close transition을 기준으로 보면 큰 흐름은 다음과 같다.

```txt
1. React render phase
   새 React tree를 계산한다.
   아직 DOM은 바뀌지 않는다.

2. React commit phase
   실제 DOM을 변경한다.
   data-starting-style 또는 data-ending-style이 DOM에 붙는다.
   ref.current가 연결된다.
   layout effect가 실행된다.

3. browser rendering opportunity
   requestAnimationFrame callback들이 실행된다.
   필요한 style 계산, layout, animation update, paint가 일어난다.

4. passive effect
   useEffect callback이 실행된다.
   React와 browser 스케줄링에 따라 paint 전후 타이밍은 달라질 수 있지만,
   pre-paint DOM 보정 수단으로 쓰면 안 된다.
```

더 정확하게는 `requestAnimationFrame` callback은 다음 paint 전에 실행된다. 그래서 rAF 안에서 DOM을 읽으면 browser가 필요한 style 계산을 flush할 수 있다.

```txt
이전 JS task
  React commit
  DOM mutation
  layout effect

다음 rendering opportunity
  rAF callbacks
  style/layout/animation update
  paint/composite
```

실무적으로 중요한 점은 "React commit 직후 같은 JS 흐름에서 바로 읽는 것"과 "다음 frame boundary에서 읽는 것"이 다르다는 것이다.

## React render phase

render phase는 React가 다음 UI 상태를 계산하는 단계다.

```txt
component function 실행
props/state/context 읽기
JSX 반환
새 React tree 계산
```

이 단계에서는 DOM을 바꾸지 않는다.

예를 들어 컴포넌트가 다음 JSX를 반환해도:

```tsx
<img className="AvatarImage" data-ending-style="" />
```

render phase 중에는 실제 DOM에 아직 `data-ending-style`이 붙지 않았다.

```txt
render phase
  React tree 안에는 data-ending-style이 있음
  실제 DOM에는 아직 없음
  browser style recalculation도 아직 없음
  CSS transition도 아직 생성되지 않음
```

따라서 render phase에서 animation을 관찰할 수는 없다.

## Render-phase update

로컬 `useTransitionStatus`는 render 중 state update를 사용한다.

```ts
if (open && !mounted) {
  setMounted(true)
  setTransitionStatus('starting')
}

if (!open && mounted && transitionStatus !== 'ending') {
  setTransitionStatus('ending')
}
```

이 패턴은 일반적인 business logic에서는 조심해야 하지만, 여기서는 transition 상태를 다음 commit에 맞추기 위해 제한적으로 쓴다.

목적은 다음과 같다.

```txt
open true
  mounted true와 starting 상태를 같은 commit에 반영
  새 DOM이 처음 나타날 때 data-starting-style을 받을 수 있음

open false
  mounted는 유지하고 ending 상태를 같은 commit에 반영
  기존 DOM이 제거되지 않고 data-ending-style을 받을 수 있음
```

만약 닫힐 때 바로 `mounted = false`가 commit되면 `data-ending-style`을 붙일 DOM 자체가 사라진다.

```txt
잘못된 exit 흐름
  open false
  mounted false
  img unmount
  data-ending-style 대상 없음
  exit transition 불가능
```

그래서 exit에서는 DOM을 남겨 둔 채 `ending` 상태만 먼저 노출한다.

```txt
올바른 exit 흐름
  open false
  mounted true 유지
  transitionStatus ending
  img[data-ending-style] commit
  animation 완료 후 mounted false
```

## React commit phase

commit phase에서 React는 render 결과를 실제 DOM에 반영한다.

이 단계에서 일어나는 일은 다음과 같다.

```txt
DOM node 생성
DOM node 삭제
attribute 변경
className 변경
inline style 변경
textContent 변경
ref.current 연결/해제
layout effect cleanup
layout effect 실행
```

Avatar image exit에서는 commit 결과가 대략 다음처럼 된다.

```html
<img class="AvatarImage" data-ending-style="" src="..." />
```

Avatar image enter에서는 commit 결과가 대략 다음처럼 된다.

```html
<img class="AvatarImage" data-starting-style="" src="..." />
```

여기서 중요한 구분이 있다.

```txt
DOM attribute가 붙었다
  React commit의 책임

CSS transition 객체가 생성되었다
  browser style/animation update의 책임
```

React commit이 끝났다고 해서 browser가 이미 transition 객체까지 만들었다고 볼 수는 없다.

## DOM mutation과 computed style의 차이

DOM mutation은 attribute나 class가 실제 DOM node에 반영되는 것이다.

```html
<img class="AvatarImage" data-ending-style="" />
```

computed style은 browser가 stylesheet, cascade, inheritance, media query, pseudo-state 등을 모두 반영해서 계산한 최종 style 값이다.

```css
.AvatarImage {
  opacity: 1;
  transition: opacity 180ms ease;
}

.AvatarImage[data-ending-style] {
  opacity: 0;
}
```

위 CSS에서 React가 `data-ending-style`을 붙이면 DOM은 즉시 바뀐다. 하지만 browser는 이후 style update에서 다음을 계산한다.

```txt
이전 computed opacity
  1

새 computed opacity
  0

transition 설정
  opacity 180ms ease

결과
  CSS transition 생성 가능
```

이 계산은 React가 하지 않는다. browser rendering engine이 한다.

## useLayoutEffect의 위치

`useLayoutEffect`는 DOM mutation 이후, browser가 화면을 그리기 전에 동기적으로 실행된다.

```txt
React commit
  DOM mutation
  ref 연결
  useLayoutEffect cleanup
  useLayoutEffect callback

paint
```

그래서 `useLayoutEffect`는 다음 작업에 적합하다.

```txt
DOM 크기 측정
scroll 위치 보정
paint 전에 class/style 보정
```

하지만 `useLayoutEffect`가 실행된다는 것은 "DOM이 바뀌었다"는 뜻이지, "browser가 transition 객체를 확정했다"는 뜻은 아니다.

```txt
commit에서 data-ending-style 붙음
useLayoutEffect 바로 실행
getAnimations() 실행
  아직 transition이 등록되기 전이면 [] 가능
```

즉 `useLayoutEffect`는 DOM mutation 이후이지만 animation 관찰에는 여전히 이를 수 있다.

## useTransitionStatus에서 rAF를 쓰는 이유

`useTransitionStatus`는 open 상태에서 `starting` 상태를 만든 뒤, 다음 frame에 `starting`을 제거한다.

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

이 rAF의 목적은 enter transition의 시작점과 끝점을 분리하는 것이다.

```txt
frame A
  img mount
  data-starting-style 있음
  CSS 시작 스타일을 줄 수 있음

frame B
  data-starting-style 제거
  일반 스타일로 돌아감
  시작 스타일 -> 일반 스타일 transition 가능
```

예를 들어 CSS가 다음과 같다고 하자.

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

enter transition이 자연스럽게 발생하려면 browser가 먼저 `opacity: 0`, `transform: scale(0.96)` 상태를 실제 시작 style로 인식해야 한다.

그 다음 `data-starting-style`이 제거되어 `opacity: 1`, `transform: scale(1)`이 되면 transition이 생긴다.

```txt
좋은 enter 흐름
  commit 1
    img[data-starting-style]
    starting style 적용 가능

  next frame
    data-starting-style 제거
    final style로 변경
    transition 시작
```

만약 mount와 동시에 starting style을 붙였다가 같은 synchronous 흐름에서 바로 제거하면 browser가 시작 상태를 관찰할 frame을 얻지 못할 수 있다.

```txt
나쁜 enter 흐름
  img mount
  data-starting-style 붙음
  바로 data-starting-style 제거
  browser가 시작 style을 별도 상태로 인식하지 못함
  transition 없이 최종 style로 나타날 수 있음
```

따라서 `useTransitionStatus`의 rAF는 "enter animation을 기다리는 장치"가 아니라 "starting style을 한 frame 동안 DOM에 노출시키는 장치"다.

## CSS transition 생성 조건

CSS transition은 단순히 `transition` 속성이 있다고 항상 생성되는 것이 아니다.

다음 조건이 맞아야 한다.

```txt
transition-property가 대상 property를 포함한다.
duration 또는 delay가 의미 있는 값을 가진다.
이전 computed value와 새 computed value가 다르다.
browser가 두 computed value의 변화 순서를 인식한다.
property가 transition 가능한 type이다.
```

예를 들어:

```css
.AvatarImage {
  opacity: 1;
  transition: opacity 180ms ease;
}

.AvatarImage[data-ending-style] {
  opacity: 0;
}
```

이미 이전 frame에서 `opacity: 1`이던 element에 `data-ending-style`이 붙으면 browser는 다음 변화를 볼 수 있다.

```txt
opacity 1 -> 0
transition opacity 180ms ease
```

그래서 exit transition을 만들 수 있다.

반대로 element가 처음 mount될 때 이미 최종 style만 가지고 있으면 browser는 이전 값을 비교할 수 없다.

```txt
처음 mount
  opacity 1

이전 computed opacity
  없음

결과
  opacity 0 -> 1 transition을 만들 시작점이 없음
```

그래서 enter에서는 `data-starting-style`이 필요하다.

## getAnimations가 읽는 대상

`element.getAnimations()`는 DOM attribute를 읽는 API가 아니다.

이 API는 browser가 해당 element에 연결한 Web Animation, CSS Animation, CSS Transition 객체를 반환한다.

```txt
DOM
  data-ending-style이 붙어 있음

CSS
  data-ending-style에 의해 opacity가 바뀜

browser animation engine
  CSS transition 객체 생성

getAnimations()
  생성된 Animation 객체 목록 반환
```

따라서 `getAnimations()`가 의미 있게 동작하려면 browser가 transition을 생성할 기회가 있어야 한다.

## commit 직후 getAnimations를 바로 읽으면 생길 수 있는 문제

exit 흐름에서 React commit 직후 바로 `getAnimations()`를 읽는다고 하자.

```txt
현재 JS task
  React commit
    img[data-ending-style] 반영

  바로 getAnimations()
    browser가 아직 transition 객체를 만들기 전이면 []

  Promise.all([])
    즉시 resolve

  callback()
    setMounted(false)
    img unmount
```

결과는 다음과 같다.

```txt
data-ending-style은 DOM에 잠깐 붙었지만
animation 완료를 기다리지 못하고
img가 바로 unmount될 수 있음
```

이 문제 때문에 `useAnimationsFinished`는 바로 `run()`을 호출하지 않고 다음 frame에 넘긴다.

```ts
if (!waitForStartingStyleRemoved) {
  frame.request(run)
  return
}
```

## useAnimationsFinished에서 rAF를 쓰는 이유

`useAnimationsFinished`의 rAF는 `useTransitionStatus`의 rAF와 목적이 다르다.

```txt
useTransitionStatus의 rAF
  data-starting-style 제거를 다음 frame으로 미룬다.
  enter transition을 만들 시작 style을 DOM에 노출한다.

useAnimationsFinished의 rAF
  getAnimations() 읽기를 다음 frame으로 미룬다.
  browser가 transition을 생성한 뒤 관찰하려는 목적이다.
```

`useAnimationsFinished`의 기본 close 흐름은 다음과 같다.

```txt
1. open false
2. useTransitionStatus가 transitionStatus ending으로 변경
3. React commit
4. img[data-ending-style] DOM 반영
5. useOpenChangeComplete effect가 animation 완료 감시 시작
6. useAnimationsFinished가 run을 다음 frame에 예약
7. 다음 frame에서 getAnimations() 읽기
8. 모든 animation.finished Promise 대기
9. 완료 후 setMounted(false)
```

이때 rAF는 animation을 "16ms 동안 기다린다"는 의미가 아니다.

```txt
React commit과 같은 synchronous 흐름에서 너무 빨리 읽지 않는다.
browser rendering pipeline의 frame boundary를 지난 뒤 읽는다.
```

## rAF와 style flush

HTML event loop에서 rAF callback은 보통 paint 전에 실행된다. style/layout 계산은 browser가 필요할 때 지연할 수 있고, rAF callback 안에서 DOM style 관련 API를 읽으면 browser가 pending style 계산을 flush할 수 있다.

따라서 다음 표현은 조심해서 이해해야 한다.

```txt
다음 rAF는 항상 style recalculation 이후다.
```

정확히는 그렇지 않다. rAF callback은 보통 해당 frame의 style/layout/paint update 전에 실행된다.

하지만 rAF는 이전 JS task의 React commit과 분리된 다음 rendering opportunity에 들어가므로, 그 안에서 `getAnimations()`를 읽을 때 browser는 pending DOM/style 변경을 반영할 기회를 갖는다.

이 문서에서 "다음 frame에 읽는다"는 말은 다음 뜻이다.

```txt
같은 React commit 흐름에서 즉시 읽지 않는다.
다음 rendering opportunity에서 읽는다.
읽는 순간 필요한 style/animation update가 반영될 수 있다.
```

## useEffect의 위치

`useOpenChangeComplete`는 `useEffect`에서 animation 완료 감시를 시작한다.

```ts
React.useEffect(() => {
  if (!enabled) {
    return undefined
  }

  const abortController = new AbortController()
  runOnceAnimationsFinish(onComplete, abortController.signal)

  return () => {
    abortController.abort()
  }
}, [enabled, open, onComplete, runOnceAnimationsFinish])
```

`useEffect`는 layout effect보다 늦다. 일반적으로 browser가 paint할 기회를 가진 뒤 실행된다. React의 스케줄링이나 interaction 업데이트에 따라 세부 타이밍은 달라질 수 있으므로, `useEffect`를 "항상 paint 이후"라고 절대 규칙처럼 의존하면 안 된다.

여기서 중요한 점은 `useEffect`가 pre-paint DOM 보정용이 아니라는 것이다.

`useOpenChangeComplete`에서 effect를 쓰는 이유는 다음과 같다.

```txt
open 값이 바뀐 commit 이후
현재 DOM element를 대상으로
animation 완료 감시를 시작한다.
```

감시 시작 후 실제 `getAnimations()` 읽기 타이밍은 `useAnimationsFinished` 내부의 rAF와 MutationObserver가 조절한다.

## close transition의 상세 순서

닫힘 흐름은 다음과 같다.

```txt
초기 상태
  open true
  mounted true
  transitionStatus undefined
  img가 DOM에 있음
  opacity 1
```

사용자가 image를 닫거나 loading 상태가 바뀌어 `open = false`가 된다.

```txt
render phase
  open false
  mounted true
  transitionStatus가 ending이 아니면 setTransitionStatus('ending')

다음 render
  mounted true
  transitionStatus ending
  img 렌더 유지
  transitionStatusMapping이 data-ending-style 반환
```

commit phase에서 DOM은 다음처럼 된다.

```html
<img class="AvatarImage" data-ending-style="" src="..." />
```

이후 browser는 CSS를 통해 다음 변화를 계산할 수 있다.

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

```txt
computed opacity
  1 -> 0

computed transform
  scale(1) -> scale(0.94)

transition 생성
  opacity transition
  transform transition
```

`useOpenChangeComplete` effect가 실행되면 `useAnimationsFinished`가 감시를 시작한다.

```txt
runOnceAnimationsFinish(onComplete, signal)
  이전 frame 예약 취소
  element 확인
  getAnimations 지원 확인
  frame.request(run)
```

다음 frame의 `run`은 다음 일을 한다.

```ts
Promise.all(
  element.getAnimations().map((animation) => animation.finished),
).then(() => {
  if (!signal?.aborted) {
    callback()
  }
})
```

여러 transition이 있으면 모두 끝날 때까지 기다린다.

```txt
opacity 180ms
transform 220ms

Promise.all
  220ms 뒤 resolve

onComplete
  open false 상태라면 setMounted(false)
```

그 다음 render/commit에서 img가 실제로 DOM에서 제거된다.

## enter transition의 상세 순서

열림 흐름은 닫힘보다 한 단계 더 복잡하다.

초기 상태:

```txt
open false
mounted false
img 없음
```

`open = true`가 된다.

```txt
render phase
  open true
  mounted false
  setMounted(true)
  setTransitionStatus('starting')

다음 render
  mounted true
  transitionStatus starting
  img 렌더
  transitionStatusMapping이 data-starting-style 반환
```

commit phase:

```html
<img class="AvatarImage" data-starting-style="" src="..." />
```

CSS:

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

이 시점의 목적은 시작 style을 노출하는 것이다.

```txt
img[data-starting-style]
  opacity 0
  transform scale(0.96)
```

`useTransitionStatus` layout effect는 다음 frame에 `transitionStatus`를 `undefined`로 만든다.

```txt
next frame
  setTransitionStatus(undefined)
  data-starting-style 제거
```

그 다음 commit:

```html
<img class="AvatarImage" src="..." />
```

browser는 다음 변화를 볼 수 있다.

```txt
opacity 0 -> 1
transform scale(0.96) -> scale(1)
```

이때 enter transition이 생성된다.

## waitForStartingStyleRemoved가 필요한 이유

`useAnimationsFinished`는 두 번째 인자로 `waitForStartingStyleRemoved`를 받는다.

```ts
useAnimationsFinished(ref, open, false)
```

Avatar 경로에서는 `open`이 true이면 `waitForStartingStyleRemoved`도 true다.

enter animation을 감시할 때는 `data-starting-style`이 아직 붙어 있는 동안 `getAnimations()`를 읽으면 안 된다.

```txt
data-starting-style 있음
  아직 시작 style 단계
  최종 style로 전환되지 않았음
  enter transition이 시작되지 않았을 수 있음
```

그래서 `useAnimationsFinished`는 다음 로직을 쓴다.

```ts
if (!element.hasAttribute('data-starting-style')) {
  frame.request(run)
  return
}

const observer = new MutationObserver(() => {
  if (!element.hasAttribute('data-starting-style')) {
    observer.disconnect()
    run()
  }
})
```

순서는 다음과 같다.

```txt
1. img[data-starting-style] commit
2. useAnimationsFinished 감시 시작
3. data-starting-style이 아직 있음을 확인
4. MutationObserver 등록
5. useTransitionStatus의 rAF가 data-starting-style 제거
6. observer가 제거를 감지
7. run() 실행
8. getAnimations().finished 대기
```

이 구조는 enter animation에서 특히 중요하다.

```txt
starting style이 제거되기 전 getAnimations()
  transition이 아직 없을 수 있음

starting style 제거 후 getAnimations()
  opacity 0 -> 1 transition을 관찰할 수 있음
```

## MutationObserver와 rAF의 역할 차이

`waitForStartingStyleRemoved` 경로에는 MutationObserver와 rAF가 모두 등장할 수 있다.

각 역할은 다르다.

```txt
MutationObserver
  data-starting-style attribute가 실제로 제거되는 순간을 감지한다.
  React state나 open 값을 추측하지 않고 DOM mutation을 본다.

rAF
  getAnimations() 읽기를 같은 synchronous 흐름에서 분리한다.
  다음 frame boundary에서 browser animation 상태를 읽는다.
```

현재 로컬 구현에서는 `data-starting-style`이 아직 있으면 observer가 제거를 감지한 뒤 바로 `run()`을 호출한다. 이미 attribute가 없다면 `frame.request(run)`으로 한 frame 뒤에 읽는다.

이 차이는 다음 의미다.

```txt
attribute가 아직 있음
  제거라는 명확한 DOM event를 기다린다.

attribute가 이미 없음
  현재 시점에서 transition 등록이 끝났다고 단정하지 않고
  다음 frame에 getAnimations()를 읽는다.
```

## animation이 없을 때

`getAnimations()`가 빈 배열을 반환할 수 있다.

```ts
Promise.all([])
```

JavaScript에서 `Promise.all([])`은 즉시 resolve된다.

따라서 CSS transition이 없으면 callback이 바로 실행된다.

```txt
img[data-ending-style]은 붙음
하지만 CSS transition 없음
getAnimations() = []
Promise.all([]) 즉시 resolve
setMounted(false)
```

이 동작은 정상이다. 사용자가 CSS transition을 정의하지 않았다면 unmount를 지연할 이유가 없다.

## animation.finished가 reject될 때

`animation.finished` Promise는 animation이 정상 완료되면 resolve된다. animation이 취소되면 reject될 수 있다.

예를 들어:

```txt
1. img[data-ending-style]로 fade-out 시작
2. transition 도중 className 또는 style 변경
3. 기존 transition cancel
4. 새 transition이 시작되거나 animation이 사라짐
5. 기존 animation.finished reject
```

`useAnimationsFinished`는 `treatAbortedAsFinished` 옵션으로 이 경우를 다룬다.

Avatar는 세 번째 인자로 `false`를 넘긴다.

```ts
useAnimationsFinished(ref, open, false)
```

따라서 abort를 곧바로 완료로 보지 않는다.

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

의도는 다음과 같다.

```txt
기존 animation이 cancel됨
  바로 unmount하지 않음

현재 element에 새 animation이 있음
  다시 run()
  새 animation.finished를 기다림
```

exit transition에서는 이 정책이 중요하다. animation cancel을 완료로 처리해 버리면 새로 시작된 exit transition을 보여 주기 전에 DOM이 제거될 수 있다.

## AbortSignal이 필요한 이유

`useOpenChangeComplete`는 effect cleanup에서 이전 감시를 abort한다.

```ts
const abortController = new AbortController()
runOnceAnimationsFinish(onComplete, abortController.signal)

return () => {
  abortController.abort()
}
```

이 장치는 오래된 animation 완료 callback을 막는다.

예를 들어:

```txt
1. open false
   close animation 감시 시작

2. close animation이 끝나기 전 open true
   이전 effect cleanup
   abortController.abort()
   새 open 감시 시작

3. 이전 close animation.finished가 나중에 resolve
   signal.aborted true
   callback 실행 안 함
```

이 확인이 없으면 이전 close callback이 뒤늦게 `setMounted(false)`를 호출해서, 다시 열린 image를 잘못 unmount할 수 있다.

## useAnimationFrame instance가 필요한 이유

`useAnimationsFinished`는 `useAnimationFrame()`으로 instance를 만든다.

```ts
const frame = useAnimationFrame()
```

이 instance는 현재 예약된 frame id 하나를 기억한다.

```ts
request(callback: () => void) {
  this.cancel()
  this.currentId = requestFrame(() => {
    this.currentId = null
    callback()
  })
}
```

새 request가 들어오면 이전 request를 취소한다.

```txt
frame.request(closeRun)
  closeRun 다음 frame 예약

다음 frame 전에 open 상태로 변경
frame.request(openRun)
  closeRun 취소
  openRun 예약
```

이 패턴은 빠른 open/close 전환에서 오래된 frame callback을 줄인다.

또한 `useAnimationFrame`은 unmount cleanup도 등록한다.

```ts
export function useAnimationFrame() {
  const frame = useRefWithInit(AnimationFrame.create).current
  useOnMount(frame.disposeEffect)
  return frame
}
```

그래서 컴포넌트가 unmount되면 아직 실행되지 않은 frame callback을 취소한다.

```txt
component unmount
  frame.cancel()
  예약된 getAnimations run 취소
```

## 전역 scheduler가 같은 frame callback을 batch하는 이유

로컬 `useAnimationFrame`은 native `requestAnimationFrame`을 직접 여러 번 예약하지 않고 내부 queue에 callback을 모은다.

```ts
function requestFrame(callback: FrameRequestCallback) {
  const id = nextId
  nextId += 1
  callbacks.push(callback)
  callbacksCount += 1

  if (!isScheduled) {
    requestAnimationFrame(tick)
    isScheduled = true
  }

  return id
}
```

여러 callback이 같은 frame에 예약되면 native rAF는 하나만 생긴다.

```txt
requestFrame A
  callbacks = [A]
  native rAF 예약

requestFrame B
  callbacks = [A, B]
  native rAF 추가 예약 없음

다음 frame
  tick에서 A, B 실행
```

`tick`은 실행 전에 현재 queue를 비운다.

```ts
const currentCallbacks = callbacks.splice(0)
```

그래서 callback 실행 중 새 callback이 예약되면 다음 frame으로 간다.

```txt
frame 1
  A 실행
  A 안에서 requestFrame(B)
  B는 새 callbacks queue에 들어감

frame 2
  B 실행
```

이 설계는 같은 frame 안에서 callback이 재진입하며 계속 이어지는 것을 막는다. frame 단위 작업의 경계를 명확히 만든다.

## 다음 frame으로 넘겨도 animation이 끊기지 않는 이유

다음 frame으로 넘긴다는 말은 animation 자체를 멈췄다가 다시 시작한다는 뜻이 아니다.

`requestAnimationFrame` callback은 browser의 rendering loop에 맞춰 실행된다. 다음 frame에 callback이 실행되어도 browser는 정상적으로 paint와 animation timeline을 진행한다.

여기서 frame을 넘기는 목적은 다음이다.

```txt
DOM 변경 직후 같은 JS 흐름에서 너무 빨리 getAnimations()를 읽지 않는다.
browser가 transition을 생성할 수 있는 frame boundary를 준다.
오래된 예약을 취소하고 최신 상태 기준으로만 읽는다.
enter starting style과 final style을 서로 다른 frame에 둔다.
```

따라서 다음 frame으로 넘기는 것은 animation을 끊기게 하는 동작이 아니라 animation이 생길 조건을 만들어 주는 동작이다.

## 전체 close timeline

close flow를 한 줄 timeline으로 정리하면 다음과 같다.

```txt
T0: 이전 frame
  img visible
  computed opacity 1

T1: React update
  open false

T1: render
  transitionStatus ending
  mounted true 유지

T1: commit
  img[data-ending-style] DOM 반영

T1: layout effects
  DOM은 바뀌었지만 getAnimations를 바로 읽기엔 이를 수 있음

T1/T2: useEffect
  useOpenChangeComplete가 감시 시작
  useAnimationsFinished가 run을 rAF로 예약

T2: rAF/run
  getAnimations() 읽기
  CSS transition 객체들을 얻음
  animation.finished Promise 대기

T2 + duration
  모든 animation.finished resolve
  signal이 abort되지 않았으면 onComplete
  setMounted(false)

T3: React commit
  img unmount
```

## 전체 enter timeline

enter flow는 다음과 같다.

```txt
T0: 이전 frame
  img 없음

T1: React update
  open true

T1: render
  mounted true
  transitionStatus starting

T1: commit
  img[data-starting-style] mount

T1: layout effect
  useTransitionStatus가 data-starting-style 제거를 다음 rAF에 예약

T1/T2: useEffect
  useOpenChangeComplete가 감시 시작
  useAnimationsFinished는 data-starting-style이 있으면 observer 등록

T2: rAF
  useTransitionStatus callback
  transitionStatus undefined

T2: React commit
  data-starting-style 제거

T2: MutationObserver
  attribute 제거 감지
  run()
  getAnimations() 읽기
  enter transition finished Promise 대기

T2 + duration
  모든 animation.finished resolve
  signal이 abort되지 않았으면 onComplete
```

## 실무 기준으로 기억할 점

이 맥락에서 순서를 판단할 때는 다음 규칙을 기억하면 된다.

```txt
render
  React tree 계산만 한다.
  DOM은 아직 바뀌지 않는다.

commit
  DOM attribute/class/style을 실제로 바꾼다.
  하지만 CSS transition 객체 생성까지 보장하지 않는다.

useLayoutEffect
  DOM mutation 이후, paint 전 실행된다.
  DOM 측정과 paint 전 보정에는 맞다.
  animation 객체 관찰에는 너무 이를 수 있다.

requestAnimationFrame
  다음 rendering opportunity의 paint 전에 실행된다.
  React commit과 같은 synchronous 흐름을 벗어나 frame boundary를 만든다.
  getAnimations() 읽기나 starting style 제거 같은 frame 기반 작업에 적합하다.

useEffect
  commit 이후 passive effect로 실행된다.
  animation 완료 감시 시작에는 적합하다.
  paint 전 보정 수단으로 의존하면 안 된다.

getAnimations()
  DOM attribute가 아니라 browser가 생성한 animation/transition 객체를 읽는다.
  transition이 아직 생성되지 않았으면 []가 나올 수 있다.
```

## 이 phase의 설계 의도

`useTransitionStatus`, `useOpenChangeComplete`, `useAnimationsFinished`, `useAnimationFrame`의 조합은 다음 문제를 해결한다.

```txt
React state
  open true/false
  mounted true/false
  transitionStatus starting/ending

DOM styling surface
  data-starting-style
  data-ending-style

browser animation
  CSS transition 생성
  getAnimations().finished

component lifecycle
  unmount cleanup
  stale callback abort
  latest frame request만 유지
```

즉 이 구조의 목적은 React state 변경과 CSS animation 완료를 직접 시간 값으로 맞추는 것이 아니다.

```txt
setTimeout(180ms)
  CSS duration과 JS timeout이 어긋날 수 있음

getAnimations().finished
  실제 browser animation 완료를 기준으로 함
```

그리고 `requestAnimationFrame`은 그 사이에서 "언제 DOM을 읽고, 언제 starting style을 제거할지"를 frame 단위로 맞추는 역할을 한다.

최종적으로 이 phase에서 배워야 할 핵심은 다음이다.

```txt
React commit은 DOM 변경까지다.
CSS transition 등록은 browser rendering pipeline의 일이다.
animation 완료는 getAnimations().finished로 관찰한다.
rAF는 delay가 아니라 frame boundary다.
MutationObserver는 DOM attribute 변화의 실제 시점을 잡는다.
AbortSignal과 frame.cancel은 오래된 비동기 callback을 막는다.
```
