# 13. `createBaseUIEventDetails`와 `reasons`가 change callback을 표준화하는 방식

대상 파일:

- `packages/react/src/internals/reasons.ts`
- `packages/react/src/internals/createBaseUIEventDetails.ts`
- `packages/react/src/toggle/Toggle.tsx`
- `packages/react/src/toggle-group/ToggleGroup.tsx`
- `packages/react/src/toggle-group/ToggleGroupContext.ts`

## 전체 역할

`reasons`와 `createBaseUIEventDetails`는 Base UI 컴포넌트의 change callback이 공통된 두 번째 인자를 받도록 만드는 내부 유틸이다.

현재 학습 구현에서는 `Toggle`과 `ToggleGroup`만 이 표면을 사용한다.

```tsx
<Toggle
  onPressedChange={(pressed, eventDetails) => {
    // eventDetails.reason
    // eventDetails.originalEvent
    // eventDetails.cancel()
    // eventDetails.isCanceled
  }}
/>
```

이 두 번째 인자는 단순한 부가 정보가 아니다. 사용자 callback이 내부 상태 갱신을 막을 수 있는 제어 지점이다.

```txt
사용자 interaction 발생
  Base UI가 다음 상태를 계산한다.
  details 객체를 만든다.
  사용자 callback에 details를 전달한다.
  callback이 details.cancel()을 호출했는지 확인한다.
  취소되지 않았을 때만 내부 uncontrolled state를 갱신한다.
```

이 구조 덕분에 컴포넌트는 controlled/uncontrolled API를 제공하면서도, uncontrolled 상태 변경 직전에 사용자가 변경을 거부할 수 있다.

## 왜 별도 details 객체가 필요한가

React 컴포넌트의 change callback은 보통 다음 값만 전달해도 동작할 수 있다.

```ts
onPressedChange?.(nextPressed)
```

하지만 Base UI primitive에서는 다음 요구사항이 추가된다.

```txt
변경 원인 전달
  사용자가 어떤 이유로 상태가 바뀌었는지 알 수 있어야 한다.

원본 DOM 이벤트 전달
  click, keydown, pointer event 같은 실제 event를 확인할 수 있어야 한다.

내부 처리 취소
  callback 안에서 Base UI의 내부 상태 갱신을 막을 수 있어야 한다.

여러 레이어의 취소 상태 공유
  Toggle과 ToggleGroup처럼 한 interaction이 여러 컴포넌트 callback을 거칠 때,
  같은 취소 상태를 공유해야 한다.

타입 안정성
  컴포넌트마다 가능한 reason 목록이 타입으로 좁혀져야 한다.
```

`createBaseUIEventDetails`와 `reasons`는 이 요구사항을 위한 작은 공통 언어다.

## `reasons.ts`

현재 구현:

```ts
export const REASONS = {
  none: 'none',
} as const

export interface BaseUIEventReasons {
  none: typeof REASONS.none
}
```

`REASONS`는 change가 발생한 이유를 문자열 literal로 관리한다. 현재 학습 구현에는 `none`만 있다.

`as const`를 붙였기 때문에 `REASONS.none`의 타입은 일반 `string`이 아니라 literal 타입 `'none'`이다.

```ts
typeof REASONS.none
// 'none'
```

이 literal 타입이 public type으로 이어진다.

```ts
export type ToggleChangeEventReason = typeof REASONS.none
export type ToggleGroupChangeEventReason = typeof REASONS.none
```

따라서 현재 `Toggle.ChangeEventReason`과 `ToggleGroup.ChangeEventReason`은 `'none'`만 허용한다.

## 왜 현재는 `none`만 있는가

이번 phase의 대상인 `Toggle`과 `ToggleGroup`은 원본 Base UI에서도 change reason을 `REASONS.none`으로 노출한다.

`Toggle`은 클릭으로 눌리지만, public `ChangeEventReason`은 `triggerPress`가 아니라 `none`이다. 이 phase에서는 reason을 세밀하게 분기할 필요가 없고, 요구사항은 Base UI의 callback details 표면을 맞추는 것이다.

그래서 학습 구현에서는 다음처럼 최소 버전만 둔다.

```txt
원본 Base UI
  none
  trigger-press
  trigger-hover
  trigger-focus
  outside-press
  item-press
  escape-key
  focus-out
  imperative-action
  ...

현재 학습 구현
  none
```

