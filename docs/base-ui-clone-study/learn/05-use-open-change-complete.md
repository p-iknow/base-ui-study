# 05. `useOpenChangeComplete`가 Avatar에서 필요한 이유

대상 파일:

- `packages/react/src/internals/useOpenChangeComplete.ts`
- `packages/react/src/internals/useAnimationsFinished.ts`
- `packages/react/src/internals/useTransitionStatus.ts`
- `packages/react/src/avatar/image/AvatarImage.tsx`

관련 원본:

- `/Users/youngchang/dev/references/base-ui/packages/react/src/internals/useOpenChangeComplete.tsx`
- `/Users/youngchang/dev/references/base-ui/packages/react/src/internals/useTransitionStatus.ts`
- `/Users/youngchang/dev/references/base-ui/packages/react/src/avatar/image/AvatarImage.tsx`

## 전체 역할

`useOpenChangeComplete`는 어떤 요소의 open/close 상태가 바뀐 뒤, 그 요소에 걸린 CSS animation 또는 transition이 끝났을 때 callback을 실행하는 hook이다.

Avatar에서는 `Avatar.Image`가 사라질 때 바로 DOM에서 제거하지 않고, `data-ending-style` 상태의 exit animation이 끝난 뒤에 `setMounted(false)`를 호출하기 위해 쓴다.

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

여기서 `open`에 해당하는 값은 `isVisible`이다.

```ts
const isVisible = imageLoadingStatus === 'loaded'
```

즉 Avatar Image 기준으로는 "이미지가 로드되어 보여야 하는가"가 open 상태다.

## Avatar Image의 상태 흐름

`Avatar.Image`는 이미지 로딩 상태를 먼저 계산한다.

```ts
const imageLoadingStatus = useImageLoadingStatus(componentProps.src, {
  crossOrigin,
  referrerPolicy,
})
```

그 다음 로딩 상태가 `loaded`일 때만 image가 visible하다고 본다.

```ts
const isVisible = imageLoadingStatus === 'loaded'
const { mounted, setMounted, transitionStatus } =
  useTransitionStatus(isVisible)
```

이때 세 값의 책임은 서로 다르다.

- `isVisible`: 이미지 로딩 상태로부터 계산된 목표 표시 상태다.
- `mounted`: 실제 `<img>`를 DOM에 남겨 둘지 결정하는 상태다.
- `transitionStatus`: `starting`, `ending`, `undefined` 같은 transition phase다.

`useRenderElement`에는 `enabled: mounted`가 전달된다.

```ts
return useRenderElement('img', componentProps, {
  enabled: mounted,
  state,
  ref: [forwardedRef, imageRef],
  props: {
    ...elementProps,
    crossOrigin,
    referrerPolicy,
  },
  stateAttributesMapping,
})
```

따라서 `mounted`가 `false`가 되면 실제 `<img>`는 렌더링되지 않는다.

## 바로 unmount하면 안 되는 이유

transition이 없다면 `mounted = isVisible`로 충분하다.

```txt
loaded
  isVisible = true
  img 렌더링

loaded가 아니게 됨
  isVisible = false
  img 즉시 unmount
```

하지만 이 구조에서는 exit animation을 줄 수 없다. `isVisible`이 `false`가 되는 순간 DOM이 사라지기 때문에 `data-ending-style`을 붙일 대상이 없어지기 때문이다.

Base UI의 transition 설계는 open 상태와 mount 상태를 분리한다.

```txt
loaded
  isVisible = true
  mounted = true
  transitionStatus = undefined

loaded가 아니게 됨
  isVisible = false
  mounted = true
  transitionStatus = ending
  img[data-ending-style] 상태로 DOM 유지

animation/transition 완료
  mounted = false
  img unmount
```

이 마지막 단계, 즉 "animation/transition 완료 후 mounted를 false로 내리는 일"을 `useOpenChangeComplete`가 담당한다.

