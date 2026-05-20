# Phase 4. Avatar

목표는 image loading state와 fallback rendering을 가진 첫 상태 기반 display component를 완성한다.

## 구현 순서

1. `Avatar.Root`, `Avatar.Image`, `Avatar.Fallback` 구조를 만든다.
2. image load, error, idle 상태를 context로 공유한다.
3. fallback delay가 필요하면 timer를 붙인다.
4. `data-state`를 image와 fallback에 노출한다.
5. playground에 성공, 실패, 지연 fallback 예제를 추가한다.

## 필요한 utils

- `useStableCallback`
- `useValueAsRef`
- `useTimeout`

## 필요한 internals

- `createContext` helper 또는 local context 패턴
- `getStateAttributesProps`

## 완료 기준

- image load 성공 시 fallback이 보이지 않는다.
- image error 또는 src 없음 상태에서 fallback이 안정적으로 보인다.
- fallback delay cleanup이 unmount에서 안전하다.
