# 11. `useControlled`가 controlled/uncontrolled 상태를 통일하는 방식

대상 파일:

- `packages/utils/src/useControlled.ts`

## 전체 역할

`useControlled`는 컴포넌트가 외부에서 제어되는 상태와 내부에서 관리되는 상태를 같은 형태로 다룰 수 있게 해 주는 utility hook이다.

컴포넌트 라이브러리에서는 같은 상태를 두 방식으로 제공하는 경우가 많다.

```txt
외부 제어 상태
  사용자가 prop으로 현재 값을 내려준다.
  컴포넌트는 그 값을 읽고 변경 요청만 알린다.

내부 관리 상태
  사용자가 초기값만 내려준다.
  컴포넌트가 내부 useState로 현재 값을 관리한다.
```

`useControlled`는 이 분기를 컴포넌트마다 반복하지 않도록 한 곳에 모은다. 호출자는 현재 값과 setter 모양의 함수를 받기 때문에, 컴포넌트 내부 로직은 상태가 어디에서 오는지에 덜 의존한다.

```ts
const [value, setValue] = useControlled({
  controlled,
  default: defaultValue,
  name: 'ComponentName',
  state: 'value',
})
```

## 입력 파라미터

```ts
export interface UseControlledParameters<Value> {
  controlled: Value | undefined
  default: Value | undefined
  name: string
  state?: string
}
```

`controlled`는 현재 값을 외부에서 제어할 때 쓰는 값이다. 이 값이 `undefined`가 아니면 hook은 해당 상태를 외부 제어 상태로 판단한다.

`default`는 내부 관리 상태의 초기값이다. hook 내부의 `useState` 초기값으로 사용된다.

`name`은 개발 모드 경고 메시지에 들어가는 컴포넌트 이름이다. 경고가 어느 컴포넌트에서 발생했는지 알 수 있게 한다.

`state`는 경고 메시지에 들어가는 상태 이름이다. 생략하면 `'value'`가 사용된다. 같은 hook을 `open`, `checked`, `selected` 같은 여러 상태 이름에 재사용할 수 있게 하는 장치다.

## 첫 render에서 모드를 고정하는 이유

```ts
const { current: isControlled } = React.useRef(controlled !== undefined)
```

`isControlled`는 첫 render에서만 계산되고 이후 render에서는 바뀌지 않는다. `useRef`의 `current` 값을 구조 분해로 꺼내기 때문에, 이 함수 실행 안에서 `isControlled`는 첫 render의 판정값으로 고정된다.

```txt
첫 render
  controlled !== undefined 여부를 계산
  isControlled에 저장

이후 render
  저장된 isControlled를 계속 사용
```

이 설계는 React 컴포넌트의 상태 소유권을 안정적으로 유지하기 위한 것이다. 어떤 상태가 외부에서 제어되는지, 내부에서 관리되는지는 컴포넌트 생명주기 동안 바뀌지 않는다는 전제를 둔다.

## 초기 default 값 보관

```ts
const { current: initialDefaultValue } = React.useRef(defaultValue)
```

`initialDefaultValue`도 첫 render의 `defaultValue`를 보관한다.

내부 관리 상태에서 `defaultValue`는 현재 값이 아니라 초기값이다. 따라서 hook은 나중 render의 `defaultValue`와 첫 render의 값을 비교해서, 초기화 이후 기본값이 바뀌는 사용법을 개발 모드에서 알려준다.

## 내부 상태

```ts
const [valueState, setValueState] = React.useState(defaultValue as Value)
```

`valueState`는 내부 관리 상태에서 사용할 현재 값이다. 초기값은 `defaultValue`다.

타입 단언인 `defaultValue as Value`는 `defaultValue`의 타입이 `Value | undefined`이기 때문에 필요하다. 반환 타입은 `[Value, ...]`로 선언되어 있으므로, hook 내부에서는 초기값을 `Value`로 취급한다.

이 타입 단언은 런타임 값을 바꾸지 않는다. TypeScript에게 "이 지점부터는 이 값을 `Value`로 보겠다"라고 알려 주는 역할만 한다.

## 반환할 value 선택

```ts
const value = isControlled ? (controlled as Value) : valueState
```

반환되는 `value`는 `isControlled`에 따라 달라진다.

```txt
isControlled === true
  controlled 값을 반환한다.

isControlled === false
  내부 valueState 값을 반환한다.
```

