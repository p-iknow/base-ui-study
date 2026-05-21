# `useButton`의 필요성과 내부 구현

대상 파일:

- `packages/react/src/internals/use-button/useButton.ts`
- 관련 사용처: `packages/react/src/button/Button.tsx`
- 관련 내부 유틸:
  - `packages/react/src/internals/useEnhancedClickHandler.ts`
  - `packages/react/src/merge-props/mergeProps.ts`
  - `packages/utils/src/useStableCallback.ts`

## 전체 역할

`useButton`은 Button 컴포넌트에서 "버튼다운 동작"을 공통으로 만들어 주는 내부 훅이다.

핵심 위치는 `packages/react/src/internals/use-button/useButton.ts`이고, 실제 `Button`은 이 훅에서 받은 props를 `useRenderElement`에 넘긴다.

```tsx
const { getButtonProps, buttonRef } = useButton({
  disabled,
  focusableWhenDisabled,
  native: nativeButton,
})

return useRenderElement('button', componentProps, {
  state,
  ref: [forwardedRef, buttonRef],
  props: getButtonProps(elementProps),
})
```

즉 public `Button` 컴포넌트는 얇게 유지하고, 버튼으로서 지켜야 하는 실제 동작 규칙은 `useButton` 안에 모아 둔다.

## 왜 필요한가

Base UI 계열 컴포넌트는 항상 진짜 `<button>`만 렌더링하지 않는다.

`render={<a />}` 같은 방식으로 다른 태그를 버튼처럼 쓰게 만들 수 있다. 그런데 브라우저가 기본 제공하는 버튼 동작은 `<button>`에만 있다.

예를 들어 다음 코드는 브라우저가 기본적으로 버튼 semantics를 처리한다.

```tsx
<button disabled />
```

이 경우 브라우저가 focus, click, submit 관련 동작을 알아서 처리한다.

하지만 다음과 같은 custom element는 버튼처럼 보일 뿐, 브라우저가 native button처럼 모든 동작을 처리하지 않는다.

```tsx
<a role="button" aria-disabled="true" />
<div role="button" />
```

이런 요소에는 다음 동작을 직접 맞춰야 한다.

- 접근성 tree에서 버튼으로 인식되도록 `role="button"`을 붙인다.
- disabled 상태를 보조 기술에 알리기 위해 `aria-disabled`를 붙인다.
- focus 가능 여부를 `tabIndex`로 조절한다.
- 키보드 `Enter`와 `Space`로 click이 발생하도록 맞춘다.
- disabled 상태에서는 pointer, click, keyboard activation을 막는다.
- 사용자가 넘긴 event handler와 내부 event handler의 실행 순서를 일관되게 유지한다.

`useButton`은 이 차이를 한곳에 모아 `Button`, `Toggle`, `Checkbox`, `Switch` 같은 "누를 수 있는 컴포넌트"들이 재사용할 수 있게 만든 훅이다.

## 입력값

`UseButtonParameters`는 네 가지 값을 받는다.

```ts
export interface UseButtonParameters {
  disabled?: boolean
  focusableWhenDisabled?: boolean
  native?: boolean
  tabIndex?: number
}
```

### `disabled`

비활성 상태인지 여부다.

기본값은 `false`다.

```ts
disabled = false
```

`disabled`가 `true`이면 다음 처리가 적용된다.

- `data-disabled=""`가 붙는다.
- native button인 경우 조건에 따라 실제 `disabled` attribute가 붙는다.
- custom element인 경우 `aria-disabled`와 `tabIndex`로 disabled semantics를 흉내 낸다.
- click, pointer, keyboard activation을 막는다.

### `focusableWhenDisabled`

disabled 상태여도 tab focus를 허용할지 정하는 값이다.

기본값은 `false`다.

```ts
focusableWhenDisabled = false
```

일반적인 disabled button은 focus되지 않는다. 하지만 composite widget, menu, toolbar, command surface 같은 UI에서는 disabled item도 focus 흐름 안에 남겨야 할 때가 있다.

이때 `focusableWhenDisabled`를 `true`로 두면 disabled 상태를 유지하면서도 focus는 허용할 수 있다.

중요한 점은 "focus 가능"과 "activation 가능"은 다르다는 것이다. `focusableWhenDisabled`가 `true`여도 click이나 keyboard activation은 막아야 한다.

