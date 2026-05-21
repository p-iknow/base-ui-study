# 03. `useStableCallback`은 언제 써야 하나

대상 주제:

- `useStableCallback`을 써야 하는 경우
- `useStableCallback`을 쓰지 말아야 하는 경우
- `useCallback`과의 실전 차이
- Base UI 원본에서 확인한 사용 패턴

관련 원본:

- `/Users/youngchang/dev/references/base-ui/packages/utils/src/useStableCallback.ts`
- `/Users/youngchang/dev/references/base-ui/packages/utils/src/useEnhancedClickHandler.ts`
- `/Users/youngchang/dev/references/base-ui/packages/react/src/utils/useOpenInteractionType.ts`

## 핵심 기준

`useStableCallback`은 다음 두 조건이 동시에 필요할 때 쓴다.

- callback identity는 안정적으로 유지되어야 한다.
- callback이 실행될 때는 최신 props/state를 읽어야 한다.

즉 "함수 참조는 그대로여야 하지만, 함수 안의 값은 최신이어야 하는" event handler용 도구다.

## `useCallback`과의 차이

`useCallback`은 dependency가 바뀌면 함수 identity도 바뀐다.

```ts
const handleClick = React.useCallback(() => {
  if (disabled) {
    return
  }

  onClick()
}, [disabled, onClick])
```

이 함수는 `disabled`나 `onClick`이 바뀔 때마다 새로 만들어진다.

반면 `useStableCallback`은 함수 identity를 유지하고, 실행 시점에 최신 값을 읽는다.

```ts
const handleClick = useStableCallback(() => {
  if (disabled) {
    return
  }

  onClick()
})
```

이 함수는 `disabled`나 `onClick`이 바뀌어도 같은 함수 참조를 유지한다.

## 써야 하는 경우

### 1. 다른 hook이 callback을 dependency로 쓰는 경우

callback을 받는 hook 내부에서 `useCallback(..., [handler])`처럼 사용한다면, 넘겨주는 handler가 매번 바뀌는지 확인해야 한다.

나쁜 예:

```ts
const { onClick, onPointerDown } = useEnhancedClickHandler((event) => {
  if (disabled) {
    event.preventDefault()
  }
})
```

여기서 inline callback은 매 render마다 새로 만들어진다.

`useEnhancedClickHandler` 내부는 handler를 dependency로 삼는다.

```ts
const handleClick = React.useCallback(
  (event) => {
    handler(event, 'keyboard')
  },
  [handler],
)
```

따라서 입력 handler가 매번 바뀌면 `handleClick`도 매번 바뀐다.

좋은 예:

```ts
const handleActivation = useStableCallback(
  (event: React.MouseEvent | React.PointerEvent) => {
    if (disabled) {
      event.preventDefault()
    }
  },
)

const { onClick, onPointerDown } = useEnhancedClickHandler(handleActivation)
```

이제 `handleActivation` identity가 유지되므로 `useEnhancedClickHandler`가 만드는 handler들도 불필요하게 바뀌지 않는다.

### 2. DOM event listener, subscription, timer에 쓰는 경우

외부 시스템에 callback을 등록할 때는 함수 identity가 중요하다.

```ts
const handleDocumentClick = useStableCallback((event: MouseEvent) => {
  if (!open) {
    return
  }

  close(event)
})

React.useEffect(() => {
  document.addEventListener('click', handleDocumentClick)

  return () => {
    document.removeEventListener('click', handleDocumentClick)
  }
}, [handleDocumentClick])
```

이 구조에서는 `open`이 바뀔 때마다 listener를 제거하고 다시 등록하지 않아도 된다.

그래도 click이 발생하면 최신 `open` 값을 읽는다.

### 3. memoized props object에 넣는 handler인 경우

handler를 props object에 넣고 그 object를 `useMemo`로 안정화하고 싶을 때 유용하다.

```ts
const handleTriggerClick = useStableCallback(
  (_: React.MouseEvent, interactionType: InteractionType) => {
    if (!open) {
      setOpenMethod(interactionType)
    }
  },
)

const { onClick, onPointerDown } = useEnhancedClickHandler(handleTriggerClick)

const triggerProps = React.useMemo(
  () => ({
    onClick,
    onPointerDown,
  }),
  [onClick, onPointerDown],
)
```

Base UI 원본의 `useOpenInteractionType.ts`가 이 패턴을 쓴다.

원본에서 확인한 흐름:

- `useStableCallback`으로 입력 handler를 안정화한다.
- `useEnhancedClickHandler`로 click/pointer handler를 만든다.
- 반환할 props object는 `useMemo`로 안정화한다.

### 4. ref callback처럼 identity 변화가 부작용을 만드는 경우

ref callback이 매 render마다 바뀌면 React는 이전 ref에 `null`을 넣고 새 ref를 다시 호출할 수 있다.

```ts
const buttonRef = useStableCallback((element: HTMLElement | null) => {
  elementRef.current = element
})
```

단순 저장만 하더라도 ref callback identity를 안정화하면 불필요한 detach/attach 흐름을 줄일 수 있다.

## 쓰지 말아야 하는 경우

### 1. render 중 호출해야 하는 함수

