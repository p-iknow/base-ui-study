# Phase 26. Menu

목표는 composite focus, nested popup, typeahead를 가진 menu system을 완성한다.

## 구현 순서

1. `Menu.Root`, `Trigger`, `Portal`, `Positioner`, `Popup`, `Item`, `CheckboxItem`, `RadioGroup`, `RadioItem` 구조를 만든다.
2. highlighted item과 selected item state를 분리한다.
3. roving focus와 typeahead search를 구현한다.
4. nested submenu open delay와 pointer grace area를 구현한다.
5. playground에 checkbox/radio item과 submenu 예제를 추가한다.

## 필요한 utils

- `Store`
- `useStore`
- `useTimeout`
- `isMouseWithinBounds`
- `useStableCallback`

## 필요한 internals

- collection registry
- composite focus
- typeahead
- nested popup coordination
- floating positioner

## 완료 기준

- arrow key와 typeahead가 highlighted item을 안정적으로 바꾼다.
- submenu pointer 이동 중 부모 menu가 닫히지 않는다.
- checkbox/radio item state와 aria가 맞는다.