### `native`

실제 native button semantics를 사용할지 정하는 값이다.

기본값은 `true`이고, 내부에서는 `isNativeButton`이라는 이름으로 사용한다.

```ts
native: isNativeButton = true
```

`true`이면 기본적으로 `<button>`을 렌더링한다고 보고 `type="button"`과 native disabled 처리를 적용한다.

`false`이면 `<a>`, `<div>` 같은 custom element를 버튼처럼 쓴다고 보고 `role="button"`, `tabIndex`, keyboard activation을 직접 붙인다.

### `tabIndex`

focus 순서 값이다.

기본값은 `0`이다.

```ts
tabIndex = 0
```

enabled 상태에서는 기본적으로 tab focus가 가능하도록 `tabIndex=0`을 둔다.

disabled 상태에서는 `focusableWhenDisabled` 여부에 따라 `tabIndex`가 유지되거나 `-1`이 된다.

## 반환값

`UseButtonReturnValue`는 두 가지를 반환한다.

```ts
export interface UseButtonReturnValue {
  getButtonProps: (
    externalProps?: React.ComponentPropsWithRef<any>,
  ) => React.ComponentPropsWithRef<any>
  buttonRef: React.Ref<HTMLElement>
}
```

### `getButtonProps`

외부 props를 받아 버튼에 필요한 props와 event handler를 섞어 돌려주는 함수다.

예를 들어 `Button` 컴포넌트는 사용자가 넘긴 props 중 `disabled`, `focusableWhenDisabled`, `nativeButton`, `render`, `className`, `style` 등을 분리한 뒤 나머지 `elementProps`를 `getButtonProps`에 넘긴다.

```tsx
props: getButtonProps(elementProps)
```

`getButtonProps`는 여기서 다음 일을 한다.

- native button인지 custom element인지에 따라 기본 props를 만든다.
- disabled 상태 props를 붙인다.
- click, keydown, keyup, pointerdown handler를 만든다.
- 사용자 handler와 내부 handler를 올바른 순서로 합친다.

### `buttonRef`

내부에서 DOM element를 잡기 위한 ref callback이다.

```ts
const elementRef = React.useRef<HTMLElement | null>(null)
const buttonRef = useStableCallback((element: HTMLElement | null) => {
  elementRef.current = element
})
```

현재 구현에서는 `elementRef.current`에 저장만 하고 직접 사용하지는 않는다.

그래도 이 ref가 있는 이유는 Base UI 구조상 나중에 focus 관리, DOM 상태 확인, composite widget 연동 같은 내부 동작이 필요해질 수 있기 때문이다.

또 `useStableCallback`으로 ref callback identity를 안정화한다. React에서 ref callback이 매 render마다 새로 만들어지면 이전 ref에 `null`이 들어가고 새 ref가 다시 호출되는 흐름이 생길 수 있다. 안정적인 callback을 쓰면 불필요한 ref detach/attach를 줄일 수 있다.

## 기본 props 생성

`getButtonProps` 안에서 먼저 외부 event handler들을 분리한다.

```ts
const { onClick, onKeyDown, onKeyUp, onPointerDown, ...otherExternalProps } = externalProps
```

그 다음 native button인지 custom element인지에 따라 `baseProps`를 만든다.

```ts
const baseProps: React.ComponentPropsWithRef<any> = isNativeButton
  ? { type: 'button' }
  : { role: 'button' }
```

native button이면 다음 props를 기본으로 넣는다.

```ts
{ type: 'button' }
```

`type="button"`을 기본으로 넣는 이유는 `<button>`의 기본 type이 상황에 따라 submit처럼 동작할 수 있기 때문이다. 폼 안에서 의도치 않은 submit을 막기 위한 안전한 기본값이다.

custom element이면 다음 props를 기본으로 넣는다.

```ts
{ role: 'button' }
```

custom element는 브라우저가 버튼으로 인식하지 않으므로 `role="button"`을 붙여 접근성 tree에서 버튼 의미를 갖게 한다.

## disabled 처리

disabled 상태일 때는 다음 분기가 중요하다.

