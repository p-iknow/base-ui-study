# Phase 30. Combobox와 Autocomplete

목표는 input value, selected value, filtered collection이 섞이는 선택 컴포넌트를 완성한다.

## 구현 순서

1. `Combobox.Root`, `Input`, `Trigger`, `Portal`, `Positioner`, `Popup`, `Item` 구조를 만든다.
2. input value와 selected value를 독립적으로 controlled 처리한다.
3. filtering 중 highlighted item을 안정적으로 유지한다.
4. autocomplete API는 combobox foundation 위에 얇게 얹는다.
5. playground에 async-like filtering과 freeform input 예제를 추가한다.

## 필요한 utils

- `useControlled`
- `useStableCallback`
- `useValueAsRef`
- `useStore`

## 필요한 internals

- collection filtering
- listbox focus
- typeahead 또는 input search
- floating positioner
- hidden form control sync

## 완료 기준

- typing이 selected value를 즉시 덮어쓰지 않는다.
- filtering 후에도 keyboard navigation이 유효한 item을 가리킨다.
- controlled input value와 controlled selected value를 따로 사용할 수 있다.
