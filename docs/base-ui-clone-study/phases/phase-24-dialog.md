# Phase 24. Dialog

목표는 modal state, focus trap, aria title/description을 가진 dialog를 완성한다.

## 구현 순서

1. `Dialog.Root`, `Trigger`, `Portal`, `Backdrop`, `Popup`, `Title`, `Description`, `Close` 구조를 만든다.
2. modal open state와 dismiss behavior를 구현한다.
3. focus trap, initial focus, restore focus를 구현한다.
4. scroll lock과 outside inert 처리를 붙인다.
5. playground에 modal dialog와 non-modal dialog 예제를 추가한다.

## 필요한 utils

- `useScrollLock`
- `inertValue`
- `useStableCallback`
- `useId`

## 필요한 internals

- focus trap
- portal
- dismiss logic
- dialog aria context
- popup store

## 완료 기준

- open 시 focus가 dialog 내부로 이동하고 close 후 trigger로 복귀한다.
- title과 description이 `aria-labelledby`, `aria-describedby`에 연결된다.
- modal dialog 밖의 interaction이 막힌다.