```ts
if (disabled) {
  baseProps['data-disabled'] = ''

  if (isNativeButton && !focusableWhenDisabled) {
    baseProps.disabled = true
  } else {
    baseProps['aria-disabled'] = true
    baseProps.tabIndex = focusableWhenDisabled ? tabIndex : -1
  }
} else {
  baseProps.tabIndex = tabIndex
}
```

### 공통: `data-disabled`

disabled 상태에서는 항상 다음 attribute를 붙인다.

```ts
data-disabled=""
```

이 값은 브라우저 기본 동작을 위한 것이 아니라 상태 노출과 스타일링을 위한 attribute다.

예를 들어 CSS에서 다음처럼 사용할 수 있다.

```css
[data-disabled] {
  opacity: 0.5;
}
```

Base UI 계열 컴포넌트는 상태를 `data-*` attribute로 노출하는 패턴을 많이 사용한다. `disabled` 역시 같은 방식으로 public styling surface가 된다.

### native button이고 focus를 허용하지 않는 경우

조건은 다음과 같다.

```ts
if (isNativeButton && !focusableWhenDisabled)
```

이 경우 실제 native `disabled` attribute를 붙인다.

```ts
baseProps.disabled = true
```

이렇게 하면 브라우저가 다음을 알아서 처리한다.

- click 차단
- keyboard activation 차단
- tab focus 차단
- disabled button semantics 제공

가장 자연스럽고 안전한 경로다.

### custom element이거나 disabled 상태에서도 focus해야 하는 경우

다음 경우에는 실제 `disabled` attribute를 쓰지 않는다.

- custom element인 경우
- native button이어도 `focusableWhenDisabled`가 `true`인 경우

대신 다음 props를 붙인다.

```ts
baseProps['aria-disabled'] = true
baseProps.tabIndex = focusableWhenDisabled ? tabIndex : -1
```

custom element에 `disabled` attribute를 붙여도 브라우저가 native button처럼 처리하지 않는다. 따라서 `aria-disabled`로 접근성 상태를 알리고, event handler에서 직접 activation을 막는다.

`focusableWhenDisabled`가 `true`이면 `tabIndex`를 유지한다.

```ts
tabIndex
```

`focusableWhenDisabled`가 `false`이면 tab focus에서 제외한다.

```ts
-1
```

이 차이가 중요하다. native `disabled`를 붙이면 아예 focus가 안 된다. 그런데 어떤 UI에서는 disabled 항목도 tab이나 roving focus 흐름 안에서 접근 가능해야 한다. 그때는 시각적/접근성 상태는 disabled로 알리되, 실제 DOM `disabled`는 붙이지 않고 이벤트만 직접 막는다.

## enabled 상태의 `tabIndex`

disabled가 아니면 기본적으로 다음 처리를 한다.

```ts
baseProps.tabIndex = tabIndex
```

그리고 아래 코드가 한 번 더 있다.

```ts
if (!isNativeButton && !disabled) {
  baseProps.tabIndex = tabIndex
}
```

현재 구현에서는 enabled 상태의 `else`에서 이미 `tabIndex`를 넣고 있으므로 custom element enabled 조건의 추가 대입은 결과적으로 같은 값을 다시 넣는 형태다.

학습용 구현에서 명시성을 위해 남아 있는 코드로 볼 수 있다. 의미상으로는 "custom element가 enabled 상태이면 focus 가능해야 한다"는 의도를 드러낸다.

## click 처리

click handler는 다음 흐름으로 동작한다.

```ts
onClick(event: React.MouseEvent) {
  if (disabled) {
    event.preventDefault()
    return
  }

  onClick?.(event)
  if (event.defaultPrevented) {
    return
  }

  enhancedClickHandlers.onClick(event)
}
```

흐름을 풀면 다음과 같다.

1. disabled면 `preventDefault()` 하고 끝낸다.
2. 사용자가 넘긴 `onClick`을 먼저 실행한다.
3. 사용자가 `event.preventDefault()`를 호출했으면 내부 후속 동작을 멈춘다.
4. 문제가 없으면 `useEnhancedClickHandler`의 click 처리를 실행한다.

즉 사용자 코드가 내부 동작보다 우선이다.

이 설계는 중요하다. 사용자가 `onClick`에서 어떤 조건을 보고 동작을 취소하고 싶을 수 있기 때문이다.

```tsx
<Button
  onClick={(event) => {
    if (shouldBlock) {
      event.preventDefault()
    }
  }}
/>
```

