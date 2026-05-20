# Phase 6. Switch

목표는 boolean state와 form 제출을 함께 처리하는 switch control을 완성한다.

## 구현 순서

1. `Switch.Root`와 `Switch.Thumb` 구조를 만든다.
2. `checked`, `defaultChecked`, `onCheckedChange`를 구현한다.
3. form 제출을 위한 hidden input을 붙인다.
4. `role="switch"`, `aria-checked`, `data-checked`를 연결한다.
5. playground에 form submit과 disabled fieldset 예제를 추가한다.

## 필요한 utils

- `useControlled`
- `useMergedRefs`
- `useStableCallback`
- `isElementDisabled`

## 필요한 internals

- `useButton`
- hidden input sync helper
- `getStateAttributesProps`

## 완료 기준

- form submit에 switch value가 포함된다.
- form reset에서 default checked로 돌아간다.
- disabled fieldset 안에서 interaction이 막힌다.
