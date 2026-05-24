# Phase 05. Toggle 완료

완료일: 2026-05-23

## 구현 요약

- 구현한 파일:
  - `packages/utils/src/useControlled.ts`
  - `packages/react/src/internals/createBaseUIEventDetails.ts`
  - `packages/react/src/internals/reasons.ts`
  - `packages/react/src/internals/composite/CompositeContext.ts`
  - `packages/react/src/internals/composite/CompositeRoot.tsx`
  - `packages/react/src/internals/composite/CompositeItem.tsx`
  - `packages/react/src/toggle/Toggle.tsx`
  - `packages/react/src/toggle/ToggleDataAttributes.ts`
  - `packages/react/src/toggle-group/ToggleGroup.tsx`
  - `packages/react/src/toggle-group/ToggleGroupContext.ts`
  - `packages/react/src/toggle-group/ToggleGroupDataAttributes.ts`
- playground:
  - `apps/playground/src/routes/phase-5.tsx`
  - `/` route hub에 Phase 5 링크 추가
- 검증:
  - `pnpm typecheck`
  - `pnpm test`
  - `pnpm build`

## 학습 기록

- 이번 phase의 학습 요소:
  - `Button`의 activation/disabled 규칙 위에 controlled/uncontrolled boolean state를 얹는 방법.
  - `ToggleGroup` context가 child `Toggle`의 `pressed` 값을 `value` 배열로 제어하는 방법.
  - change event details를 공유해 `onPressedChange`와 `onValueChange`가 같은 cancel 흐름을 갖게 하는 방법.
  - 최소 Composite root/item으로 orientation별 roving focus를 구현하는 방법.
- Base UI의 설계 의도:
  - 원본 관찰: 독립 Toggle은 `pressed/defaultPressed`로 상태를 갖고, group 안 Toggle은 group value 배열 포함 여부를 우선한다.
  - 원본 관찰: `aria-pressed`는 항상 노출되고, pressed/disabled 상태는 data attribute로도 노출된다.
  - 원본 관찰: `type`과 `form`은 Toggle 자체의 form control 동작으로 확장하지 않고 내부 button의 기본 `type="button"` 규칙을 유지한다.
  - 추론: ToggleGroup은 item state를 각 Toggle에 분산시키지 않고 root의 배열 state 하나로 조율해 single/multiple 정책을 중앙화한다.
- 구현하면서 확인한 public surface:
  - `Toggle`: `pressed`, `defaultPressed`, `disabled`, `onPressedChange`, `value`, `nativeButton`, `render`, function `className/style`, forwarded ref.
  - `ToggleGroup`: `value`, `defaultValue`, `onValueChange`, `disabled`, `orientation`, `loopFocus`, `multiple`, `render`, function `className/style`, forwarded ref.
  - `Toggle.ChangeEventDetails`와 `ToggleGroup.ChangeEventDetails`: `reason`, `originalEvent`, `isCanceled`, `cancel()`.
- 원본에서 학습용으로 줄인 부분:
  - `useControlled`의 dev warning은 생략하고 첫 렌더의 controlled 판정 고정 규칙만 구현했다.
  - Composite는 ToggleGroup에 필요한 Arrow/Home/End focus 이동과 disabled item 제외만 구현했다.
  - `useBaseUiId`로 group 안 value 누락/falsy value를 보정하는 흐름은 넣지 않았다. 명시된 `value`를 그대로 사용하고, 초기화된 group 안에서 `value`가 없는 `Toggle`은 dev warning으로 알려준다.
  - Toolbar integration은 생략했다.
- 다음 phase에서 다시 볼 부분:
  - DirectionProvider 도입 후 RTL horizontal arrow key 반전.
  - 더 넓은 Composite primitive가 필요한 phase에서 roving tabindex, item metadata, nested composite 처리를 확장.

## 읽은 원본

- public component:
  - `/Users/youngchang/dev/references/base-ui/packages/react/src/toggle/Toggle.tsx`
  - `/Users/youngchang/dev/references/base-ui/packages/react/src/toggle-group/ToggleGroup.tsx`
- context/store:
  - `/Users/youngchang/dev/references/base-ui/packages/react/src/toggle-group/ToggleGroupContext.ts`
- internals:
  - phase 문서에서 요구한 `useButton`, `useRenderElement`, `createBaseUIEventDetails`, `reasons`, `CompositeRoot`, `CompositeItem`의 직접 사용 지점.
- utils:
  - 원본 Toggle/ToggleGroup이 직접 import하는 `useControlled`, `useStableCallback`.
- tests:
  - `/Users/youngchang/dev/references/base-ui/packages/react/src/toggle/Toggle.test.tsx`
  - `/Users/youngchang/dev/references/base-ui/packages/react/src/toggle-group/ToggleGroup.test.tsx`

