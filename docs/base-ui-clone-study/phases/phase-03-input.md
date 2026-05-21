# Phase 3. Input

목표는 native input wrapper 패턴을 완성하고 native form attribute와 input state attribute의 연결 방식을 학습한다.

## 구현 순서

1. `Input`의 public props를 native input props 위에 얇게 얹는다.
2. forwarded ref, `disabled`, `required`, `invalid` 상태를 연결한다.
3. `data-disabled`, `data-invalid`를 노출한다.
4. `required`는 native `required` attribute로만 전달한다.
5. playground에 text, required, disabled, invalid 예제를 추가한다.

## 필요한 utils

- 없음

## 필요한 internals

- `getStateAttributesProps`

## 완료 기준

- native input attribute와 component state가 충돌하지 않는다.
- forwarded ref가 native input element를 가리킨다.
- form 제출 시 native input 값이 그대로 전달된다.
- `pnpm typecheck`와 `pnpm build`가 통과한다.
