# Phase 1. Separator

목표는 가장 작은 public component를 완성하면서 render pipeline의 최소 형태를 만든다.

## 구현 순서

1. `Separator`의 public props와 기본 태그를 정한다.
2. `orientation`에 따른 `role`, `aria-orientation`, `data-orientation`을 구현한다.
3. `render` override와 ref 전달이 필요한 최소 API를 붙인다.
4. playground에 horizontal, vertical 예제를 추가한다.

## 필요한 utils

- `useIsoLayoutEffect`: 이후 hook 구현을 위한 SSR-safe effect 기준만 준비한다.
- `useMergedRefs`: forwarded ref와 render override ref를 합친다.

## 필요한 internals

- `mergeProps`: `className`, `style`, event handler 병합의 최소 규칙을 만든다.
- `useRenderElement`: 기본 태그와 `render` prop을 연결한다.
- `getStateAttributesProps`: `orientation`을 `data-*`로 노출한다.

## 완료 기준

- `Separator`가 orientation별 aria와 data attribute를 가진다.
- `render`로 태그를 바꿔도 props와 ref가 유지된다.
- `pnpm typecheck`와 `pnpm build`가 통과한다.
