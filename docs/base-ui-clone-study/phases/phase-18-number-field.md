# Phase 18. Number Field

목표는 parsing, formatting, stepping을 가진 spinbutton control을 완성한다.

## 구현 순서

1. `NumberField.Root`, `Input`, `Increment`, `Decrement`, `ScrubArea` 구조를 만든다.
2. string input value와 numeric value를 분리한다.
3. min, max, step, largeStep, smallStep 계산을 구현한다.
4. keyboard와 press-and-hold stepping을 구현한다.
5. playground에 currency-like formatting과 min/max 예제를 추가한다.

## 필요한 utils

- `useControlled`
- `useStableCallback`
- `useValueAsRef`
- `useInterval`
- `useTimeout`

## 필요한 internals

- number parser/formatter helper
- range clamp/step helper
- `useButton`
- field context integration

## 완료 기준

- input string이 비어 있거나 중간 입력 상태여도 numeric value가 깨지지 않는다.
- step button hold가 cleanup된다.
- aria spinbutton 속성이 value와 range를 반영한다.
