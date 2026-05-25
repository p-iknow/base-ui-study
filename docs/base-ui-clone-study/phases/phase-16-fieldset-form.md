# Phase 16. Fieldset과 Form

목표는 field 상태를 form submit/reset 흐름과 연결한다.

## 구현 순서

1. `Fieldset`으로 grouped disabled/invalid state를 제공한다.
2. `Form`에서 submit, reset, validation event를 관찰한다.
3. field validity registry를 만들고 error display와 연결한다.
4. native form behavior를 깨지 않는 범위에서 custom validation을 붙인다.
5. playground에 submit error와 reset 예제를 추가한다.

## 필요한 utils

- `addEventListener`
- `mergeCleanups`
- `useStableCallback`
- `getDefaultFormSubmitter`

## 필요한 internals

- field registry
- form context
- validity state helper 확장

## 완료 기준

- reset 시 field state가 default 상태로 돌아간다.
- submitter를 구분할 수 있다.
- disabled fieldset 안의 field가 validation과 interaction에서 제외된다.
