# Phase 5. Toggle

목표는 `Button` 위에 controlled/uncontrolled boolean state를 얹어 첫 stateful control을 완성한다.

## 구현 순서

1. `pressed`, `defaultPressed`, `onPressedChange` API를 만든다.
2. `Button` behavior를 재사용한다.
3. `aria-pressed`, `data-pressed`, `data-disabled`를 노출한다.
4. 같은 값으로 변경될 때 callback이 중복 호출되지 않게 한다.
5. playground에 controlled와 uncontrolled 예제를 추가한다.

## 필요한 utils

- `useControlled`
- `useStableCallback`

## 필요한 internals

- `useButton`
- `getStateAttributesProps`

## 완료 기준

- controlled와 uncontrolled 동작이 분리된다.
- keyboard와 pointer activation이 `Button`과 같은 규칙을 따른다.
- 상태 변경 callback이 실제 변경에서만 호출된다.
