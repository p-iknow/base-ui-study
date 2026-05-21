# Phase 03. Input 완료

완료일: 2026-05-21

## 구현 요약

- 구현한 파일:
  - `packages/react/src/input/Input.tsx`
  - `packages/react/src/input/InputDataAttributes.ts`
  - `packages/react/src/input/index.ts`
  - `packages/react/src/index.ts`
  - `packages/react/package.json`
- playground:
  - text, required, disabled, invalid 예제를 추가했다.
- 검증:
  - `pnpm typecheck`
  - `pnpm build`

## 학습 기록

- 이번 phase의 학습 요소:
  - public `Input`은 native input props 위에 `invalid` state만 추가하는 얇은 wrapper로 둘 수 있다.
  - `disabled`와 `required`는 native input attribute로 브라우저 동작을 유지한다.
  - `required`는 Field validation phase 전까지 별도 state attribute로 노출하지 않는다.
  - form 제출 값은 별도 hidden input이나 controlled state를 만들지 않고 native input에 props를 통과시킬 때 그대로 유지된다.
- Base UI의 설계 의도:
  - 원본 `Input`은 `Field.Control`에 위임해 Field validation state와 연결한다.
  - 이 phase에서는 Field를 아직 구현하지 않았으므로 native input wrapper와 state attribute만 학습용으로 재현했다.
- 구현하면서 확인한 public surface:
  - 기본 태그는 `input`이다.
  - native input props, forwarded ref, `disabled`, `required`, `invalid`를 받는다.
  - `disabled`는 `disabled` attribute와 `data-disabled`를 노출한다.
  - `required`는 native `required` attribute로만 전달한다.
  - `invalid`는 `aria-invalid`와 `data-invalid`를 노출한다.
- 원본에서 학습용으로 줄인 부분:
  - `render` override, `Field.Control` 위임, `onValueChange`, controlled/uncontrolled helper, Field validation registration은 제외했다.
  - Field state의 `data-valid`, `data-touched`, `data-dirty`, `data-filled`, `data-focused`는 phase 16 이후에 다시 본다.
- 다음 phase에서 다시 볼 부분:
  - `Field` 구현 시 `Input`을 다시 `Field.Control` 위임 구조로 바꿀지 검토한다.
  - DOM 테스트 인프라가 생기면 form submission, forwarded ref, native disabled submit 제외 동작을 테스트로 고정한다.

## 별도 학습 노트

- `getStateAttributesProps`와 custom mapping:
  - `docs/base-ui-clone-study/learn/04-state-attributes-mapping.md`

## 읽은 원본

- public component:
  - `/Users/youngchang/dev/references/base-ui/packages/react/src/input/Input.tsx`
  - `/Users/youngchang/dev/references/base-ui/packages/react/src/input/InputDataAttributes.ts`
- context/store:
  - `/Users/youngchang/dev/references/base-ui/packages/react/src/field/control/FieldControl.tsx`
- internals:
  - 로컬 `packages/react/src/internals/getStateAttributesProps.ts`
  - `/Users/youngchang/dev/references/base-ui/packages/react/src/internals/getStateAttributesProps.test.ts`
  - `/Users/youngchang/dev/references/base-ui/packages/react/src/internals/field-constants/constants.ts`
  - `/Users/youngchang/dev/references/base-ui/packages/react/src/internals/stateAttributesMapping.ts`
- utils:
  - 없음
- tests:
  - `/Users/youngchang/dev/references/base-ui/packages/react/src/input/Input.test.tsx`
  - `/Users/youngchang/dev/references/base-ui/packages/react/src/input/Input.spec.tsx`

## 남긴 TODO

- Field phase에서 원본처럼 `Input`과 Field validation state를 연결한다.
