# Phase 13. Accordion

목표는 여러 `Collapsible` item을 collection과 group state로 조율한다.

## 구현 순서

1. `Accordion.Root`, `Accordion.Item`, `Accordion.Trigger`, `Accordion.Panel` 구조를 만든다.
2. single/multiple open mode의 value model을 정한다.
3. item collection을 만들고 roving focus를 붙인다.
4. arrow key, Home, End 이동을 구현한다.
5. playground에 single, multiple, disabled item 예제를 추가한다.

## 필요한 utils

- `useControlled`
- `useStableCallback`
- `useId`

## 필요한 internals

- collection registry
- roving focus
- transition status
- `getStateAttributesProps`

## 완료 기준

- single mode에서는 하나의 item만 열린다.
- disabled item은 focus와 open toggle에서 제외된다.
- keyboard movement가 orientation과 direction을 반영한다.
