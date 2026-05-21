# `getStateAttributesProps`와 custom mapping

대상 파일: `packages/react/src/internals/getStateAttributesProps.ts`

관련 원본:

- `/Users/youngchang/dev/references/base-ui/packages/react/src/internals/getStateAttributesProps.test.ts`
- `/Users/youngchang/dev/references/base-ui/packages/react/src/internals/field-constants/constants.ts`
- `/Users/youngchang/dev/references/base-ui/packages/react/src/internals/stateAttributesMapping.ts`
- `/Users/youngchang/dev/references/base-ui/packages/react/src/field/control/FieldControl.tsx`

## 전체 역할

`getStateAttributesProps`는 컴포넌트 내부 state를 public `data-*` attribute로 바꿔 주는 작은 helper다.

컴포넌트는 내부적으로 boolean, string, number, nullable state를 가진다. Headless UI에서는 이 state를 DOM attribute로 노출해야 사용자가 CSS selector나 테스트에서 상태를 읽을 수 있다.

```tsx
const state = {
  disabled,
  invalid,
}

return <input {...getStateAttributesProps(state)} />
```

이렇게 하면 `disabled: true`는 `data-disabled=""`, `invalid: true`는 `data-invalid=""`로 바뀐다.

## 기본 변환

기본 규칙은 state key를 소문자 `data-*` attribute 이름으로 바꾸는 것이다.

input:

```ts
getStateAttributesProps({
  disabled: true,
  invalid: false,
  orientation: 'vertical',
  count: 42,
})
```

output:

```ts
{
  'data-disabled': '',
  'data-orientation': 'vertical',
  'data-count': '42',
}
```

규칙은 다음과 같다.

- `true`는 빈 문자열 data attribute가 된다.
- truthy string/number는 문자열 값이 된다.
- `false`, `null`, `undefined`, 빈 문자열은 attribute로 노출하지 않는다.
- camelCase key는 현재 로컬/원본 구현 모두 단순 lowercase가 된다. 예를 들어 `readOnly: true`는 `data-readonly=""`가 된다.

## custom mapping

custom mapping은 특정 state key의 기본 변환을 대체한다.

input:

```ts
getStateAttributesProps(
  {
    checked: true,
    orientation: 'vertical',
  },
  {
    checked(value) {
      return { 'data-state': value ? 'checked' : 'unchecked' }
    },
  },
)
```

output:

```ts
{
  'data-state': 'checked',
  'data-orientation': 'vertical',
}
```

`checked`에는 mapping이 있으므로 기본 변환인 `data-checked=""`를 만들지 않는다. 대신 mapping 함수가 반환한 `data-state="checked"`만 들어간다.

반대로 `orientation`에는 mapping이 없으므로 기본 변환이 적용되어 `data-orientation="vertical"`이 된다.

## mapping이 `null`을 반환하는 경우

mapping 함수가 `null`을 반환하면 해당 key는 attribute를 만들지 않는다.

input:

```ts
getStateAttributesProps(
  {
    checked: false,
    orientation: 'vertical',
  },
  {
    checked(value) {
      return value === true ? { 'data-state': 'checked' } : null
    },
  },
)
```

output:

```ts
{
  'data-orientation': 'vertical',
}
```

중요한 점은 `checked`에 mapping이 있다는 사실만으로 기본 변환은 건너뛴다는 것이다. 따라서 `null`을 반환해도 `data-checked="false"`나 `data-checked` 같은 fallback attribute는 생기지 않는다.

## 원본 Base UI에서의 사용

원본 Base UI의 `Field.Control`은 `useRenderElement`에 `stateAttributesMapping: fieldValidityMapping`을 넘긴다.

```tsx
useRenderElement('input', componentProps, {
  state,
  props: [...],
  stateAttributesMapping: fieldValidityMapping,
})
```

`fieldValidityMapping`은 내부 state의 `valid` 값을 public validity data attribute로 바꾼다.

```ts
export const fieldValidityMapping = {
  valid(value: boolean | null): Record<string, string> | null {
    if (value === null) {
      return null
    }
    if (value) {
      return {
        [FieldControlDataAttributes.valid]: '',
      }
    }
    return {
      [FieldControlDataAttributes.invalid]: '',
    }
  },
}
```

변환 결과는 다음과 같다.

input:

```ts
getStateAttributesProps(
  { valid: true },
  fieldValidityMapping,
)
```

output:

```ts
{
  'data-valid': '',
}
```

input:

```ts
getStateAttributesProps(
  { valid: false },
  fieldValidityMapping,
)
```

output:

```ts
{
  'data-invalid': '',
}
```

input:

```ts
getStateAttributesProps(
  { valid: null },
  fieldValidityMapping,
)
```

output:

```ts
{}
```

기본 변환만 썼다면 `valid: false`는 attribute 없음이 되고, `valid: true`는 `data-valid=""`만 만들 수 있다. 원본은 `valid: false`를 명시적인 `data-invalid=""`로 노출해야 하므로 custom mapping을 사용한다.

## 다른 원본 예시: transition status

원본의 `transitionStatusMapping`도 같은 패턴이다.

```ts
export const transitionStatusMapping = {
  transitionStatus(value): Record<string, string> | null {
    if (value === 'starting') {
      return { 'data-starting-style': '' }
    }
    if (value === 'ending') {
      return { 'data-ending-style': '' }
    }
    return null
  },
}
```

변환은 다음과 같다.

- `transitionStatus: 'starting'` -> `data-starting-style=""`
- `transitionStatus: 'ending'` -> `data-ending-style=""`
- 그 외 transition state -> attribute 없음

이 경우도 기본 변환인 `data-transitionstatus="starting"`보다 public API에 맞는 attribute 이름을 노출해야 해서 mapping을 쓴다.

## Phase 3 Input에서의 판단

Phase 3의 로컬 `Input`은 `disabled`와 `invalid` state만 data attribute로 노출한다.

```ts
getStateAttributesProps({
  disabled,
  invalid,
})
```

이 두 state는 기본 변환으로 원하는 public attribute가 그대로 나온다.

- `disabled: true` -> `data-disabled=""`
- `invalid: true` -> `data-invalid=""`

따라서 Phase 3에서는 custom mapping을 쓰지 않는다. `required`도 `data-required`로 노출하지 않고 native `required` attribute로만 전달한다.
