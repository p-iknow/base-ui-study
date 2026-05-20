# Phase 21. Popover

목표는 popup foundation을 `Popover` 완성에 필요한 만큼 구현한다.

## 구현 순서

1. `Popover.Root`, `Trigger`, `Portal`, `Positioner`, `Popup`, `Arrow`, `Backdrop` 구조를 만든다.
2. open state와 trigger/popup refs를 store로 공유한다.
3. outside press, Escape, focus outside dismiss를 구현한다.
4. floating positioner의 최소 placement와 offset을 구현한다.
5. playground에 anchored popover와 modal popover 예제를 추가한다.

## 필요한 utils

- `Store`
- `ReactStore`
- `useStore`
- `useControlled`
- `useStableCallback`
- `owner`

## 필요한 internals

- portal
- dismiss logic
- floating positioner
- focus guard
- popup store
- `getStateAttributesProps`

## 완료 기준

- trigger click으로 popup이 열리고 닫힌다.
- outside press와 Escape로 닫힌다.
- popup이 trigger 기준으로 배치된다.
