# Phase 0. Monorepo와 Vertical Slice 기초

목표는 컴포넌트 slice를 반복해서 만들 수 있는 개발 루프를 안정화하는 것이다.

## 할 일

1. workspace 구조를 확인한다.
2. `packages/utils`와 `packages/react`의 `package.json`, `tsconfig.json`, `tsdown.config.ts`를 읽는다.
3. package export, build output, custom condition, typecheck 흐름을 이해한다.
4. `apps/playground`에서 로컬 패키지를 import하는 경로를 확인한다.
5. 원본 Base UI에서 한 컴포넌트를 읽을 때의 최소 범위를 정한다.
6. 빈 변경으로 `pnpm typecheck`와 `pnpm build`가 통과하는지 확인한다.

## 완료 기준

- 어떤 파일을 수정하면 어떤 package build에 영향을 주는지 설명할 수 있다.
- `utils`와 `react`의 export surface를 추적할 수 있다.
- 이후 phase는 "컴포넌트 목표 -> 필요한 utils -> 필요한 internals -> public component" 순서로 진행한다.