## 남긴 TODO

- group 안 `Toggle`이 `value`를 생략했을 때 원본처럼 id fallback까지 제공할지 다음 Composite/Direction 확장 시 재검토한다.
- `DirectionProvider` phase 이후 RTL arrow key behavior를 원본과 맞춘다.

## 컴포넌트 상세 기록

### `Toggle`

대상 파일:

- `packages/react/src/toggle/Toggle.tsx`
- `packages/react/src/toggle/ToggleDataAttributes.ts`
- `packages/react/src/toggle/index.ts`

`Toggle`은 on/off 두 상태를 갖는 button 컴포넌트다. 기본 렌더링 태그는 `button`이고, `useButton`을 통해 native button과 custom button semantics를 공통으로 처리한다.

Public props의 중심은 다음 상태 API다.

```ts
interface ToggleProps<Value extends string> {
  defaultPressed?: boolean
  disabled?: boolean
  onPressedChange?: (
    pressed: boolean,
    eventDetails: Toggle.ChangeEventDetails,
  ) => void
  pressed?: boolean
  value?: Value
}
```

독립적으로 쓰이는 `Toggle`은 `pressed`/`defaultPressed`로 상태를 관리한다.

```tsx
<Toggle defaultPressed>Bold</Toggle>
```

`pressed`가 있으면 controlled 상태이고, 없으면 `defaultPressed`를 초기값으로 하는 uncontrolled 상태다. 이 분기는 `useControlled`가 맡는다.

```ts
const [pressed, setPressedState] = useControlled<boolean>({
  controlled: groupContext ? groupPressed : pressedProp,
  default: groupContext ? undefined : defaultPressedProp,
  name: 'Toggle',
  state: 'pressed',
})
```

여기서 중요한 점은 `groupContext` 존재 여부다. `ToggleGroup` 밖에서는 `pressedProp`과 `defaultPressedProp`이 그대로 사용된다. 반대로 `ToggleGroup` 안에서는 `pressedProp`과 `defaultPressedProp`보다 group의 `value` 배열이 우선한다.

클릭 처리 흐름은 다음과 같다.

```txt
click
  현재 pressed를 반전해 nextPressed 계산
  change event details 생성
  group 안이고 value가 있으면 groupContext.setGroupValue 호출
  onPressedChange 호출
  details가 cancel되지 않았으면 setPressedState 호출
```

`eventDetails`는 `cancel()`을 제공한다. 사용자가 `onPressedChange` 안에서 `details.cancel()`을 호출하면 uncontrolled 상태 변경이 반영되지 않는다. group 안에서는 같은 details 객체가 `ToggleGroup.onValueChange`에도 전달되므로, group 값 변경도 같은 취소 흐름을 따른다.

`Toggle`은 접근성 상태를 DOM에 직접 노출한다.

- `aria-pressed`: 현재 pressed 상태를 항상 노출한다.
- `data-pressed`: `pressed === true`일 때 노출된다.
- `data-disabled`: disabled 상태일 때 `useButton`을 통해 노출된다.

`nativeButton={false}`와 `render`를 함께 쓰면 `a`, `div` 같은 non-native element도 button처럼 동작하게 만들 수 있다. 이때 `useButton`은 `role="button"`, `tabIndex`, Enter/Space activation, disabled handling을 보강한다.

```tsx
<Toggle nativeButton={false} render={<a href="#bold">Bold</a>} />
```

### `ToggleGroup`

대상 파일:

- `packages/react/src/toggle-group/ToggleGroup.tsx`
- `packages/react/src/toggle-group/ToggleGroupContext.ts`
- `packages/react/src/toggle-group/ToggleGroupDataAttributes.ts`
- `packages/react/src/toggle-group/index.ts`

`ToggleGroup`은 여러 `Toggle`의 pressed 상태를 하나의 `value` 배열로 관리하는 root 컴포넌트다.

Public props의 중심은 다음 상태 API다.

```ts
interface ToggleGroupProps<Value extends string> {
  defaultValue?: readonly Value[]
  disabled?: boolean
  loopFocus?: boolean
  multiple?: boolean
  onValueChange?: (
    groupValue: Value[],
    eventDetails: ToggleGroup.ChangeEventDetails,
  ) => void
  orientation?: Orientation
  value?: readonly Value[]
}
```

기본값은 다음과 같다.

```txt
disabled = false
loopFocus = true
multiple = false
orientation = 'horizontal'
```

group 값도 `useControlled`로 관리한다.

