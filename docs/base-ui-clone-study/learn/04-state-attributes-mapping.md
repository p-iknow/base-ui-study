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
    transitionStatus: 'idle',
    orientation: 'vertical',
  },
  {
    transitionStatus(value) {
      if (value === 'starting') {
        return { 'data-starting-style': '' }
      }
      if (value === 'ending') {
        return { 'data-ending-style': '' }
      }
      return null
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

중요한 점은 `transitionStatus`에 mapping이 있다는 사실만으로 기본 변환은 건너뛴다는 것이다. 따라서 mapping이 `null`을 반환해도 `data-transitionstatus="idle"` 같은 fallback attribute는 생기지 않는다.

## `hasOwnProperty.call`을 쓰는 이유

로컬 구현은 custom mapping을 확인할 때 다음 조건을 쓴다.

```ts
Object.prototype.hasOwnProperty.call(customMapping, key)
```

이 조건은 `customMapping[key]`가 truthy인지가 아니라, mapping 객체가 해당 key를 직접 가지고 있는지를 확인한다.

이 구분이 필요한 이유는 custom mapping이 "이 state key는 내가 처리했고, 현재 값에서는 attribute를 만들지 않음"도 명시적으로 표현할 수 있어야 하기 때문이다.

input:

```ts
getStateAttributesProps(
  {
    transitionStatus: 'idle',
  },
  {
    transitionStatus(value) {
      return value === 'starting' ? { 'data-starting-style': '' } : null
    },
  },
)
```

output:

```ts
{}
```

여기서 `transitionStatus` mapping은 존재한다. 다만 `'idle'` 상태에서는 public attribute를 만들지 않기로 결정했기 때문에 `null`을 반환한다.

이때 기본 변환으로 fallback하면 안 된다. fallback하면 custom mapping의 의도와 다르게 `transitionStatus` state를 다시 기본 규칙으로 처리하게 된다.

fallback이 있었다면 잘못된 output은 다음처럼 된다.

```ts
{
  'data-transitionstatus': 'idle',
}
```

실제 흐름을 루프 기준으로 풀면 다음과 같다.

```ts
const key = 'transitionStatus'
const value = 'idle'
const props = {}

if (Object.prototype.hasOwnProperty.call(customMapping, key)) {
  const customProps = customMapping[key]?.(value)
  // customProps는 null

  if (customProps !== null) {
    Object.assign(props, customProps)
  }

  continue
}

if (value === true) {
  props[`data-${key.toLowerCase()}`] = ''
} else if (value) {
  props[`data-${key.toLowerCase()}`] = String(value)
}
```

여기서 `continue`가 실행되므로 아래 기본 변환 블록까지 내려가지 않는다.

```ts
if (value === true) {
  props[`data-${key.toLowerCase()}`] = ''
} else if (value) {
  props[`data-${key.toLowerCase()}`] = String(value)
}
```

따라서 최종 output은 그대로 빈 객체다.

```ts
{}
```

만약 `continue`가 없어서 기본 변환 블록까지 실행된다면 `value`가 truthy string인 `'idle'`이므로 다음 attribute가 생긴다.

```ts
{
  'data-transitionstatus': 'idle',
}
```

이 attribute는 custom mapping이 의도한 public attribute가 아니므로 만들면 안 된다.

또 `Object.prototype.hasOwnProperty.call` 형태는 prototype chain에 있는 속성을 mapping으로 오해하지 않고, 객체 자체의 `hasOwnProperty`가 없거나 덮어써진 경우에도 안전하다.

prototype chain을 mapping으로 오해한다는 것은, `customMapping` 객체가 직접 가진 key가 아닌데도 `customMapping[key]` 접근에서 값이 나와서 mapping이 있는 것처럼 처리되는 경우를 말한다.

예를 들어 다음 객체는 `customMapping` 자신에는 `checked` mapping만 가지고 있다. 하지만 prototype에는 `transitionStatus` mapping이 있다.

```ts
const inheritedMapping = {
  transitionStatus(value: string) {
    return { 'data-inherited-transition': value }
  },
}

const customMapping = Object.create(inheritedMapping) as {
  checked?: (value: boolean) => Record<string, string> | null
  transitionStatus?: (value: string) => Record<string, string> | null
}

customMapping.checked = (value) => (value ? { 'data-state': 'checked' } : null)
```

이때 property 접근은 prototype chain을 따라가기 때문에 값이 나온다.

```ts
customMapping.transitionStatus // inheritedMapping.transitionStatus
```

만약 구현이 단순히 `customMapping[key]`로 mapping 존재 여부를 판단하면 `transitionStatus`를 직접 정의한 mapping으로 오해한다.

```ts
const key = 'transitionStatus'

if (customMapping[key]) {
  const customProps = customMapping[key]?.('idle')
  Object.assign(props, customProps)
}
```

잘못된 output:

```ts
{
  'data-inherited-transition': 'idle',
}
```

하지만 `customMapping` 객체가 직접 가진 own property만 확인하면 다르다.

```ts
Object.prototype.hasOwnProperty.call(customMapping, 'transitionStatus') // false
Object.prototype.hasOwnProperty.call(customMapping, 'checked') // true
```

따라서 `transitionStatus`는 custom mapping이 없는 key로 보고 기본 변환을 적용하거나, 해당 state가 없으면 아무것도 하지 않는다. 의도치 않게 prototype의 함수를 public data attribute 생성 규칙으로 쓰지 않는다.

예를 들어 `Object.create(null)`로 만든 객체는 `hasOwnProperty` 메서드가 없다.

```ts
const customMapping = Object.create(null)
customMapping.checked = () => null

customMapping.hasOwnProperty // undefined
```

또 일반 객체라도 `hasOwnProperty`라는 이름의 속성을 직접 가질 수 있다.

```ts
const customMapping = {
  hasOwnProperty: () => false,
  checked: () => ({ 'data-state': 'checked' }),
}
```

그래서 helper 내부에서는 객체의 메서드를 직접 호출하지 않고 `Object.prototype.hasOwnProperty.call(customMapping, key)`를 사용한다.

## `customMapping.hasOwnProperty(key)`로 쓰면 생기는 문제

겉으로는 아래처럼 써도 같아 보인다.

```ts
customMapping.hasOwnProperty(key)
```

하지만 이 방식은 `customMapping` 객체가 항상 정상적인 `hasOwnProperty` 메서드를 가진다는 가정에 의존한다. 그 가정은 JavaScript 객체에서는 항상 맞지 않는다.

### 문제 1. `Object.create(null)` 객체

`Object.create(null)`로 만든 객체는 prototype이 없다. 따라서 `Object.prototype`에서 상속받는 `hasOwnProperty`도 없다.

input:

```ts
const customMapping = Object.create(null) as {
  checked?: (value: boolean) => Record<string, string> | null
}

customMapping.checked = (value) => (value ? { 'data-state': 'checked' } : null)

getStateAttributesProps(
  {
    checked: true,
  },
  customMapping,
)
```

만약 내부 구현이 다음과 같다면:

```ts
if (customMapping && customMapping.hasOwnProperty(key)) {
  // ...
}
```

실행 중에는 이렇게 된다.

```ts
customMapping.hasOwnProperty // undefined
customMapping.hasOwnProperty('checked') // TypeError
```

즉 mapping 자체는 정상적으로 들어 있지만, 확인 과정에서 런타임 에러가 난다.

현재 구현처럼 쓰면 이 문제가 없다.

```ts
Object.prototype.hasOwnProperty.call(customMapping, 'checked') // true
```

### 문제 2. `hasOwnProperty` 이름이 덮어써진 객체

일반 객체라도 `hasOwnProperty`라는 이름의 속성을 직접 가질 수 있다.

input:

```ts
const customMapping = {
  hasOwnProperty: () => false,
  checked(value: boolean) {
    return value ? { 'data-state': 'checked' } : null
  },
}

getStateAttributesProps(
  {
    checked: true,
  },
  customMapping,
)
```

만약 내부 구현이 `customMapping.hasOwnProperty(key)`라면:

```ts
customMapping.hasOwnProperty('checked') // false
```

객체에는 실제로 `checked` mapping이 있지만, 덮어써진 `hasOwnProperty`가 `false`를 반환하므로 mapping이 없는 것처럼 처리된다.

그 결과 기본 변환으로 fallback한다.

잘못된 output:

```ts
{
  'data-checked': '',
}
```

기대한 output:

```ts
{
  'data-state': 'checked',
}
```

현재 구현처럼 쓰면 객체 안의 `hasOwnProperty` 속성을 무시하고 `Object.prototype`의 원래 메서드를 사용한다.

```ts
Object.prototype.hasOwnProperty.call(customMapping, 'checked') // true
```

그래서 `checked` mapping이 정상적으로 실행된다.

### 문제 3. `hasOwnProperty`가 함수가 아닌 값인 객체

`hasOwnProperty`가 함수가 아닌 값으로 들어온 경우도 있다.

input:

```ts
const customMapping = {
  hasOwnProperty: true,
  checked(value: boolean) {
    return value ? { 'data-state': 'checked' } : null
  },
}
```

직접 호출 방식은 런타임 에러를 낸다.

```ts
customMapping.hasOwnProperty('checked') // TypeError
```

`Object.prototype.hasOwnProperty.call` 방식은 정상 동작한다.

```ts
Object.prototype.hasOwnProperty.call(customMapping, 'checked') // true
```

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
