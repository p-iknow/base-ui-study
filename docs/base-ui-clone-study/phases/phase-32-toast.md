# Phase 32. Toast

목표는 provider, queue, timers, swipe dismiss, portal viewport를 가진 feedback system을 완성한다.

## 구현 순서

1. `Toast.Provider`, `Viewport`, `Root`, `Title`, `Description`, `Action`, `Close` 구조를 만든다.
2. toast queue와 visible list를 store로 관리한다.
3. duration timer, pause on hover/focus/window blur를 구현한다.
4. swipe dismiss와 removal transition을 구현한다.
5. playground에 multiple toast와 action toast 예제를 추가한다.

## 필요한 utils

- `Store`
- `useStore`
- `useTimeout`
- `useStableCallback`
- `addEventListener`

## 필요한 internals

- toast queue store
- portal
- swipe gesture helper
- transition status
- live region helper

## 완료 기준

- 여러 toast가 순서대로 viewport에 표시된다.
- hover/focus 중 timer가 멈추고 이탈 후 재개된다.
- close, action, swipe dismiss가 같은 removal 흐름을 공유한다.