```ts
const [groupValue, setValueState] = useControlled<readonly Value[]>({
  controlled: valueProp,
  default: valueProp === undefined ? (defaultValueProp ?? []) : undefined,
  name: 'ToggleGroup',
  state: 'value',
})
```

`value`가 있으면 controlled group이고, 없으면 `defaultValue ?? []`를 초기값으로 하는 uncontrolled group이다.

`ToggleGroup`은 `multiple` 값에 따라 다음 group value를 다르게 계산한다.

```txt
multiple = false
  nextPressed가 true이면 [newValue]
  nextPressed가 false이면 []
  결과적으로 한 번에 하나만 pressed 상태가 된다.

multiple = true
  nextPressed가 true이면 배열에 newValue 추가
  nextPressed가 false이면 배열에서 newValue 제거
  여러 Toggle이 동시에 pressed 상태가 될 수 있다.
```

`onValueChange`도 취소 가능한 event details를 받는다. `onValueChange`에서 `details.cancel()`을 호출하면 `setValueState`가 실행되지 않아 group 내부 값이 바뀌지 않는다.

`ToggleGroup`은 root DOM에 `role="group"`을 부여한다. 렌더링은 직접 `useRenderElement`를 호출하지 않고 `CompositeRoot`를 사용한다.

```tsx
<CompositeRoot
  loopFocus={loopFocus}
  orientation={orientation}
  props={[{ role: 'group' }, elementProps]}
  refs={[forwardedRef]}
  state={state}
/>
```

`refs={[forwardedRef]}`처럼 배열로 넘기는 이유는 `CompositeRoot`와 `useRenderElement`가 여러 ref를 병합할 수 있는 규약을 사용하기 때문이다. 현재 `ToggleGroup` root에는 forwarded ref 하나만 있지만, 같은 pipeline에서 내부 ref와 render element ref를 함께 합칠 수 있도록 배열 형태를 유지한다.

`ToggleGroup`의 state attributes는 다음과 같다.

- `data-disabled`: group이 disabled일 때 노출된다.
- `data-multiple`: `multiple === true`일 때 노출된다.
- `data-orientation="horizontal" | "vertical"`: orientation 값을 노출한다.

`multiple`은 custom mapping을 사용한다. false일 때 `data-multiple="false"`를 만들지 않고, true일 때만 `data-multiple`을 노출한다.

### `ToggleGroupContext`

`ToggleGroupContext`는 group root와 child `Toggle` 사이의 통신 채널이다.

```ts
interface ToggleGroupContext<Value> {
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

현재 `Toggle`이 직접 사용하는 값은 `disabled`, `value`, `setGroupValue`, `isValueInitialized`다.

- `disabled`: group disabled 상태를 child toggle에 상속한다.
- `value`: child toggle이 자신의 pressed 여부를 계산할 때 사용한다.
- `setGroupValue`: child toggle이 클릭되었을 때 group value 변경을 요청한다.
- `isValueInitialized`: 초기화된 group 안에서 child toggle에 `value`가 없는 경우 dev warning을 띄우는 데 사용한다.

`orientation`은 context에 포함되어 있지만 현재 `Toggle`에서는 직접 사용하지 않는다. focus 이동은 `CompositeRoot`의 keydown handler가 처리한다.

### Group 밖 `Toggle`과 Group 안 `Toggle`의 차이

`Toggle`의 가장 중요한 분기는 `groupContext` 존재 여부다.

```ts
const groupContext = useToggleGroupContext<Value>()
```

Group 밖에서 `Toggle`은 독립적인 pressed 상태를 가진다.

```txt
상태 소스
  pressed / defaultPressed

클릭 결과
  onPressedChange 호출
  cancel되지 않았으면 내부 pressed 상태 변경

렌더링
  useRenderElement('button', ...)
```

Group 안에서 `Toggle`은 group value 배열에 의해 controlled 된다.

```txt
상태 소스
  groupContext.value.includes(value)

클릭 결과
  groupContext.setGroupValue(value, nextPressed, details) 호출
  onPressedChange 호출
  실제 pressed 반영은 ToggleGroup value 변경 후 재계산

렌더링
  CompositeItem으로 등록
```

코드로 보면 group 안의 pressed 계산은 다음과 같다.

```ts
const groupValue = groupContext?.value ?? []
const groupPressed =
  groupContext && value !== undefined ? groupValue.includes(value) : undefined
```

그리고 `useControlled`에는 group 여부에 따라 다른 controlled/default 값이 들어간다.

```txt
group 밖
  controlled = pressedProp
  default = defaultPressedProp

group 안
  controlled = groupPressed
  default = undefined