이때 내부 handler가 사용자 의도를 무시하고 계속 실행되면 컴포넌트를 제어하기 어렵다.

따라서 `useButton`은 사용자 handler 실행 후 `event.defaultPrevented`를 확인한다.

## keyboard 처리

custom element를 버튼처럼 만들려면 키보드 동작을 직접 구현해야 한다.

native `<button>`은 브라우저가 `Enter`와 `Space` activation을 처리하지만, `<a role="button">`이나 `<div role="button">`은 그렇지 않다.

### `onKeyDown`

`onKeyDown`은 다음 구조다.

```ts
onKeyDown(event: React.KeyboardEvent) {
  if (disabled) {
    if (event.key !== 'Tab') {
      event.preventDefault()
    }
    return
  }

  onKeyDown?.(event)
  if (event.defaultPrevented) {
    return
  }

  if (!isNativeButton && event.key === 'Enter') {
    event.preventDefault()
    ;(event.currentTarget as HTMLElement).click()
  }

  if (!isNativeButton && event.key === ' ') {
    event.preventDefault()
  }
}
```

disabled 상태에서는 `Tab` 외의 키를 막는다.

```ts
if (event.key !== 'Tab') {
  event.preventDefault()
}
```

`Tab`은 focus 이동에 필요하므로 막지 않는다.

disabled가 아니면 사용자 `onKeyDown`을 먼저 실행한다.

```ts
onKeyDown?.(event)
```

사용자가 `preventDefault()`를 호출했다면 내부 keyboard activation은 하지 않는다.

```ts
if (event.defaultPrevented) {
  return
}
```

custom element에서 `Enter`를 누르면 click을 발생시킨다.

```ts
if (!isNativeButton && event.key === 'Enter') {
  event.preventDefault()
  ;(event.currentTarget as HTMLElement).click()
}
```

custom element에서 `Space`를 누르면 keydown에서는 기본 동작만 막는다.

```ts
if (!isNativeButton && event.key === ' ') {
  event.preventDefault()
}
```

Space keydown에서 `preventDefault()`를 하는 이유는 페이지 스크롤 같은 브라우저 기본 동작을 막기 위해서다.

### `onKeyUp`

`onKeyUp`은 다음 구조다.

```ts
onKeyUp(event: React.KeyboardEvent) {
  if (disabled) {
    if (event.key !== 'Tab') {
      event.preventDefault()
    }
    return
  }

  onKeyUp?.(event)
  if (event.defaultPrevented) {
    return
  }

  if (!isNativeButton && event.key === ' ') {
    ;(event.currentTarget as HTMLElement).click()
  }
}
```

disabled 상태 처리는 `onKeyDown`과 같다.

disabled가 아니면 사용자 `onKeyUp`을 먼저 실행한다.

사용자가 막지 않았고 custom element에서 `Space`를 뗀 경우 click을 발생시킨다.

```ts
if (!isNativeButton && event.key === ' ') {
  ;(event.currentTarget as HTMLElement).click()
}
```

이건 native button의 일반적인 키보드 감각을 흉내 낸 것이다.

- `Enter`: keydown에서 활성화
- `Space`: keyup에서 활성화

## pointer 처리

`onPointerDown`은 pointer 입력을 처리한다.

```ts
onPointerDown(event: React.PointerEvent) {
  if (disabled) {
    event.preventDefault()
    return
  }

  onPointerDown?.(event)
  if (!event.defaultPrevented) {
    enhancedClickHandlers.onPointerDown(event)
  }
}
```

흐름은 다음과 같다.

1. disabled면 `preventDefault()` 하고 끝낸다.
2. 사용자 `onPointerDown`을 먼저 실행한다.
3. 사용자가 막지 않았으면 `enhancedClickHandlers.onPointerDown`으로 넘긴다.

pointerdown을 별도로 추적하는 이유는 click event만으로는 이 click이 mouse, touch, pen 중 무엇에서 왔는지 알기 어려운 경우가 있기 때문이다.

이 정보는 `useEnhancedClickHandler`가 관리한다.

## `useEnhancedClickHandler`와의 관계

`useEnhancedClickHandler`는 `packages/react/src/internals/useEnhancedClickHandler.ts`에 있다.

