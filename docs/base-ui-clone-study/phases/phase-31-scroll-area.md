# Phase 31. Scroll Area

목표는 custom scrollbar와 viewport measurement를 가진 scroll area를 완성한다.

## 구현 순서

1. `ScrollArea.Root`, `Viewport`, `Scrollbar`, `Thumb`, `Corner` 구조를 만든다.
2. viewport size, content size, scroll ratio를 측정한다.
3. thumb drag와 wheel/scroll sync를 구현한다.
4. auto-hide delay와 hover/scroll visibility를 구현한다.
5. playground에 vertical, horizontal, both-axis 예제를 추가한다.

## 필요한 utils

- `useAnimationFrame`
- `useTimeout`
- `addEventListener`
- `mergeCleanups`

## 필요한 internals

- resize observer helper
- scroll ratio math
- thumb drag helper
- direction context integration

## 완료 기준

- native scrolling과 custom thumb position이 동기화된다.
- content resize 후 scrollbar 크기가 갱신된다.
- thumb drag cleanup이 pointer cancel과 unmount에서 안전하다.