```

따라서 group 안에서는 `defaultPressed`가 상태 초기값으로 사용되지 않는다. group의 `defaultValue` 또는 `value` 배열이 source of truth다.

### Group 안에서 `value`가 필요한 이유

`ToggleGroup`은 값 배열로 선택 상태를 관리한다.

```tsx
<ToggleGroup defaultValue={['left']}>
  <Toggle value="left">Left</Toggle>
  <Toggle value="right">Right</Toggle>
</ToggleGroup>
```

이 구조에서 `left` toggle은 다음 식으로 pressed 상태가 된다.

```ts
groupValue.includes('left')
```

만약 child `Toggle`에 `value`가 없다면 group의 값 배열과 child toggle을 연결할 식별자가 없다.

```tsx
<ToggleGroup defaultValue={['left']}>
  <Toggle>Left</Toggle>
</ToggleGroup>
```

이 경우 group은 `['left']`라는 값을 가지고 있지만, child toggle은 자신이 `left`인지 알 수 없다. 그래서 dev mode에서 다음 조건을 만족하면 경고를 낸다.

```txt
production이 아니고
group 안에 있고
Toggle에 value가 없고
ToggleGroup이 value 또는 defaultValue로 초기화되어 있다
```

이때 사용하는 값이 `isValueInitialized`다.

```ts
const isValueInitialized =
  valueProp !== undefined || defaultValueProp !== undefined
```

`isValueInitialized`는 단순 렌더링 상태가 아니라 API 사용 규칙을 표현하는 플래그다. group이 외부 값으로 초기화된 상태에서는 child toggle의 `value`가 명시되어야 group value와 item을 안정적으로 연결할 수 있다.

### `CompositeRoot`와 `CompositeItem`을 쓰는 이유

`ToggleGroup`은 선택 상태뿐 아니라 item 사이의 keyboard focus 이동도 제공한다. 이 책임은 `ToggleGroup` 자체에 직접 구현하지 않고 `CompositeRoot`/`CompositeItem`에 위임한다.

```txt
ToggleGroup
  CompositeRoot로 root DOM을 렌더한다.
  orientation과 loopFocus를 넘긴다.

Toggle
  group 안에 있을 때 CompositeItem으로 렌더된다.
  실제 button DOM을 root에 등록한다.

CompositeRoot
  등록된 item 목록을 기준으로 Arrow/Home/End focus 이동을 처리한다.
```

현재 구현에서 keyboard behavior는 다음과 같다.

- `orientation="horizontal"`: `ArrowRight`는 다음 item, `ArrowLeft`는 이전 item으로 이동한다.
- `orientation="vertical"`: `ArrowDown`은 다음 item, `ArrowUp`은 이전 item으로 이동한다.
- `Home`: 첫 item으로 이동한다.
- `End`: 마지막 item으로 이동한다.
- `loopFocus=true`: 끝에서 다음으로 이동하면 처음으로 순환한다.
- disabled item은 focus 이동 대상에서 제외된다.

이렇게 분리하면 `ToggleGroup`은 value/pressed 정책에 집중하고, composite internals는 item 등록과 focus 이동에 집중할 수 있다.

### 이벤트 취소 흐름

`Toggle`과 `ToggleGroup`은 같은 `eventDetails` 객체를 공유한다.

```txt
Toggle click
  details 생성
  ToggleGroup.onValueChange(nextGroupValue, details)
  Toggle.onPressedChange(nextPressed, details)
  details.isCanceled 확인
```

이 구조의 의미는 "상태 변경 요청"과 "상태 반영"이 분리된다는 것이다. callback은 단순 알림이 아니라 상태 변경을 취소할 수 있는 개입 지점이다.

예를 들어 `ToggleGroup.onValueChange`에서 `details.cancel()`을 호출하면 group 값은 바뀌지 않는다.

```tsx
<ToggleGroup
  onValueChange={(_, details) => {
    details.cancel()
  }}
>
  <Toggle value="left">Left</Toggle>
</ToggleGroup>
```

독립 `Toggle`에서도 `onPressedChange`가 `details.cancel()`을 호출하면 uncontrolled pressed 상태가 바뀌지 않는다.

### 이 phase에서 배운 설계 요약

`Toggle`/`ToggleGroup`의 핵심은 같은 child component가 독립 상태와 group-controlled 상태를 모두 지원한다는 점이다.

```txt
독립 Toggle
  button + pressed state

Group 안 Toggle
  button + group item + group value로부터 계산된 pressed state

ToggleGroup
  value 배열 + single/multiple 정책 + composite focus root
```

이 구조는 이후 `RadioGroup`, `CheckboxGroup`, `Tabs`, `Toolbar` 같은 composite component를 이해하는 바탕이 된다. item은 자기 DOM과 event를 제공하고, root는 group state와 keyboard navigation 정책을 중앙에서 조율한다.