이 줄이 hook의 핵심 분기다. 컴포넌트는 반환된 `value`만 읽으면 되므로, 실제 값이 prop에서 왔는지 내부 state에서 왔는지를 렌더링 코드 곳곳에서 다시 판단할 필요가 없다.

## controlled 상태 전환 경고

첫 번째 effect는 개발 모드에서만 동작한다.

```ts
React.useEffect(() => {
  if (process.env.NODE_ENV === 'production') {
    return
  }

  const isNowControlled = controlled !== undefined
  if (
    isControlled === isNowControlled ||
    didWarnControlledSwitchRef.current
  ) {
    return
  }

  didWarnControlledSwitchRef.current = true
  console.error(/* ... */)
}, [controlled, isControlled, name, state])
```

이 effect는 첫 render의 제어 방식과 현재 render의 제어 방식이 달라졌는지 검사한다.

```txt
isControlled
  첫 render에서 결정된 제어 방식

isNowControlled
  현재 render의 controlled !== undefined 결과
```

두 값이 같으면 정상이다. 두 값이 다르면 컴포넌트 생명주기 중 상태 소유권이 바뀐 것이다.

경고는 `didWarnControlledSwitchRef`로 한 번만 출력한다. 같은 문제가 여러 render에서 반복되어도 console을 계속 오염시키지 않기 위한 처리다.

운영 빌드에서는 이 검사를 하지 않는다.

```ts
if (process.env.NODE_ENV === 'production') {
  return
}
```

사용자에게 필요한 런타임 동작은 그대로 유지하되, 개발 중에만 잘못된 사용법을 알려 주는 구조다.

## default 변경 경고

두 번째 effect도 개발 모드 전용이다.

```ts
React.useEffect(() => {
  if (
    process.env.NODE_ENV === 'production' ||
    isControlled ||
    didWarnDefaultChangeRef.current
  ) {
    return
  }

  if (
    serializeToDevModeString(initialDefaultValue) ===
    serializeToDevModeString(defaultValue)
  ) {
    return
  }

  didWarnDefaultChangeRef.current = true
  console.error(/* ... */)
}, [defaultValue, initialDefaultValue, isControlled, name, state])
```

이 effect는 내부 관리 상태에서만 의미가 있다. 그래서 `isControlled`가 `true`이면 바로 종료한다.

```txt
외부 제어 상태
  default 변경 여부를 검사하지 않는다.

내부 관리 상태
  첫 default와 현재 default를 비교한다.
```

초기값이 바뀌지 않았다면 아무 일도 하지 않는다. 초기값이 바뀌었다고 판단되면 경고를 한 번 출력한다.

이 경고의 목적은 `default` 계열 값의 의미를 분명하게 하는 것이다. 내부 관리 상태에서 `default`는 초기화 시점에만 사용된다. 이후 현재 값은 내부 `valueState`가 담당한다.

## setter 래핑

```ts
const setValueIfUncontrolled = React.useCallback(
  (nextValue: React.SetStateAction<Value>) => {
    if (!isControlled) {
      setValueState(nextValue)
    }
  },
  [isControlled],
)
```

반환되는 setter는 내부 관리 상태일 때만 `setValueState`를 호출한다.

```txt
isControlled === true
  내부 state를 변경하지 않는다.

isControlled === false
  내부 valueState를 변경한다.
```

이 래핑 덕분에 호출자는 상태 변경 시점마다 제어 방식을 직접 확인하지 않아도 된다. 상태 소유권에 따른 실제 처리 차이는 hook 내부에 남는다.

`useCallback` dependency에 들어간 `isControlled`는 첫 render 기준으로 고정된 값이다. 따라서 `setValueIfUncontrolled`의 동작도 컴포넌트 생명주기 동안 같은 제어 방식을 따른다.

## 반환 형태

```ts
return [value, setValueIfUncontrolled]
```

반환 형태는 React의 `useState`와 비슷한 tuple이다.

```txt
첫 번째 값
  현재 render에서 사용할 상태 값

두 번째 값
  내부 관리 상태일 때만 실제 내부 state를 갱신하는 함수
```

컴포넌트 구현은 이 tuple을 받아 일반적인 상태처럼 사용할 수 있다. 이 패턴은 Base UI처럼 많은 컴포넌트가 동일한 controlled/uncontrolled API를 제공해야 하는 코드베이스에서 반복을 줄인다.

