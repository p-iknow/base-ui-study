# Phase 7. Checkbox

목표는 checked, unchecked, indeterminate를 가진 form control을 완성한다.

## 구현 순서

1. `Checkbox.Root`와 `Checkbox.Indicator` 구조를 만든다.
2. `checked | unchecked | indeterminate` 상태 모델을 정한다.
3. hidden input의 `checked`와 `indeterminate` DOM property를 동기화한다.
4. `aria-checked`, `data-state`, `data-disabled`를 노출한다.
5. playground에 indeterminate와 form reset 예제를 추가한다.

## 필요한 utils

- `useControlled`
- `useIsoLayoutEffect`
- `useMergedRefs`
- `useStableCallback`

## 필요한 internals

- `useButton`
- checkbox hidden input sync helper
- `getStateAttributesProps`

## 완료 기준

- indeterminate가 DOM property와 aria에 모두 반영된다.
- form submit/reset이 native checkbox 기대와 맞는다.
- indicator는 상태에 따라 mount 또는 visibility를 안정적으로 제어한다.