```ts
export type InteractionType = 'mouse' | 'touch' | 'pen' | 'keyboard' | ''
```

이 훅은 마지막 pointer type을 기억한다.

```ts
const lastPointerTypeRef = React.useRef<InteractionType>('')
```

pointerdown이 발생하면 pointer type을 저장한다.

```ts
lastPointerTypeRef.current = event.pointerType as InteractionType
handler(event, lastPointerTypeRef.current)
```

click이 발생하면 다음 기준으로 interaction type을 판단한다.

```ts
if (event.detail === 0) {
  handler(event, 'keyboard')
} else if ('pointerType' in event) {
  handler(event, event.pointerType as InteractionType)
} else {
  handler(event, lastPointerTypeRef.current)
}
```

`event.detail === 0`이면 keyboard click으로 본다.

`pointerType`이 event에 있으면 그 값을 사용한다.

그 외에는 직전에 저장한 pointer type을 사용한다.

현재 `useButton`에서는 다음 handler를 넘긴다.

```ts
const enhancedClickHandlers = useEnhancedClickHandler((event) => {
  if (disabled) {
    event.preventDefault()
  }
})
```

현재 구현에서는 disabled 차단 쪽이 주된 의미다. 다만 구조적으로는 mouse, touch, pen, keyboard 상호작용을 구분할 수 있게 되어 있어서, 나중에 press interaction 구분이 필요한 컴포넌트에서 확장될 수 있다.

## props 병합

마지막에는 `mergeProps`로 내부 handler, base props, 외부 props를 합친다.

```ts
return mergeProps<'button'>(
  {
    onClick(...) {},
    onKeyDown(...) {},
    onKeyUp(...) {},
    onPointerDown(...) {},
  },
  baseProps,
  otherExternalProps,
)
```

여기서 인자 순서가 중요하다.

1. 내부 event handler 객체
2. `baseProps`
3. 나머지 외부 props

`mergeProps`는 `className`, `style`, event handler를 특별하게 병합한다.

```ts
if (name === 'className') {
  merged[name] = mergeClassNames(merged[name] as string | undefined, value as string)
  return
}

if (name === 'style') {
  merged[name] = {
    ...(merged[name] as React.CSSProperties | undefined),
    ...(value as React.CSSProperties | undefined),
  }
  return
}

if (isEventHandler(name, value)) {
  merged[name] = mergeEventHandlers(
    merged[name] as ((event: unknown) => void) | undefined,
    value,
  )
  return
}
```

event handler 병합은 다음 규칙을 따른다.

```ts
return (event: unknown) => {
  makeEventPreventable(event)
  nextHandler(event)
  if (!isEventPrevented(event)) {
    previousHandler(event)
  }
}
```

나중에 들어온 handler가 먼저 실행된다.

그리고 다음 중 하나라도 발생하면 이전 handler는 실행하지 않는다.

- `event.preventDefault()`가 호출됨
- `event.preventBaseUIHandler()`가 호출됨

```ts
function isEventPrevented(event: unknown) {
  return (
    isSyntheticEvent(event) &&
    (event.defaultPrevented || (event as BaseUIEvent).baseUIHandlerPrevented)
  )
}
```

이 규칙 덕분에 사용자가 외부에서 넘긴 event handler가 내부 Base UI handler를 중단시킬 수 있다.

## `useStableCallback`을 쓰는 이유

`buttonRef`는 `useStableCallback`으로 만들어진다.

```ts
const buttonRef = useStableCallback((element: HTMLElement | null) => {
  elementRef.current = element
})
```

`useStableCallback`은 callback의 identity는 안정적으로 유지하면서, 내부에서 실행하는 최신 callback은 ref로 갱신하는 유틸이다.

```ts
const callbackRef = React.useRef(callback)

useIsoLayoutEffect(() => {
  callbackRef.current = callback
})

return React.useMemo(
  () =>
    ((...args: Parameters<T>) => {
      return callbackRef.current?.(...args)
    }) as T,
  [],
)
```

이 구조의 장점은 다음과 같다.

- React render마다 새 callback을 만들지 않는다.
- stale closure 문제를 줄인다.
- ref callback이 불필요하게 detach/attach되는 흐름을 줄인다.
- 내부 구현은 최신 값을 볼 수 있다.