이 축소는 구현 범위를 줄이기 위한 선택이다. 이후 Dialog, Popover, Select, Menu 같은 컴포넌트가 들어오면 `REASONS`에 더 많은 reason이 필요해진다.

## `BaseUIEventReasons` 인터페이스

```ts
export interface BaseUIEventReasons {
  none: typeof REASONS.none
}
```

이 인터페이스는 context나 공통 타입에서 reason 타입을 key 기반으로 참조할 수 있게 한다.

예를 들어 `ToggleGroupContext`는 `REASONS.none`을 직접 import해도 되지만, 현재 구현은 `BaseUIEventReasons['none']`으로 타입을 표현한다.

```ts
setGroupValue: (
  newValue: Value,
  nextPressed: boolean,
  eventDetails: BaseUIChangeEventDetails<BaseUIEventReasons['none']>,
) => void
```

이 표현은 다음 의미를 가진다.

```txt
ToggleGroupContext.setGroupValue는 아무 details나 받지 않는다.
Base UI change event details를 받아야 한다.
그 details의 reason은 현재 none이어야 한다.
```

컴포넌트 사이의 내부 계약에도 reason 타입이 들어간다는 점이 중요하다.

## `createBaseUIEventDetails.ts`

현재 구현:

```ts
export interface BaseUIChangeEventDetails<Reason extends string> {
  cancel: () => void
  isCanceled: boolean
  originalEvent: Event | null
  reason: Reason
}
```

`BaseUIChangeEventDetails`는 change callback의 두 번째 인자 타입이다.

필드별 역할은 다음과 같다.

```txt
reason
  상태 변경 원인이다.
  현재 Toggle/ToggleGroup에서는 'none'이다.

originalEvent
  상태 변경을 유발한 원본 DOM Event다.
  Toggle click에서는 React synthetic event의 nativeEvent가 들어간다.

cancel()
  사용자 callback이 Base UI의 내부 처리를 취소할 때 호출한다.

isCanceled
  cancel()이 호출되었는지 나타낸다.
  내부 로직은 이 값을 보고 uncontrolled state 갱신 여부를 결정한다.
```

generic인 `Reason extends string`은 컴포넌트별 reason union을 유지하기 위한 장치다.

```ts
BaseUIChangeEventDetails<typeof REASONS.none>
// BaseUIChangeEventDetails<'none'>
```

나중에 `Dialog`가 다음 reason을 갖는다면:

```ts
type DialogChangeEventReason =
  | typeof REASONS.triggerPress
  | typeof REASONS.outsidePress
  | typeof REASONS.escapeKey
  | typeof REASONS.none
```

`Dialog.ChangeEventDetails`는 그 union만 허용하는 details 타입이 된다.

## details 객체 생성

```ts
export function createBaseUIEventDetails<Reason extends string>(
  reason: Reason,
  originalEvent: Event | null,
): BaseUIChangeEventDetails<Reason> {
  return {
    cancel() {
      this.isCanceled = true
    },
    isCanceled: false,
    originalEvent,
    reason,
  }
}
```

생성 함수는 reason과 original event를 받아 mutable details 객체를 만든다.

초기 상태는 다음과 같다.

```txt
reason
  호출자가 전달한 reason

originalEvent
  호출자가 전달한 DOM Event 또는 null

isCanceled
  false
```

`cancel()`이 호출되면 같은 객체의 `isCanceled`가 `true`로 바뀐다.

```ts
const details = createBaseUIEventDetails(REASONS.none, event.nativeEvent)

details.isCanceled
// false

details.cancel()

details.isCanceled
// true
```

이 구현은 단순하지만 의도가 분명하다. callback을 호출한 뒤 내부 로직이 같은 객체를 다시 읽어서 취소 여부를 확인할 수 있어야 한다.

## 왜 mutable 객체인가

`cancel()`은 값을 반환하지 않는다. 대신 details 객체 안의 상태를 바꾼다.

```ts
onPressedChange?.(nextPressed, details)

if (!details.isCanceled) {
  setPressedState(nextPressed)
}
```

이 형태에서는 사용자 callback과 내부 로직이 같은 객체를 공유한다.

```txt
Base UI
  details 객체를 만든다.

사용자 callback
  details.cancel()을 호출할 수 있다.

Base UI
  같은 details 객체의 isCanceled를 읽는다.
```

