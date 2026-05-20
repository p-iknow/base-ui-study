# Phase 10. Progress

목표는 range math, label/value context, indicator sizing을 가진 value display component를 완성한다.

## 구현 순서

1. `Progress.Root`, `Progress.Indicator`, `Progress.Label`, `Progress.Value` 구조를 만든다.
2. `min`, `max`, `value` normalization과 invalid value warning을 구현한다.
3. label id와 value text를 root aria에 연결한다.
4. indicator에 percent 기반 style 또는 CSS variable을 전달한다.
5. playground에 determinate와 indeterminate 예제를 추가한다.

## 필요한 utils

- `useId`
- `warn`
- `formatErrorMessage`

## 필요한 internals

- range validation helper
- progress context
- `getStateAttributesProps`

## 완료 기준

- invalid range 입력은 개발 경고를 낸다.
- indeterminate 상태와 determinate 상태의 aria가 구분된다.
- indicator가 normalized percent에 맞게 렌더링된다.
