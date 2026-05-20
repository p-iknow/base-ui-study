# Phase 11. Meter

목표는 `Progress`에서 만든 range 기반을 재사용해 meter semantics를 완성한다.

## 구현 순서

1. `Meter.Root`, `Meter.Indicator`, `Meter.Label`, `Meter.Value` 구조를 만든다.
2. `min`, `max`, `low`, `high`, `optimum`, `value` validation을 구현한다.
3. `aria-valuemin`, `aria-valuemax`, `aria-valuenow`, value text를 연결한다.
4. optimum range에 따른 `data-state`를 노출한다.
5. playground에 low, medium, high meter 예제를 추가한다.

## 필요한 utils

- `useId`
- `warn`
- `formatErrorMessage`

## 필요한 internals

- range validation helper 확장
- meter context
- `getStateAttributesProps`

## 완료 기준

- meter-specific range 속성의 잘못된 조합이 경고된다.
- value text와 label이 screen reader에 연결된다.
- `Progress`와 공유할 helper의 경계가 명확하다.