만약 `cancel()`이 boolean을 반환하는 구조였다면, 여러 callback이나 여러 내부 레이어가 같은 취소 상태를 공유하기 어렵다.

`Toggle`과 `ToggleGroup`은 이 공유가 실제로 필요하다. group 안의 `Toggle` 하나를 누르면 하나의 interaction이 다음 두 public callback과 연결될 수 있다.

```txt
ToggleGroup.onValueChange
Toggle.onPressedChange
```

두 callback이 같은 details 객체를 받기 때문에, 앞선 callback에서 취소한 결과를 뒤의 처리에서도 확인할 수 있다.

## `Toggle`에서의 사용

`Toggle`은 click handler 안에서 details를 만든다.

```ts
onClick(event) {
  const nextPressed = !pressed
  const details = createBaseUIEventDetails(REASONS.none, event.nativeEvent)

  if (groupContext && value !== undefined) {
    groupContext.setGroupValue(value, nextPressed, details)
  }

  onPressedChange?.(nextPressed, details)

  if (!details.isCanceled) {
    setPressedState(nextPressed)
  }
}
```

이 흐름은 다음 요구사항을 만족한다.

```txt
다음 상태 계산
  현재 pressed를 반전해서 nextPressed를 만든다.

원본 이벤트 보존
  React MouseEvent가 감싼 nativeEvent를 originalEvent에 담는다.

group 연동
  group 안에 있고 value가 있으면 ToggleGroup에 같은 details를 넘긴다.

public callback 호출
  onPressedChange(nextPressed, details)를 호출한다.

취소 가능 상태 갱신
  details.cancel()이 호출되지 않았을 때만 setPressedState를 실행한다.
```

여기서 `setPressedState`는 `useControlled`에서 받은 setter다. 독립 uncontrolled `Toggle`에서는 내부 state가 실제로 바뀌고, controlled `Toggle`에서는 내부 state를 바꾸지 않는다.

즉 `details.cancel()`은 uncontrolled 내부 갱신을 막는 추가 제어 지점이고, controlled 여부 처리는 `useControlled`가 맡는다.

## 독립 `Toggle`의 cancel 흐름

독립 `Toggle`에서는 details가 `onPressedChange`와 내부 state 갱신 사이의 gate 역할을 한다.

```txt
초기 상태
  pressed = false

사용자 click
  nextPressed = true
  details.isCanceled = false

onPressedChange(true, details)
  사용자가 details.cancel() 호출

Toggle 내부
  details.isCanceled === true
  setPressedState(true)를 실행하지 않음

결과
  uncontrolled pressed는 false로 유지
```

사용자는 다음처럼 변경을 거부할 수 있다.

```tsx
<Toggle
  defaultPressed={false}
  onPressedChange={(nextPressed, details) => {
    if (nextPressed) {
      details.cancel()
    }
  }}
>
  Bold
</Toggle>
```

이 예시에서는 켜지는 동작만 취소된다.

## `ToggleGroup`에서의 사용

`ToggleGroup`은 details를 직접 만들지 않는다. child `Toggle`이 만든 details를 context를 통해 받는다.

```ts
const setGroupValue = useStableCallback(
  (
    newValue: Value,
    nextPressed: boolean,
    eventDetails: BaseUIChangeEventDetails<typeof REASONS.none>,
  ) => {
    let nextGroupValue: Value[]

    if (multiple) {
      nextGroupValue = groupValue.slice() as Value[]
      const index = nextGroupValue.indexOf(newValue)

      if (nextPressed && index === -1) {
        nextGroupValue.push(newValue)
      } else if (!nextPressed && index !== -1) {
        nextGroupValue.splice(index, 1)
      }
    } else {
      nextGroupValue = nextPressed ? [newValue] : []
    }

    onValueChange?.(nextGroupValue, eventDetails)

    if (!eventDetails.isCanceled) {
      setValueState(nextGroupValue)
    }
  },
)
```

`ToggleGroup`에서 details가 필요한 이유는 `onValueChange`도 취소 가능해야 하기 때문이다.

```tsx
<ToggleGroup
  defaultValue={[]}
  onValueChange={(nextValue, details) => {
    if (nextValue.length > 2) {
      details.cancel()
    }
  }}
  multiple
/>
```

이 예시에서는 세 번째 값을 추가하려는 변경을 취소할 수 있다.

