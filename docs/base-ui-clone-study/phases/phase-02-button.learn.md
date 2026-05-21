# Phase 02. Button 완료

완료일: 2026-05-20

## 구현 요약

- 구현한 파일:
  - `packages/react/src/button/Button.tsx`
  - `packages/react/src/button/ButtonDataAttributes.ts`
  - `packages/react/src/internals/use-button/useButton.ts`
  - `packages/react/src/internals/useEnhancedClickHandler.ts`
  - `packages/react/src/merge-props/mergeProps.ts`
  - `packages/utils/src/isElementDisabled.ts`
  - `packages/utils/src/mergeCleanups.ts`
  - `packages/utils/src/useStableCallback.ts`
- playground:
  - native `Button`, disabled native `Button`, `focusableWhenDisabled`
  - `nativeButton={false}`와 `render={<a />}` custom element 예제
- 검증:
  - `pnpm typecheck`
  - `pnpm build`

## 학습 기록

- 이번 phase의 학습 요소:
  - native `button`은 `disabled` attribute가 focus와 click을 브라우저 차원에서 막는다.
  - custom element는 `disabled` attribute가 의미가 없어서 `role="button"`, `aria-disabled`, `tabIndex`와 event handler로 버튼 semantics를 맞춘다.
  - `focusableWhenDisabled`는 disabled 상태에서도 focus만 허용하고 activation은 막는다.
- Base UI의 설계 의도:
  - public `Button`은 작게 두고, disabled/focus/click 규칙은 `useButton` internal hook에 모은다.
  - render override가 native element를 바꿀 수 있으므로 `nativeButton`으로 native semantics 적용 여부를 명시하게 한다.
  - user handler가 먼저 실행되고, 그 handler가 기본 동작을 막으면 internal 후속 handler도 중단되는 방향으로 props merge 규칙을 둔다.
- 구현하면서 확인한 public surface:
  - `disabled?: boolean`
  - `focusableWhenDisabled?: boolean`
  - `nativeButton?: boolean`
  - 기본 native button `type="button"`
  - disabled state의 `data-disabled`
  - custom disabled element의 `aria-disabled="true"`
- 원본에서 학습용으로 줄인 부분:
  - composite widget 연동, dev-only native mismatch warning, shadow DOM keyboard path는 제외했다.
  - 원본의 `preventBaseUIHandler()`도 최소 구현했지만, phase 기준에 맞춰 `preventDefault()`도 internal handler 중단 신호로 처리했다.
  - `useEnhancedClickHandler`는 interaction type 추적과 disabled 차단만 남겼다.
- 다음 phase에서 다시 볼 부분:
  - form 관련 submit/reset semantics
  - composite item 안에서 disabled button을 focusable하게 유지하는 세부 규칙
  - 더 넓은 prop getter 형태의 `mergeProps`

## 읽은 원본

- public component:
  - `/Users/youngchang/dev/references/base-ui/packages/react/src/button/Button.tsx`
  - `/Users/youngchang/dev/references/base-ui/packages/react/src/button/ButtonDataAttributes.tsx`
- context/store:
  - 없음
- internals:
  - `/Users/youngchang/dev/references/base-ui/packages/react/src/internals/use-button/useButton.ts`
  - `/Users/youngchang/dev/references/base-ui/packages/react/src/utils/useFocusableWhenDisabled.ts`
  - `/Users/youngchang/dev/references/base-ui/packages/react/src/merge-props/mergeProps.ts`
- utils:
  - `/Users/youngchang/dev/references/base-ui/packages/utils/src/isElementDisabled.ts`
  - `/Users/youngchang/dev/references/base-ui/packages/utils/src/mergeCleanups.ts`
  - `/Users/youngchang/dev/references/base-ui/packages/utils/src/useStableCallback.ts`
  - `/Users/youngchang/dev/references/base-ui/packages/utils/src/useEnhancedClickHandler.ts`
- tests:
  - `/Users/youngchang/dev/references/base-ui/packages/react/src/button/Button.test.tsx`
  - `/Users/youngchang/dev/references/base-ui/packages/react/src/internals/use-button/useButton.test.tsx`
  - `/Users/youngchang/dev/references/base-ui/packages/react/src/merge-props/mergeProps.test.ts`

## 남긴 TODO

- 실제 DOM interaction 테스트 인프라가 생기면 disabled native/custom click 차단과 keyboard activation을 테스트로 고정한다.
