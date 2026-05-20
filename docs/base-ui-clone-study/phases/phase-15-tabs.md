# Phase 15. Tabs

목표는 roving focus, activation mode, panel 연결을 가진 tabs component를 완성한다.

## 구현 순서

1. `Tabs.Root`, `Tabs.List`, `Tabs.Tab`, `Tabs.Panel` 구조를 만든다.
2. `value`, `defaultValue`, `onValueChange`를 구현한다.
3. tab과 panel id를 연결한다.
4. manual/automatic activation mode를 구현한다.
5. playground에 horizontal, vertical, manual activation 예제를 추가한다.

## 필요한 utils

- `useControlled`
- `useId`
- `useStableCallback`

## 필요한 internals

- collection registry
- roving focus
- composite item metadata
- `getStateAttributesProps`

## 완료 기준

- selected tab과 visible panel이 항상 같은 value를 공유한다.
- keyboard movement와 activation mode가 분리된다.
- disabled tab은 roving focus에서 제외된다.
