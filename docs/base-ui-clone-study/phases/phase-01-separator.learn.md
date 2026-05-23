# Phase 01. Separator 완료

완료일: 2026-05-20

## 구현 요약

- 구현한 파일:
  - `packages/utils/src/useIsoLayoutEffect.ts`
  - `packages/utils/src/useMergedRefs.ts`
  - `packages/react/src/internals/getStateAttributesProps.ts`
  - `packages/react/src/internals/types.ts`
  - `packages/react/src/internals/useRenderElement.tsx`
  - `packages/react/src/merge-props/mergeProps.ts`
  - `packages/react/src/separator/Separator.tsx`
  - `packages/react/src/separator/SeparatorDataAttributes.ts`
- playground: horizontal, vertical, `render={<hr />}` 예제를 추가했다.
- 검증: `pnpm typecheck`, `pnpm build`

## 학습 기록

- 이번 phase의 학습 요소: public component가 직접 DOM을 만들지 않고 `useRenderElement`에 기본 태그, state, internal props, forwarded ref를 넘기는 최소 흐름.
- Base UI의 설계 의도: 컴포넌트별 구현은 ARIA와 state 계산에 집중하고, DOM 태그 교체와 `className`/`style`/event/ref 병합은 공통 render pipeline에서 처리한다.
- 구현하면서 확인한 public surface: 기본 태그는 `div`, 기본 `orientation`은 `horizontal`, `role="separator"`, `aria-orientation`, `data-orientation`을 노출한다. `render`는 React element 또는 render function을 받을 수 있다.
- 상세 학습 문서: `docs/base-ui-clone-study/learn/00-use-render-element.md`
- 컴포넌트 namespace 타입 API 학습 문서: `docs/base-ui-clone-study/learn/01-component-namespace-types.md`
- 렌더 파이프라인 다이어그램: `docs/base-ui-clone-study/learn/00-use-render-element-diagram.html`
- 원본에서 학습용으로 줄인 부분: props getter, `useMergedRefsN`, render prop 경고, lazy component workaround, `button`/`img` 기본 속성 보정, cleanup ref callback 처리는 제외했다. 이후 `useRenderElement`에는 `enabled` 옵션을 추가해 `false`일 때 `null`을 반환하는 흐름을 반영했다.
- 다음 phase에서 다시 볼 부분: Button phase에서 event handler 병합 순서와 `preventBaseUIHandler` 같은 Base UI event 확장을 더 정확히 다룰 필요가 있다.

## 읽은 원본

- public component: `/Users/youngchang/dev/references/base-ui/packages/react/src/separator/Separator.tsx`
- context/store: Separator는 context/store를 사용하지 않는다.
- internals:
  - `/Users/youngchang/dev/references/base-ui/packages/react/src/internals/useRenderElement.tsx`
  - `/Users/youngchang/dev/references/base-ui/packages/react/src/internals/getStateAttributesProps.ts`
- utils:
  - `/Users/youngchang/dev/references/base-ui/packages/utils/src/useIsoLayoutEffect.ts`
  - `/Users/youngchang/dev/references/base-ui/packages/utils/src/useMergedRefs.ts`
- tests: `/Users/youngchang/dev/references/base-ui/packages/react/src/separator/Separator.test.tsx`

## 남긴 TODO

- focused component test 인프라가 생기면 `render` override의 props/ref 유지와 orientation attribute를 테스트로 고정한다.
