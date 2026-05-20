# Phase 2. Button

목표는 disabled semantics와 click 흐름을 가진 pressable primitive를 완성한다.

## 구현 순서

1. native `button`과 custom element의 disabled 동작 차이를 정리한다.
2. `disabled`, `focusableWhenDisabled`, `type` 기본값을 구현한다.
3. internal click handler와 사용자 handler의 실행 순서를 검증한다.
4. `data-disabled`와 `aria-disabled`를 붙인다.
5. playground에 native button과 `render={<a />}` 예제를 추가한다.

## 필요한 utils

- `mergeCleanups`
- `useStableCallback`
- `useMergedRefs`
- `isElementDisabled`

## 필요한 internals

- `useButton`: disabled, role, tabIndex, click/key handling을 담당한다.
- `useEnhancedClickHandler`: disabled 상태에서 pointer/click을 차단한다.
- `mergeProps`: `preventDefault()` 이후 handler chaining 규칙을 확정한다.

## 완료 기준

- disabled native button은 클릭되지 않는다.
- disabled custom element는 `aria-disabled`와 tab focus 규칙을 따른다.
- 사용자 handler가 `preventDefault()`를 호출하면 internal 후속 handler가 멈춘다.
