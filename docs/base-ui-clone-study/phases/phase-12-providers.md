# Phase 12. Direction Provider와 CSP Provider

목표는 이후 복합 컴포넌트가 공유할 direction과 style nonce context를 완성한다.

## 구현 순서

1. `DirectionProvider`와 `useDirection`을 만든다.
2. local prop, provider value, default value의 우선순위를 정한다.
3. `CspProvider`와 style nonce context를 만든다.
4. `RadioGroup`과 이후 popup style 삽입 지점에서 provider를 사용하도록 연결한다.
5. playground에 `dir="rtl"` 예제를 추가한다.

## 필요한 utils

- `useStableCallback`
- `owner`
- `detectBrowser`

## 필요한 internals

- direction context
- csp context

## 완료 기준

- provider 밖에서는 기본 direction이 안정적으로 동작한다.
- nested provider가 가까운 값을 우선한다.
- nonce가 필요한 internal에서 context 값을 읽을 수 있다.
