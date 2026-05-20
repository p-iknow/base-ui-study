# Phase 8. Radio Group

목표는 단일 선택 form control과 grouped keyboard navigation을 완성한다.

## 구현 순서

1. `Radio.Root`, `Radio.Indicator`, `RadioGroup` 구조를 만든다.
2. group value를 controlled/uncontrolled로 관리한다.
3. item 등록과 roving focus의 최소 구현을 붙인다.
4. arrow key 이동과 selection을 구현한다.
5. playground에 horizontal, vertical, disabled item 예제를 추가한다.

## 필요한 utils

- `useControlled`
- `useStableCallback`
- `useMergedRefs`
- `isElementDisabled`

## 필요한 internals

- collection registry
- roving focus
- hidden radio input sync helper
- `getStateAttributesProps`

## 완료 기준

- 같은 group에서 하나의 item만 checked가 된다.
- arrow key 이동이 orientation과 disabled 상태를 반영한다.
- form submit에는 선택된 radio value만 포함된다.
