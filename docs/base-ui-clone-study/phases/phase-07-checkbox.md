# Phase 7. Checkbox and Checkbox Group

목표는 checked, unchecked, indeterminate를 가진 checkbox form control과 여러 checkbox 값을 하나의 array state로 조율하는 group을 함께 완성한다.

Checkbox Group은 개별 Checkbox의 상태 모델, hidden input 동기화, disabled 규칙, form reset 규칙에 직접 기대므로 별도 phase로 나누지 않고 같은 vertical slice에서 다룬다.

## 구현 순서

1. `Checkbox.Root`와 `Checkbox.Indicator` 구조를 만든다.
2. `checked | unchecked | indeterminate` 상태 모델을 정한다.
3. hidden input의 `checked`와 `indeterminate` DOM property를 동기화한다.
4. `aria-checked`, `data-state`, `data-disabled`를 노출한다.
5. `CheckboxGroup` context와 item registration을 만든다.
6. item checkbox가 group value에 포함되는지로 checked 상태를 결정한다.
7. `onValueChange`가 중복 값 없이 호출되게 한다.
8. group disabled와 item disabled 우선순위를 정한다.
9. playground에 indeterminate, form reset, 다중 선택 form 예제를 추가한다.

## 필요한 utils

- `useControlled`
- `useIsoLayoutEffect`
- `useMergedRefs`
- `useStableCallback`
- `fastObjectShallowCompare`

## 필요한 internals

- `useButton`
- checkbox hidden input sync helper
- group context
- `getStateAttributesProps`

## 완료 기준

- indeterminate가 DOM property와 aria에 모두 반영된다.
- form submit/reset이 native checkbox 기대와 맞는다.
- indicator는 상태에 따라 mount 또는 visibility를 안정적으로 제어한다.
- value array가 중복을 만들지 않는다.
- group reset과 item reset이 예상 가능한 규칙을 가진다.
- disabled group 안에서 모든 item interaction이 막힌다.