## `useTransitionStatus`와의 관계

`useTransitionStatus`는 open 값이 바뀔 때 transition phase와 mount 상태를 관리한다.

```ts
if (open && !mounted) {
  setMounted(true)
  setTransitionStatus('starting')
}

if (!open && mounted && transitionStatus !== 'ending') {
  setTransitionStatus('ending')
}
```

열릴 때는 `mounted`를 바로 `true`로 바꾸고 `starting` 상태를 만든다. 그래야 새 DOM이 렌더링되면서 `data-starting-style`을 받을 수 있다.

닫힐 때는 `mounted`를 바로 `false`로 바꾸지 않는다. 대신 `transitionStatus`만 `ending`으로 바꾼다. 그래야 기존 DOM이 남아 있고 `data-ending-style`을 받을 수 있다.

`transitionStatus`는 custom mapping을 통해 DOM attribute로 변환된다.

```ts
transitionStatus(value): Record<string, string> | null {
  if (value === 'starting') {
    return { 'data-starting-style': '' }
  }

  if (value === 'ending') {
    return { 'data-ending-style': '' }
  }

  return null
}
```

결과적으로 사용자는 CSS에서 다음처럼 enter/exit transition을 걸 수 있다.

```css
.AvatarImage[data-starting-style] {
  opacity: 0;
}

.AvatarImage[data-ending-style] {
  opacity: 0;
}
```

## `useOpenChangeComplete` 내부 로직

로컬 구현은 작다.

```ts
export function useOpenChangeComplete(
  parameters: UseOpenChangeCompleteParameters,
) {
  const { enabled = true, open, ref, onComplete: onCompleteParam } = parameters
  const onComplete = useStableCallback(onCompleteParam)
  const runOnceAnimationsFinish = useAnimationsFinished(ref, open, false)

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
}
```

각 인자의 의미는 다음과 같다.

- `enabled`: hook을 실행할지 결정한다. 기본값은 `true`다.
- `open`: 현재 open 상태다. Avatar에서는 `isVisible`이다.
- `ref`: animation 완료를 감시할 실제 DOM element ref다.
- `onComplete`: animation 또는 transition이 끝났을 때 실행할 callback이다.

effect dependency에 `open`이 들어 있으므로, open/close 상태가 바뀔 때마다 animation 완료 감시가 새로 시작된다.

cleanup에서는 `AbortController`를 abort한다. 이전 상태의 animation 감시가 뒤늦게 완료되어 현재 상태에 맞지 않는 callback을 실행하지 않게 하기 위한 장치다.

## `useStableCallback`을 쓰는 이유

`onComplete`는 `useStableCallback`으로 감싼다.

```ts
const onComplete = useStableCallback(onCompleteParam)
```

이 hook은 callback identity를 안정적으로 유지하면서, 실행 시점에는 최신 props/state를 읽게 해 준다.

Avatar에서 중요한 이유는 `onComplete` 안에서 `isVisible`과 `setMounted`를 사용하기 때문이다.

```ts
onComplete() {
  if (!isVisible) {
    setMounted(false)
  }
}
```

닫히는 중간에 이미지가 다시 로드되어 `isVisible`이 `true`가 될 수 있다. 이때 오래된 closure가 뒤늦게 실행되어 무조건 `setMounted(false)`를 호출하면, 다시 보여야 하는 이미지를 잘못 unmount할 수 있다.

`useStableCallback`은 callback 등록 구조를 안정화하면서도 실행 시점의 최신 `isVisible`을 읽도록 도와준다.

## `useAnimationsFinished`가 하는 일

`useOpenChangeComplete`는 직접 animation을 기다리지 않고 `useAnimationsFinished`에 위임한다.

```ts
const runOnceAnimationsFinish = useAnimationsFinished(ref, open, false)
```

`useAnimationsFinished`의 핵심 흐름은 다음과 같다.

