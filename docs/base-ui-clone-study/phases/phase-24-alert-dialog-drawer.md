# Phase 24. Alert Dialog와 Drawer

목표는 `Dialog` foundation을 specialization으로 확장한다.

## 구현 순서

1. `AlertDialog`를 `role="alertdialog"`와 action/cancel semantics로 구현한다.
2. destructive action focus 규칙을 정한다.
3. `Drawer`를 edge placement dialog로 구현한다.
4. drawer의 swipe 또는 drag-to-close 최소 동작을 붙인다.
5. playground에 confirm dialog와 side drawer 예제를 추가한다.

## 필요한 utils

- `useStableCallback`
- `addEventListener`
- `useAnimationFrame`

## 필요한 internals

- dialog foundation
- edge placement helper
- swipe gesture helper
- transition status

## 완료 기준

- alert dialog는 title/description 없음을 개발 경고로 잡을 수 있다.
- drawer placement가 data attribute와 style에 반영된다.
- dialog와 공유하는 focus/dismiss 규칙이 깨지지 않는다.
