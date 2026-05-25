# Phase 30. Navigation Menu

목표는 menu-like navigation, viewport coordination, pointer grace behavior를 완성한다.

## 구현 순서

1. `NavigationMenu.Root`, `List`, `Item`, `Trigger`, `Content`, `Viewport`, `Link` 구조를 만든다.
2. active item과 open content를 조율한다.
3. viewport size measurement와 transition state를 구현한다.
4. pointer grace area로 content 이동 중 닫힘을 방지한다.
5. playground에 multi-column navigation 예제를 추가한다.

## 필요한 utils

- `Store`
- `useStore`
- `useAnimationFrame`
- `isMouseWithinBounds`
- `addEventListener`

## 필요한 internals

- collection registry
- viewport measurement
- pointer grace area
- transition status

## 완료 기준

- trigger hover/focus와 content open state가 안정적으로 연결된다.
- viewport가 active content 크기에 맞게 변한다.
- pointer 이동 중 의도치 않은 close가 줄어든다.