## `serializeToDevModeString`

`serializeToDevModeString`은 개발 모드 경고를 위한 비교용 문자열을 만든다.

```ts
function serializeToDevModeString(input: unknown) {
  let nextId = 0
  const seen = new WeakMap<object, number>()

  try {
    const result = JSON.stringify(input, function replacer(key, value) {
      // ...
    })

    return result ?? `__top__:${typeof input}`
  } catch {
    return '__unserializable__'
  }
}
```

단순 참조 비교 대신 직렬화 문자열을 쓰는 이유는 객체 값 때문이다. 렌더마다 새 객체가 만들어져도 내용이 같으면 같은 초기값으로 볼 수 있다.

```txt
참조 비교
  객체 identity가 다르면 다른 값으로 본다.

직렬화 비교
  직렬화된 내용이 같으면 같은 값으로 본다.
```

이 함수는 개발 경고의 정확도를 높이기 위한 보조 함수다. 실제 상태 계산에는 관여하지 않는다.

## React element의 `_owner` 제외

```ts
if (
  key === '_owner' &&
  this !== null &&
  typeof this === 'object' &&
  '$$typeof' in this
) {
  return undefined
}
```

React element에는 내부 구현 세부 정보가 포함될 수 있다. 그중 `_owner`는 경고 비교에 필요한 public 값이 아니고, 직렬화 과정에서 불필요한 차이나 순환 구조 문제를 만들 수 있다.

그래서 현재 객체가 React element 형태로 보이고 key가 `_owner`이면 직렬화 결과에서 제외한다.

## bigint 처리

```ts
if (typeof value === 'bigint') {
  return `__bigint__:${value}`
}
```

`JSON.stringify`는 `bigint` 값을 기본적으로 처리하지 못한다. `bigint`가 들어오면 예외가 발생할 수 있으므로, 비교 가능한 문자열로 바꾼다.

접두사 `__bigint__:`를 붙이는 이유는 일반 문자열 값과 구분하기 위해서다.

## 순환 참조 처리

```ts
if (value !== null && typeof value === 'object') {
  const id = seen.get(value)
  if (id !== undefined) {
    return `__object__:${id}`
  }

  seen.set(value, nextId)
  nextId += 1
}
```

객체를 직렬화할 때 이미 본 객체를 다시 만나면 순환 참조일 수 있다. 일반 `JSON.stringify`는 순환 참조에서 예외를 던진다.

이 구현은 `WeakMap`에 객체별 id를 저장한다. 이미 본 객체가 다시 등장하면 실제 객체를 다시 펼치지 않고 `__object__:id` 문자열로 대체한다.

```txt
처음 보는 객체
  WeakMap에 id 저장
  원래 value 반환

이미 본 객체
  저장된 id를 문자열로 반환
```

이 처리는 경고 비교용 직렬화를 가능한 한 실패하지 않게 만든다.

## 직렬화 fallback

```ts
return result ?? `__top__:${typeof input}`
```

`JSON.stringify`는 입력값에 따라 `undefined`를 반환할 수 있다. 예를 들어 최상위 값이 `undefined`, function, symbol인 경우가 그렇다.

이때 단순히 `undefined`를 반환하지 않고 `__top__:${typeof input}` 형태의 문자열을 만든다. 이렇게 하면 최상위 값의 타입 차이도 비교 문자열에 반영된다.

```ts
} catch {
  return '__unserializable__'
}
```

직렬화 과정에서 예외가 발생하면 `__unserializable__`을 반환한다. 개발 경고를 위한 비교 때문에 렌더링 자체가 깨지지 않도록 하는 방어 코드다.

## 설계 요약

`useControlled`는 상태 소유권 판단, 현재 값 선택, 내부 상태 갱신, 개발 모드 경고를 한 hook에 모은다.

```txt
첫 render
  controlled 여부 고정
  initial default 보관
  내부 state 초기화

render 중
  제어 방식에 따라 반환 value 선택

effect
  제어 방식 전환 경고
  내부 관리 상태의 default 변경 경고

setter
  내부 관리 상태일 때만 내부 state 갱신
```

이 구조 덕분에 각 컴포넌트는 controlled/uncontrolled 분기를 직접 반복하지 않고, Base UI 전체에서 일관된 상태 규칙과 경고 메시지를 유지할 수 있다.
