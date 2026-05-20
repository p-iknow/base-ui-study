# Phase 27. Context Menu

목표는 pointer context trigger 위에서 `Menu` foundation을 재사용한다.

## 구현 순서

1. `ContextMenu.Root`, `Trigger`, `Portal`, `Positioner`, `Popup` 구조를 만든다.
2. `contextmenu` event에서 pointer coordinates를 anchor로 저장한다.
3. long press 또는 touch behavior는 작은 범위로만 구현한다.
4. menu item, submenu, typeahead는 `Menu`를 재사용한다.
5. playground에 right-click menu 예제를 추가한다.

## 필요한 utils

- `addEventListener`
- `useStableCallback`
- `owner`

## 필요한 internals

- virtual anchor
- menu foundation
- floating positioner
- dismiss logic

## 완료 기준

- right click 위치에 popup이 열린다.
- native context menu가 필요한 경우와 막는 경우를 구분할 수 있다.
- keyboard dismiss와 item selection은 menu와 같은 규칙을 따른다.
