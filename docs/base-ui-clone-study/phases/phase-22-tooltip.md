# Phase 22. Tooltip

목표는 delayed hover/focus popup을 완성하고 popup foundation을 확장한다.

## 구현 순서

1. `Tooltip.Root`, `Trigger`, `Portal`, `Positioner`, `Popup`, `Arrow` 구조를 만든다.
2. hover와 focus open을 구현한다.
3. open delay, close delay, skip delay duration을 구현한다.
4. pointer leave와 hover grace area를 처리한다.
5. playground에 hover, focus, disabled trigger 예제를 추가한다.

## 필요한 utils

- `useTimeout`
- `useStableCallback`
- `isMouseWithinBounds`
- `addEventListener`

## 필요한 internals

- popup store 확장
- floating positioner
- delay group context
- hover grace area

## 완료 기준

- hover와 focus가 같은 open state를 공유한다.
- delay timer가 unmount와 pointer 이동에서 cleanup된다.
- tooltip은 dismiss 가능한 interactive popup과 다른 규칙을 가진다.
