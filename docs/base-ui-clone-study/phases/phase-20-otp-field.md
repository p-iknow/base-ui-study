# Phase 20. OTP Field

목표는 여러 input을 하나의 value로 조율하고 paste behavior를 처리한다.

## 구현 순서

1. `OtpField.Root`, `Input`, `HiddenInput` 구조를 만든다.
2. value string과 각 input slot을 동기화한다.
3. typing, deletion, arrow movement, paste 분배를 구현한다.
4. form submit을 위한 hidden input을 붙인다.
5. playground에 numeric OTP와 masked OTP 예제를 추가한다.

## 필요한 utils

- `useControlled`
- `useStableCallback`
- `useMergedRefs`

## 필요한 internals

- input collection
- slot value helper
- hidden input sync helper

## 완료 기준

- paste한 문자열이 빈 slot에 순서대로 들어간다.
- Backspace와 arrow movement가 예측 가능하게 동작한다.
- form submit에는 하나의 complete value가 포함된다.
