# Phase 29. Select

목표는 listbox selection, trigger/value display, popup positioning을 가진 select를 완성한다.

## 구현 순서

1. `Select.Root`, `Trigger`, `Value`, `Portal`, `Positioner`, `Popup`, `Item`, `Group`, `Label` 구조를 만든다.
2. selected value와 highlighted item을 분리한다.
3. item collection, typeahead, keyboard navigation을 구현한다.
4. hidden select/input으로 form submit을 연결한다.
5. playground에 grouped select와 controlled select 예제를 추가한다.

## 필요한 utils

- `useControlled`
- `Store`
- `useStore`
- `useStableCallback`

## 필요한 internals

- listbox collection
- typeahead
- floating positioner
- hidden form control sync
- popup store

## 완료 기준

- trigger value display가 selected item text와 동기화된다.
- highlighted item과 selected item이 혼동되지 않는다.
- form submit과 reset이 value state와 맞는다.
