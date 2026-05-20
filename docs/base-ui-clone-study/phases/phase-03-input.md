# Phase 3. Input

목표는 native input wrapper 패턴을 완성하고 form component의 기본 surface를 만든다.

## 구현 순서

1. `Input`의 public props를 native input props 위에 얇게 얹는다.
2. forwarded ref, `render`, `disabled`, `required`, `invalid` 상태를 연결한다.
3. `data-disabled`, `data-required`, `data-invalid`를 노출한다.
4. playground에 text, disabled, invalid 예제를 추가한다.

## 필요한 utils

- `useMergedRefs`
- `isElementDisabled`

## 필요한 internals

- `useRenderElement`
- `getStateAttributesProps`

## 완료 기준

- native input attribute와 component state가 충돌하지 않는다.
- custom render를 써도 input ref와 props가 유지된다.
- form 제출 시 native input 값이 그대로 전달된다.
