# Phase 16. Field

목표는 label, description, error, validity state를 묶는 field-level aria wiring을 완성한다.

## 구현 순서

1. `Field.Root`, `Field.Label`, `Field.Control`, `Field.Description`, `Field.Error` 구조를 만든다.
2. control id, label id, description id, error id를 context로 연결한다.
3. `invalid`, `disabled`, `required` 상태를 control과 text components에 전파한다.
4. native validity와 custom invalid prop의 우선순위를 정한다.
5. playground에 input field와 error message 예제를 추가한다.

## 필요한 utils

- `useId`
- `useStableCallback`
- `useMergedRefs`

## 필요한 internals

- field context
- validity state helper
- `getStateAttributesProps`

## 완료 기준

- label click이 control focus로 이어진다.
- description과 error가 `aria-describedby`에 안정적으로 연결된다.
- invalid 상태가 `aria-invalid`와 `data-invalid`에 반영된다.