`useStableCallback`으로 만든 함수는 event handler나 effect 안에서 호출하는 용도다.

render 중 계산에 쓰면 안 된다.

나쁜 예:

```ts
const getLabel = useStableCallback(() => {
  return disabled ? 'Disabled' : 'Enabled'
})

const label = getLabel()
```

이런 코드는 일반 조건식이나 `useMemo`가 맞다.

```ts
const label = disabled ? 'Disabled' : 'Enabled'
```

또는 계산 비용이 크다면:

```ts
const label = React.useMemo(() => {
  return disabled ? 'Disabled' : 'Enabled'
}, [disabled])
```

### 2. 단순 JSX local handler

부모/자식 memoization, subscription, dependency 안정성이 중요하지 않은 단순 handler에는 필요 없다.

```tsx
<button
  onClick={() => {
    setCount((value) => value + 1)
  }}
>
  Increment
</button>
```

이 정도는 inline handler로 충분하다.

### 3. dependency가 바뀔 때 handler도 바뀌는 게 자연스러운 경우

handler 의미가 dependency와 함께 바뀌고, 그 변화가 하위 hook이나 memoization에 문제가 되지 않는다면 `useCallback`이면 충분하다.

```ts
const handleClick = React.useCallback(() => {
  submit(formId)
}, [formId, submit])
```

`formId`가 바뀔 때 handler가 바뀌는 것이 자연스럽고 비용도 작다면 `useStableCallback`을 쓸 이유가 없다.

### 4. 최신 값보다 dependency 추적이 더 중요한 경우

어떤 effect가 특정 값이 바뀔 때 명시적으로 다시 실행되어야 한다면 `useStableCallback`으로 dependency 변화를 숨기면 안 된다.

나쁜 예:

```ts
const runQuery = useStableCallback(() => {
  fetch(`/api/items?filter=${filter}`)
})

React.useEffect(() => {
  runQuery()
}, [runQuery])
```

이 코드는 `filter`가 바뀌어도 effect가 다시 실행되지 않는다.

이 경우에는 dependency를 명시해야 한다.

```ts
React.useEffect(() => {
  fetch(`/api/items?filter=${filter}`)
}, [filter])
```

## 판단 규칙

`useStableCallback`을 쓰기 전에 다음 질문을 한다.

1. 이 함수가 event, effect, subscription, timer, external hook 내부에서 나중에 호출되는가?
2. 함수 identity가 바뀌면 listener 재등록, memoized props 변경, child rerender 같은 비용이나 버그가 생기는가?
3. 그래도 실행 시점에는 최신 props/state를 읽어야 하는가?

세 질문이 모두 `yes`이면 `useStableCallback`을 쓴다.

하나라도 `no`이면 보통 `useCallback`, `useMemo`, 일반 함수, inline handler가 더 단순하다.

## Base UI 원본에서 배운 점

Base UI 원본은 `useStableCallback`을 아무 곳에나 쓰지 않는다.

원본 `useOpenInteractionType.ts`에서는 다음 이유로 쓴다.

- `useEnhancedClickHandler`에 callback을 넘긴다.
- `useEnhancedClickHandler`는 받은 callback을 dependency로 사용한다.
- callback은 최신 `open` 값을 읽어야 한다.
- 하지만 callback identity가 바뀌면 downstream handler들도 같이 바뀐다.

그래서 원본은 다음 구조를 사용한다.

```ts
const handleTriggerClick = useStableCallback(
  (_: React.MouseEvent, interactionType: InteractionType) => {
    const isOpen = typeof open === 'function' ? open() : open

    if (!isOpen) {
      setOpenMethod(interactionType)
    }
  },
)

const { onClick, onPointerDown } = useEnhancedClickHandler(handleTriggerClick)
```

반면 원본 `useButton`은 `useEnhancedClickHandler`를 쓰지 않고 `getButtonProps` 안에서 handler를 직접 만든다.

```ts
const getButtonProps = React.useCallback(
  (externalProps = {}) => {
    const { onClick: externalOnClick, ...otherExternalProps } = externalProps

    return mergeProps(
      {
        onClick(event) {
          if (disabled) {
            event.preventDefault()
            return
          }

          externalOnClick?.(event)
        },
      },
      otherExternalProps,
    )
  },
  [disabled],
)
```

이 경우에는 중간 callback hook에 넘기는 stable handler가 필요하지 않다.

## 요약

`useStableCallback`은 "stable identity + latest value"가 동시에 필요한 event handler용 도구다.

써야 하는 경우:

- callback을 받는 다른 hook에 넘긴다.
- DOM listener, subscription, timer에 등록한다.
- memoized props object에 넣는 handler다.
- ref callback처럼 identity 변화가 부작용을 만든다.

쓰지 말아야 하는 경우:

- render 중 호출하는 계산 함수다.
- 단순 JSX inline handler다.
- dependency 변화에 따라 handler가 바뀌어도 괜찮다.
- effect가 특정 dependency 변화에 맞춰 다시 실행되어야 한다.

핵심은 dependency lint를 피하기 위해 쓰는 것이 아니라, callback identity와 최신 값 읽기 사이의 충돌을 해결하기 위해 쓰는 것이다.
