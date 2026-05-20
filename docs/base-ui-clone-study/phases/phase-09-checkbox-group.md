# Phase 9. Checkbox Group

목표는 여러 checkbox 값을 하나의 controlled/uncontrolled array state로 조율한다.

## 구현 순서

1. `CheckboxGroup` context와 item registration을 만든다.
2. item checkbox가 group value에 포함되는지로 checked 상태를 결정한다.
3. `onValueChange`가 중복 값 없이 호출되게 한다.
4. group disabled와 item disabled 우선순위를 정한다.
5. playground에 다중 선택 form 예제를 추가한다.

## 필요한 utils

- `useControlled`
- `useStableCallback`
- `fastObjectShallowCompare`

## 필요한 internals

- checkbox hidden input sync helper
- group context
- `getStateAttributesProps`

## 완료 기준

- value array가 중복을 만들지 않는다.
- group reset과 item reset이 예상 가능한 규칙을 가진다.
- disabled group 안에서 모든 item interaction이 막힌다.
