# Phase 22. Preview Card

목표는 tooltip-like popup에 richer content와 pointer timing을 더한다.

## 구현 순서

1. `PreviewCard.Root`, `Trigger`, `Portal`, `Positioner`, `Popup`, `Arrow` 구조를 만든다.
2. tooltip foundation을 재사용하되 popup hover 유지 시간을 조절한다.
3. pointer grace area와 close delay를 조합한다.
4. focus open과 pointer open의 차이를 정리한다.
5. playground에 link preview 예제를 추가한다.

## 필요한 utils

- `useTimeout`
- `useStableCallback`
- `isMouseWithinBounds`

## 필요한 internals

- floating positioner
- hover grace area
- popup store

## 완료 기준

- trigger에서 popup으로 포인터가 이동할 때 닫히지 않는다.
- Escape와 blur에서 닫힘 규칙이 일관된다.
- tooltip보다 긴 interactive content를 담을 수 있다.
