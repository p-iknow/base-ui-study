# Phase 13. Collapsible

목표는 open state, mounted state, transition attribute를 가진 disclosure primitive를 완성한다.

## 구현 순서

1. `Collapsible.Root`, `Collapsible.Trigger`, `Collapsible.Panel` 구조를 만든다.
2. `open`, `defaultOpen`, `onOpenChange`를 구현한다.
3. trigger의 `aria-expanded`와 panel id를 연결한다.
4. panel mount/unmount와 transition 상태를 분리한다.
5. playground에 기본, controlled, animated 예제를 추가한다.

## 필요한 utils

- `useControlled`
- `useId`
- `useStableCallback`

## 필요한 internals

- transition status
- `useButton`
- `getStateAttributesProps`

## 완료 기준

- trigger와 panel aria wiring이 안정적이다.
- closed 후 exit transition 동안 panel mount를 유지할 수 있다.
- open state 변경이 controlled/uncontrolled 양쪽에서 일관된다.