`ToggleGroup`의 내부 값 계산은 `multiple`에 따라 달라지지만, callback과 cancel 처리 방식은 동일하다.

```txt
multiple === false
  nextPressed가 true면 [newValue]
  nextPressed가 false면 []

multiple === true
  nextPressed가 true면 배열에 newValue 추가
  nextPressed가 false면 배열에서 newValue 제거

공통
  onValueChange(nextGroupValue, eventDetails)
  eventDetails.isCanceled가 false일 때만 내부 value state 갱신
```

## group 안 `Toggle`과 `ToggleGroup`이 같은 details를 공유하는 이유

group 안의 `Toggle` click은 두 개의 상태 표면을 건드린다.

```txt
Toggle 관점
  pressed가 바뀐다.

ToggleGroup 관점
  value 배열이 바뀐다.
```

하지만 실제 사용자 interaction은 하나다. 따라서 하나의 details 객체를 공유해야 한다.

현재 흐름은 다음과 같다.

```txt
Toggle click
  nextPressed 계산
  details 생성

Toggle -> ToggleGroup
  groupContext.setGroupValue(value, nextPressed, details)

ToggleGroup
  nextGroupValue 계산
  onValueChange(nextGroupValue, details)
  details가 취소되지 않았으면 group value state 갱신

Toggle
  onPressedChange(nextPressed, details)
  details가 취소되지 않았으면 pressed state 갱신
```

같은 details를 공유하면 다음이 가능하다.

```txt
ToggleGroup.onValueChange에서 cancel
  group value state 갱신이 취소된다.
  이후 Toggle의 isCanceled 검사에도 취소 상태가 보인다.

Toggle.onPressedChange에서 cancel
  Toggle의 pressed state 갱신이 취소된다.
```

현재 구현 순서에서는 `ToggleGroup`의 callback이 `Toggle`의 `onPressedChange`보다 먼저 실행된다. 따라서 group callback에서 취소한 결과는 `Toggle`의 마지막 `setPressedState` 검사에도 반영된다.

## `ToggleGroupContext`의 내부 계약

`ToggleGroupContext`는 `Toggle`이 group root에 value 변경을 요청하는 내부 통로다.

```ts
export interface ToggleGroupContext<Value> {
  disabled: boolean
  isValueInitialized: boolean
  orientation: Orientation
  setGroupValue: (
    newValue: Value,
    nextPressed: boolean,
    eventDetails: BaseUIChangeEventDetails<BaseUIEventReasons['none']>,
  ) => void
  value: readonly Value[]
}
```

`setGroupValue`가 details를 필수 인자로 받는다는 점이 중요하다.

```txt
좋지 않은 내부 계약
  setGroupValue(value, pressed)

현재 내부 계약
  setGroupValue(value, pressed, eventDetails)
```

현재 계약은 group value 변경이 항상 Base UI change event 흐름 안에서 일어나도록 강제한다. 그래서 `ToggleGroup`은 `onValueChange`를 호출할 때 별도의 details를 새로 만들 필요가 없고, child `Toggle`에서 시작된 interaction 정보를 그대로 전달할 수 있다.

## public type 표면

`Toggle`의 public callback 타입:

```ts
onPressedChange?: (
  pressed: boolean,
  eventDetails: Toggle.ChangeEventDetails,
) => void
```

`Toggle.ChangeEventDetails`는 다음 타입이다.

```ts
export type ToggleChangeEventDetails =
  BaseUIChangeEventDetails<Toggle.ChangeEventReason>
```

`ToggleGroup`도 같은 구조다.

```ts
onValueChange?: (
  groupValue: Value[],
  eventDetails: ToggleGroup.ChangeEventDetails,
) => void
```

```ts
export type ToggleGroupChangeEventDetails =
  BaseUIChangeEventDetails<ToggleGroup.ChangeEventReason>
```

이 namespace type export는 Base UI의 public API 패턴을 맞추기 위한 것이다.

사용자 입장에서는 다음처럼 컴포넌트 namespace에서 타입을 가져올 수 있다.

```ts
function handlePressedChange(
  pressed: boolean,
  details: Toggle.ChangeEventDetails,
) {
  if (details.reason === 'none') {
    // 현재 Toggle에서는 reason이 none으로 좁혀진다.
  }
}
```

## `originalEvent`의 의미

`Toggle`은 details를 만들 때 `event.nativeEvent`를 넘긴다.