현재 `useButton`의 ref callback은 단순하지만, Base UI 내부 primitive에서는 ref 안정성이 중요하다.

## 전체 흐름 예시

### native button, enabled

입력:

```ts
useButton({
  disabled: false,
  native: true,
})
```

결과적으로 붙는 핵심 props:

```tsx
type="button"
tabIndex={0}
```

동작:

- 브라우저 native button semantics 사용
- click 가능
- keyboard activation 가능
- 사용자 handler가 먼저 실행됨
- 사용자가 `preventDefault()` 하면 내부 후속 handler 중단

### native button, disabled

입력:

```ts
useButton({
  disabled: true,
  native: true,
  focusableWhenDisabled: false,
})
```

결과적으로 붙는 핵심 props:

```tsx
type="button"
disabled
data-disabled=""
```

동작:

- 브라우저가 click/focus/keyboard activation 차단
- disabled 상태를 `data-disabled`로 스타일링 가능

### native button, disabled이지만 focus 가능

입력:

```ts
useButton({
  disabled: true,
  native: true,
  focusableWhenDisabled: true,
})
```

결과적으로 붙는 핵심 props:

```tsx
type="button"
aria-disabled={true}
data-disabled=""
tabIndex={0}
```

동작:

- 실제 `disabled` attribute는 붙이지 않음
- focus는 가능
- click과 keyboard activation은 handler에서 차단
- 보조 기술에는 `aria-disabled`로 disabled 상태 전달

### custom element, enabled

입력:

```ts
useButton({
  disabled: false,
  native: false,
})
```

결과적으로 붙는 핵심 props:

```tsx
role="button"
tabIndex={0}
```

동작:

- custom element를 접근성 tree에서 button으로 노출
- Enter keydown에서 click 발생
- Space keydown에서 기본 스크롤 방지
- Space keyup에서 click 발생

### custom element, disabled

입력:

```ts
useButton({
  disabled: true,
  native: false,
  focusableWhenDisabled: false,
})
```

결과적으로 붙는 핵심 props:

```tsx
role="button"
aria-disabled={true}
data-disabled=""
tabIndex={-1}
```

동작:

- custom element이므로 실제 `disabled` attribute를 쓰지 않음
- 보조 기술에는 `aria-disabled`로 disabled 상태 전달
- tab focus에서 제외
- click, pointer, keyboard activation 차단

## 설계 의도

`useButton`의 설계 의도는 public 컴포넌트와 복잡한 interaction semantics를 분리하는 것이다.

`Button.tsx`는 다음 정도만 담당한다.

- public props를 받는다.
- 기본값을 정한다.
- `useButton`에 버튼 동작 설정을 넘긴다.
- `useRenderElement`로 실제 element를 렌더링한다.

반면 `useButton`은 다음을 담당한다.

- native button과 custom element의 차이를 흡수한다.
- disabled 상태의 DOM attribute와 ARIA attribute를 정한다.
- focus 가능 여부를 정한다.
- keyboard activation을 맞춘다.
- pointer/click 흐름을 통제한다.
- 사용자 handler와 내부 handler의 우선순위를 보장한다.

이렇게 분리하면 `Button`뿐 아니라 나중의 `Toggle`, `Checkbox`, `Switch`, `NumberField` 내부 button처럼 "button-like primitive"가 필요한 곳에서 같은 규칙을 재사용할 수 있다.

## 요약

`useButton`은 단순히 `<button>` props를 조금 보태는 훅이 아니다.

진짜 `<button>`이든, 버튼처럼 쓰는 다른 element든 다음 규칙을 일관되게 맞추는 내부 primitive다.

- native/custom element 차이 처리
- `type="button"` 기본값
- `role="button"` 처리
- `disabled`와 `aria-disabled` 처리
- `data-disabled` 상태 노출
- `focusableWhenDisabled` 처리
- `tabIndex` 관리
- disabled 상태의 click/pointer/keyboard 차단
- custom element의 Enter/Space activation 구현
- 사용자 event handler 우선 실행
- `preventDefault()` 이후 내부 handler 중단
- 안정적인 ref callback 제공

결론적으로 `useButton`은 Base UI clone에서 "버튼처럼 누를 수 있는 모든 컴포넌트"의 기반이 되는 internal hook이다.
