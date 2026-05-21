# Phase 4. Avatar

목표는 image loading state, fallback rendering, transition mount/unmount를 가진 첫 상태 기반 display component를 원본 Base UI Avatar의 public 동작에 가깝게 완성한다.

## 구현 순서

1. `Avatar.Root`, `Avatar.Image`, `Avatar.Fallback` 구조를 만든다.
2. image `idle`, `loading`, `loaded`, `error` 상태를 context로 공유한다.
3. `useImageLoadingStatus(src)`를 만들어 `src` 없음, load 성공, error, cached image fast path, `src` 변경 cleanup을 처리한다.
4. 원본 transition pipeline인 `useTransitionStatus`, `useOpenChangeComplete`, `useAnimationsFinished`, `AnimationFrame`/`useAnimationFrame`을 읽고 같은 책임으로 구현한다.
5. `Avatar.Image`는 image가 `loaded`일 때 mount되고, exit transition이 끝난 뒤 unmount된다.
6. `Avatar.Fallback`은 image가 `loaded`가 아니고 delay가 지난 뒤 mount되고, image가 loaded로 바뀌면 transition 규칙에 맞춰 unmount된다.
7. fallback delay는 `useTimeout`으로 구현하고 unmount cleanup을 보장한다.
8. `Avatar.Image`에 `data-starting-style`, `data-ending-style` transition data attribute를 노출한다.
9. playground에 성공, 실패, `src` 없음, 지연 fallback, animated image/fallback 전환 예제를 추가한다.

## 필요한 utils

- `useStableCallback`
- `useTimeout`
- `useIsoLayoutEffect`
- `useAnimationFrame`
- `useRefWithInit`
- `useOnMount`

## 필요한 internals

- `createContext` helper 또는 local context 패턴
- `getStateAttributesProps`
- `useTransitionStatus`
- `useOpenChangeComplete`
- `useAnimationsFinished`
- transition status attribute mapping

## 완료 기준

- image load 성공 시 fallback이 보이지 않는다.
- image load 성공 시 image가 렌더링된다.
- image loading 중에는 image가 보이지 않고 fallback이 유지된다.
- image error 또는 `src` 없음 상태에서 fallback이 안정적으로 보인다.
- cached image는 fallback flash 없이 image로 전환된다.
- image가 mount될 때 `data-starting-style`을 노출할 수 있다.
- image가 unmount되기 전 exit transition 동안 `data-ending-style`을 노출할 수 있다.
- `getAnimations().finished`가 있으면 CSS animation/transition 완료 후 unmount callback이 실행된다.
- animation API가 없거나 `BASE_UI_ANIMATIONS_DISABLED`가 켜져 있으면 완료 callback이 즉시 실행된다.
- image/fallback 전환 중 최종적으로 둘 중 하나만 DOM에 남는다.
- fallback delay cleanup이 unmount에서 안전하다.
- forwarded ref가 `Root`, `Image`, `Fallback`의 실제 DOM element를 가리킨다.
- `pnpm typecheck`와 `pnpm build`가 통과한다.

## 원본에서 이번 phase에 포함하지 않는 범위

- 원본의 broad context helper를 그대로 복제하지 않고, 이번 phase에서는 Avatar 전용 local context로 시작한다.

## 이번 phase에서 읽을 원본 transition 파일

- `/Users/youngchang/dev/references/base-ui/packages/react/src/internals/useTransitionStatus.ts`
- `/Users/youngchang/dev/references/base-ui/packages/react/src/internals/useOpenChangeComplete.tsx`
- `/Users/youngchang/dev/references/base-ui/packages/react/src/internals/useAnimationsFinished.ts`
- `/Users/youngchang/dev/references/base-ui/packages/react/src/internals/stateAttributesMapping.ts`
- `/Users/youngchang/dev/references/base-ui/packages/utils/src/useAnimationFrame.ts`
