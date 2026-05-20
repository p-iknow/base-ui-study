# Phase 28. Menubar와 Toolbar

목표는 horizontal composite root와 toolbar roving focus를 완성한다.

## 구현 순서

1. `Menubar.Root`, `Menu`, `Trigger`, `Portal`, `Popup` 구조를 만든다.
2. horizontal root에서 trigger 간 roving focus를 구현한다.
3. open menu 간 pointer/keyboard 이동을 조율한다.
4. `Toolbar.Root`, `Button`, `Toggle`, `Link`를 만든다.
5. playground에 app menu와 formatting toolbar 예제를 추가한다.

## 필요한 utils

- `useStableCallback`
- `useControlled`
- `isElementDisabled`

## 필요한 internals

- menu foundation
- roving focus
- composite item metadata
- direction context integration

## 완료 기준

- menubar trigger 사이 이동과 menu item 이동이 충돌하지 않는다.
- toolbar 안의 button/toggle은 roving focus 규칙을 따른다.
- direction이 horizontal keyboard movement에 반영된다.
