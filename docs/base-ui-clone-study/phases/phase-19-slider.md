# Phase 19. Slider

목표는 pointer와 keyboard로 range value를 조작하는 slider를 완성한다.

## 구현 순서

1. `Slider.Root`, `Track`, `Indicator`, `Thumb` 구조를 만든다.
2. single value부터 구현한 뒤 range value로 확장한다.
3. pointer capture와 bounding rect 기반 value 계산을 구현한다.
4. keyboard step, largeStep, min/max clamp를 구현한다.
5. playground에 horizontal, vertical, range 예제를 추가한다.

## 필요한 utils

- `useControlled`
- `useStableCallback`
- `useIsoLayoutEffect`
- `addEventListener`

## 필요한 internals

- range math helper
- pointer value resolver
- thumb collection
- direction context integration

## 완료 기준

- pointer drag 중 value가 안정적으로 업데이트된다.
- thumb focus와 keyboard interaction이 분리된다.
- range slider에서 thumb 순서와 min distance가 유지된다.