```ts
const details = createBaseUIEventDetails(REASONS.none, event.nativeEvent)
```

React의 `onClick` handler가 받는 값은 `React.MouseEvent`다. 이 이벤트 객체는 React synthetic event다. Base UI details에는 이 synthetic event 전체가 아니라 브라우저 native event를 담는다.

```txt
React onClick event
  React가 감싼 synthetic event

event.nativeEvent
  브라우저 원본 DOM event

details.originalEvent
  event.nativeEvent
```

사용자는 callback에서 원본 이벤트 정보를 확인할 수 있다.

```tsx
<Toggle
  onPressedChange={(pressed, details) => {
    console.log(details.originalEvent?.type)
  }}
/>
```

현재 click activation에서는 보통 `click` event가 들어간다.

## 원본 Base UI와의 차이

원본 Base UI의 `createBaseUIEventDetails`는 학습 구현보다 넓다.

원본에는 다음 요소들이 더 있다.

```txt
event
  reason별 native event 타입을 매핑한다.

trigger
  이벤트를 유발한 element를 담을 수 있다.

allowPropagation()
  Base UI가 막는 propagation을 허용하는 escape hatch다.

isPropagationAllowed
  propagation 허용 여부를 알려준다.

customProperties
  컴포넌트별 추가 정보를 details에 합칠 수 있다.

createGenericEventDetails
  cancel 기능이 없는 generic event details를 만든다.
```

원본의 reason 목록도 훨씬 많다.

```txt
trigger-press
trigger-hover
trigger-focus
outside-press
item-press
close-press
escape-key
focus-out
list-navigation
cancel-open
sibling-open
imperative-action
window-resize
...
```

현재 학습 구현은 `Toggle`과 `ToggleGroup`에 필요한 요구사항만 만족한다.

```txt
현재 구현에 포함
  reason
  originalEvent
  cancel()
  isCanceled

현재 구현에서 제외
  reason별 event 타입 매핑
  trigger element
  propagation 제어
  custom properties
  generic event details
  popup/select/menu용 다양한 reason
```

이 축소는 의도적이다. Phase 5의 목표는 첫 stateful control과 group 연동을 구현하면서 Base UI의 callback details 표면을 배우는 것이다.

## 요구사항과 달성 방식 요약

```txt
요구사항: change callback이 다음 값뿐 아니라 details도 받아야 한다.
달성: BaseUIChangeEventDetails 타입과 createBaseUIEventDetails 함수를 둔다.

요구사항: 상태 변경 이유를 타입으로 표현해야 한다.
달성: REASONS.none을 literal object로 만들고 ChangeEventReason 타입이 이를 참조한다.

요구사항: 원본 DOM event를 전달해야 한다.
달성: Toggle click handler에서 event.nativeEvent를 originalEvent로 넘긴다.

요구사항: 사용자가 내부 상태 갱신을 취소할 수 있어야 한다.
달성: details.cancel()이 isCanceled를 true로 바꾸고, 내부 setter 호출 전에 isCanceled를 검사한다.

요구사항: Toggle과 ToggleGroup이 같은 interaction의 취소 상태를 공유해야 한다.
달성: Toggle에서 details를 한 번 만들고 groupContext.setGroupValue와 onPressedChange에 같은 객체를 넘긴다.

요구사항: public API 타입이 Base UI 패턴을 따라야 한다.
달성: Toggle.ChangeEventDetails, Toggle.ChangeEventReason, ToggleGroup.ChangeEventDetails, ToggleGroup.ChangeEventReason을 namespace 타입으로 export한다.
```

## 읽을 때 기억할 점

이 두 내부 파일은 현재 코드만 보면 너무 작아 보인다. 하지만 실제 역할은 상태 변경 callback의 protocol을 정의하는 것이다.

```txt
reasons
  왜 바뀌었는가?

originalEvent
  어떤 DOM event에서 왔는가?

cancel()
  Base UI 내부 처리를 계속해도 되는가?

isCanceled
  callback 이후 내부 state update를 실행할 것인가?
```

`Toggle`/`ToggleGroup` phase에서는 reason이 `none` 하나뿐이라 reason 분기의 장점이 크게 드러나지 않는다. 대신 cancel 가능한 details 객체가 여러 컴포넌트 레이어를 통과하며 하나의 interaction을 조율하는 방식이 핵심 학습 포인트다.