```txt
1. ref에서 DOM element를 얻는다.
2. element가 없으면 아무것도 하지 않는다.
3. getAnimations가 없거나 animation disabled 상태면 callback을 즉시 실행한다.
4. 다음 animation frame에서 element.getAnimations()를 읽는다.
5. 각 animation.finished Promise를 Promise.all로 기다린다.
6. signal이 abort되지 않았다면 callback을 실행한다.
7. animation이 취소되었을 때는 옵션에 따라 완료로 볼지, 활성 animation을 다시 확인할지 결정한다.
```

여기서 `useOpenChangeComplete`는 세 번째 인자로 `false`를 넘긴다.

```ts
useAnimationsFinished(ref, open, false)
```

이 값은 `treatAbortedAsFinished`에 해당한다. 즉 animation이 abort된 것을 완료로 취급하지 않는다. open/close 상태가 빠르게 바뀌는 상황에서 이전 animation의 취소가 곧바로 complete callback으로 이어지지 않게 하기 위한 선택이다.

## Avatar에서의 전체 시나리오

이미지가 처음에는 로딩 중이라고 가정한다.

```txt
imageLoadingStatus = loading
isVisible = false
mounted = false
img 렌더링 안 됨
```

이미지 로딩이 성공하면 다음 흐름이 된다.

```txt
imageLoadingStatus = loaded
isVisible = true
useTransitionStatus(true)
  mounted = true
  transitionStatus = starting
img[data-starting-style] 렌더링
다음 frame 이후 transitionStatus = undefined
```

이후 `src` 변경이나 로딩 실패 등으로 이미지가 다시 visible하지 않게 되면 다음 흐름이 된다.

```txt
imageLoadingStatus = loading 또는 error
isVisible = false
useTransitionStatus(false)
  mounted = true 유지
  transitionStatus = ending
img[data-ending-style] 렌더링 유지
useOpenChangeComplete가 img의 animation/transition 완료를 기다림
완료 후 onComplete 실행
  최신 isVisible이 여전히 false이면 setMounted(false)
img unmount
```

이 흐름 때문에 Avatar Image는 enter animation뿐 아니라 exit animation도 자연스럽게 지원할 수 있다.

## 왜 timeout이 아니라 animation 완료를 기다리는가

`setTimeout`으로 exit duration을 맞추는 방식은 CSS와 JS가 같은 시간을 중복으로 알아야 한다.

```txt
CSS
  transition-duration: 180ms

JS
  setTimeout(..., 180)
```

이렇게 하면 CSS duration이 바뀔 때 JS timeout도 같이 바꿔야 한다. 사용자 CSS override가 가능하거나 duration이 media query에 따라 달라지는 경우에는 더 쉽게 어긋난다.

`element.getAnimations()`를 사용하면 실제 DOM에 적용된 animation/transition의 완료 시점을 기준으로 callback을 실행할 수 있다. 그래서 Base UI는 public styling surface를 CSS data attribute로 열어 두고, JS는 실제 animation 완료를 관찰하는 방식으로 mount lifecycle을 맞춘다.

## 이 hook이 없으면 생기는 문제

`useOpenChangeComplete` 없이 `isVisible`이 false일 때 바로 `setMounted(false)`를 하면 다음 문제가 생긴다.

- `data-ending-style`이 붙은 DOM이 유지되지 않아 exit animation이 불가능하다.
- CSS duration과 JS cleanup 시점을 맞출 방법이 사라진다.
- 빠른 open/close 전환에서 이전 animation 완료 callback을 정리하기 어렵다.
- Avatar뿐 아니라 Checkbox indicator, Radio indicator, Select popup처럼 mounted와 open을 분리해야 하는 컴포넌트에서 같은 문제가 반복된다.

따라서 `useOpenChangeComplete`는 Avatar 전용 hook은 아니지만, Avatar에서는 "이미지 로딩 상태 변화"와 "CSS transition 완료 후 unmount"를 연결하는 핵심 내부 hook이다.

