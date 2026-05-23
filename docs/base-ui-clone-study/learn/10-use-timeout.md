# 10. `useTimeout`이 timer 작업의 생명주기를 React에 묶는 방식

대상 파일:

- `packages/utils/src/useTimeout.ts`
- `packages/utils/src/useRefWithInit.ts`
- `packages/utils/src/useOnMount.ts`

관련 사용처:

- `packages/react/src/avatar/fallback/AvatarFallback.tsx`

## 전체 역할

`useTimeout`은 React 컴포넌트 안에서 `setTimeout`을 안전하게 사용하기 위한 utility다.

브라우저의 `setTimeout`은 한번 예약되면 React 컴포넌트의 생명주기를 알지 못한다. 컴포넌트가 unmount된 뒤에도 callback이 실행될 수 있고, props 변경 때문에 새 timeout을 예약할 때 이전 timeout을 직접 취소하지 않으면 오래된 callback이 나중에 실행될 수 있다.

`useTimeout`은 이 책임을 작은 class와 hook 조합으로 나눈다.

```txt
Timeout instance
  현재 예약된 native timeout id 하나를 기억한다.
  새 timeout을 시작하기 전에 기존 timeout을 취소한다.
  clear로 현재 timeout을 명시적으로 취소할 수 있다.

useTimeout
  Timeout instance를 컴포넌트 생명주기 동안 1개로 고정한다.
  mount effect cleanup으로 unmount 시 clear를 연결한다.
  호출자에게 안정적인 Timeout instance를 반환한다.
```

이 utility는 여러 timeout을 queue로 관리하는 도구가 아니다. 컴포넌트 또는 기능 단위에서 "현재 유효한 timeout 하나"를 관리하기 위한 도구다.

## TimeoutId 타입

```ts
type TimeoutId = ReturnType<typeof setTimeout>
```

`setTimeout`의 반환 타입은 실행 환경에 따라 달라질 수 있다.

브라우저 DOM 환경에서는 보통 `number`지만, Node 타입이 섞인 TypeScript 환경에서는 `NodeJS.Timeout` 형태가 될 수 있다. 이 저장소처럼 패키지 코드가 여러 환경 타입과 함께 컴파일될 수 있는 경우 `number`로 고정하면 타입 충돌이 날 수 있다.

그래서 `ReturnType<typeof setTimeout>`을 사용한다.

```txt
setTimeout의 실제 타입
  현재 TypeScript 환경이 알고 있는 반환 타입을 그대로 따른다.

TimeoutId
  clearTimeout에 넘길 수 있는 id 타입을 환경에 맞게 보존한다.
```

## Timeout class

```ts
export class Timeout {
  static create() {
    return new Timeout()
  }

  currentId: TimeoutId | null = null
}
```

`Timeout` class는 현재 예약된 timeout id를 `currentId`에 저장한다.

- `currentId === null`: 현재 예약된 timeout이 없다.
- `currentId !== null`: 아직 실행되지 않았거나 취소되지 않은 timeout이 있다.

`static create()`는 `new Timeout()`을 감싼 작은 factory다. 이 factory 덕분에 hook에서는 `useRefWithInit(Timeout.create)`처럼 생성 함수를 넘길 수 있다.

```txt
Timeout.create
  Timeout instance 생성 방식을 함수 값으로 전달하기 쉽게 만든다.

useRefWithInit(Timeout.create)
  첫 render에서만 Timeout instance를 만든다.
```

## start

```ts
start(delay: number, callback: () => void) {
  this.clear()
  this.currentId = setTimeout(() => {
    this.currentId = null
    callback()
  }, delay)
}
```

`start`는 timeout을 하나 예약한다.

가장 중요한 줄은 첫 줄의 `this.clear()`다. `Timeout` instance는 동시에 하나의 timeout만 관리하므로, 새 timeout을 시작하기 전에 이전 timeout을 항상 정리한다.

```txt
start(delay, callback)
  이전 timeout이 있으면 clearTimeout으로 취소
  새 setTimeout 등록
  반환된 id를 currentId에 저장
```

예를 들어 `delay` prop이 바뀌는 컴포넌트에서 이전 timeout을 취소하지 않으면 다음 문제가 생길 수 있다.

```txt
delay = 1000으로 timeout A 예약
300ms 뒤 delay = 200으로 timeout B 예약

timeout B가 먼저 실행됨
나중에 timeout A도 실행될 수 있음
오래된 상태 전이가 뒤늦게 발생함
```

`start`가 항상 `clear()`를 먼저 호출하면 이 흐름은 다음처럼 바뀐다.

```txt
delay = 1000으로 timeout A 예약
300ms 뒤 delay = 200으로 timeout B 예약
  timeout A 취소
  timeout B만 남김

timeout B만 실행됨
```

이 설계는 "마지막으로 예약한 timeout만 유효하다"는 의미를 코드에 강하게 반영한다.

## timeout callback 내부의 currentId 초기화

```ts
this.currentId = setTimeout(() => {
  this.currentId = null
  callback()
}, delay)
```

timeout이 실제로 실행되면 callback을 호출하기 전에 `currentId`를 `null`로 바꾼다.

이 처리가 없으면 timeout이 이미 실행된 뒤에도 `currentId`에는 오래된 id가 남는다. 그러면 외부에서 `clear()`를 호출했을 때 이미 실행 완료된 timeout을 다시 취소하려고 시도하게 된다.

실행 전에 `currentId`를 비우면 instance 상태가 실제 예약 상태와 맞아진다.

```txt
예약 직후
  currentId = native timeout id

timeout 실행 시작
  currentId = null

callback 실행
  instance는 더 이상 예약된 timeout이 없다고 표현
```

callback보다 먼저 `currentId`를 비우는 점도 중요하다. callback 안에서 다시 `start()`를 호출하는 경우에도 상태가 꼬이지 않는다.

```txt
timeout A 실행
  currentId = null
  callback 안에서 start(timeout B)
    clear는 아무것도 취소하지 않음
    timeout B id 저장
```

만약 `callback()` 이후에 `currentId = null`을 했다면, callback 안에서 새로 저장한 timeout B id를 다시 null로 덮어쓸 위험이 있다.

## clear

```ts
clear = () => {
  if (this.currentId !== null) {
    clearTimeout(this.currentId)
    this.currentId = null
  }
}
```

`clear`는 현재 예약된 timeout이 있으면 취소하고 `currentId`를 비운다.

`currentId !== null` 조건은 불필요한 `clearTimeout` 호출을 막기 위한 guard다. 동시에 `currentId`가 `null`이라는 상태를 "취소할 작업이 없음"이라는 명확한 의미로 유지한다.

여기서 `clear`가 class method가 아니라 arrow property로 정의된 점도 의도적이다.

```ts
clear = () => {
  // ...
}
```

이 방식은 `this` binding을 instance에 고정한다. 그래서 아래처럼 함수를 값으로 넘겨도 `this.currentId` 접근이 깨지지 않는다.

```ts
return timeout.clear
```

일반 method였다면 다음과 같은 형태가 된다.

```ts
clear() {
  // ...
}
```

이 경우 `const cleanup = timeout.clear`처럼 method만 떼어내 호출할 때 `this`가 사라질 수 있다. React effect cleanup으로 함수를 그대로 반환하는 이 코드에서는 arrow property가 더 안전하다.

## disposeEffect

```ts
disposeEffect = () => {
  return this.clear
}
```

`disposeEffect`는 React effect에 바로 넘기기 위한 adapter다.

React의 `useEffect` callback은 cleanup 함수를 반환할 수 있다.

```ts
React.useEffect(() => {
  return cleanup
}, [])
```

`disposeEffect`는 이 모양에 맞춰 `this.clear`를 반환한다.

```txt
mount effect 실행
  disposeEffect 호출
  cleanup으로 clear 반환

unmount
  React가 cleanup 실행
  clear가 현재 timeout 취소
```

그래서 `useTimeout`은 unmount 시점의 정리를 다음 한 줄로 연결할 수 있다.

```ts
useOnMount(timeout.disposeEffect)
```

## useTimeout hook

```ts
export function useTimeout() {
  const timeout = useRefWithInit(Timeout.create).current
  useOnMount(timeout.disposeEffect)
  return timeout
}
```

`useTimeout`은 `Timeout` class를 React 컴포넌트 생명주기에 붙이는 hook이다.

이 hook에서 중요한 요소는 두 가지다.

- `useRefWithInit(Timeout.create)`
- `useOnMount(timeout.disposeEffect)`

## useRefWithInit으로 instance 고정

`useRefWithInit`은 첫 render에서만 초기화 함수를 실행하고, 이후 render에서는 같은 ref 값을 재사용한다.

```ts
const timeout = useRefWithInit(Timeout.create).current
```

이 줄의 의미는 다음과 같다.

```txt
첫 render
  Timeout.create() 실행
  Timeout instance 생성
  ref.current에 저장

다음 render
  Timeout.create() 다시 실행하지 않음
  기존 ref.current 반환
```

React 컴포넌트는 state 변경, props 변경, context 변경 때문에 여러 번 render될 수 있다. render마다 `new Timeout()`을 만들면 이전 render에서 예약한 timeout id를 새 instance가 알 수 없다.

```txt
render 1
  Timeout instance A 생성
  timeout 예약

render 2
  Timeout instance B 생성
  A가 들고 있던 timeout id를 잃음

unmount
  B만 cleanup
  A의 timeout은 남을 수 있음
```

`useRefWithInit`을 쓰면 이런 문제가 생기지 않는다.

```txt
render 1
  Timeout instance A 생성
  timeout 예약

render 2
  Timeout instance A 재사용

unmount
  A.clear 실행
  A가 들고 있는 timeout 취소
```

즉 `useRefWithInit`은 timeout id를 추적하는 객체의 identity를 컴포넌트 생명주기 동안 고정한다.

## useOnMount로 unmount cleanup 연결

```ts
useOnMount(timeout.disposeEffect)
```

`useOnMount`는 내부적으로 빈 dependency 배열을 가진 `React.useEffect`를 호출한다.

```ts
export function useOnMount(effect: React.EffectCallback) {
  React.useEffect(effect, EMPTY)
}
```

따라서 `timeout.disposeEffect`는 mount 시점에 한 번만 등록된다. 그리고 이 effect가 반환한 `timeout.clear`는 unmount 시점에 실행된다.

```txt
component mount
  disposeEffect 등록

component render 반복
  같은 Timeout instance 사용

component unmount
  clear 실행
  남은 timeout 취소
```

이 cleanup은 timeout callback 안에서 `setState`를 호출하는 경우 특히 중요하다. 컴포넌트가 사라진 뒤 callback이 실행되면 더 이상 의미 없는 state update가 발생할 수 있기 때문이다.

## AvatarFallback에서의 사용

`AvatarFallback`은 이미지 fallback이 너무 짧게 깜빡이는 것을 막기 위해 `delay` prop을 지원한다.

```ts
const [delayPassed, setDelayPassed] = React.useState(delay === undefined)
const timeout = useTimeout()
```

`delay`가 없으면 fallback은 바로 렌더링될 수 있다. 그래서 초기값이 `delay === undefined`다.

```txt
delay 없음
  delayPassed 초기값 true
  fallback 즉시 허용

delay 있음
  delayPassed 초기값 false
  timeout이 지난 뒤 true
```

effect는 `delay`에 따라 timeout을 예약하거나 즉시 통과 상태로 만든다.

```ts
React.useEffect(() => {
  if (delay === undefined) {
    setDelayPassed(true)
    return timeout.clear
  }

  setDelayPassed(false)
  timeout.start(delay, () => setDelayPassed(true))
  return timeout.clear
}, [delay, timeout])
```

`delay`가 있는 경우 흐름은 다음과 같다.

```txt
effect 실행
  delayPassed = false
  timeout.start(delay, callback)

delay ms 경과
  callback 실행
  delayPassed = true

render
  imageLoadingStatus가 loaded가 아니고 delayPassed가 true이면 fallback 렌더링
```

렌더링 조건은 다음 코드에 있다.

```ts
enabled: imageLoadingStatus !== 'loaded' && delayPassed
```

즉 fallback은 이미지가 아직 loaded 상태가 아니면서, delay 조건도 통과했을 때만 렌더링된다.

```txt
imageLoadingStatus = loading
delayPassed = false
  fallback 숨김

imageLoadingStatus = loading
delayPassed = true
  fallback 표시

imageLoadingStatus = loaded
delayPassed = true
  fallback 숨김
```

## delay 변경 시나리오

`delay` prop이 변경되면 effect cleanup과 `timeout.start`의 내부 `clear()`가 함께 동작한다.

```txt
delay = 1000
  timeout A 예약

delay = 200으로 변경
  이전 effect cleanup 실행
    timeout.clear()
    timeout A 취소

  새 effect 실행
    delayPassed = false
    timeout.start(200, callback)
      내부 clear 호출
      timeout B 예약
```

effect cleanup만으로도 이전 timeout은 취소된다. 그런데 `start` 안에서도 다시 `clear()`를 호출한다. 이 중복은 의도적으로 안전한 구조다.

`start` 자체가 "새 timeout 전에 이전 timeout을 지운다"는 불변식을 갖고 있기 때문에, 호출자가 effect cleanup을 깜빡해도 같은 instance 안에서는 이전 timeout이 남지 않는다. 동시에 effect cleanup은 React 생명주기 관점에서 unmount와 dependency 변경을 정리한다.

```txt
start의 clear
  Timeout instance 내부 불변식
  마지막 예약만 유효하게 유지

effect cleanup의 clear
  React 생명주기 cleanup
  dependency 변경 또는 unmount 시 남은 작업 제거
```

## unmount 시나리오

컴포넌트가 unmount될 때 아직 timeout이 남아 있으면 cleanup이 실행된다.

```txt
AvatarFallback mount
  timeout 예약

delay가 지나기 전 unmount
  effect cleanup 실행
    timeout.clear()

useOnMount cleanup 실행
  timeout.clear()
```

`AvatarFallback` 자체 effect도 `return timeout.clear`를 반환하고, `useTimeout`도 mount cleanup으로 `timeout.clear`를 등록한다. 같은 `clear`가 여러 번 호출될 수 있지만 `clear`는 idempotent하게 동작한다.

```txt
첫 clear
  currentId가 있으면 취소하고 null

두 번째 clear
  currentId가 null이므로 아무 일도 하지 않음
```

이런 구조라서 cleanup이 여러 경로에서 호출되어도 문제가 없다.

## 왜 class를 쓰는가

이 코드는 단순히 hook 안에서 ref와 함수를 만들 수도 있다. 예를 들면 `useRef`로 id를 저장하고 `start`, `clear` 함수를 `useCallback`으로 만들 수도 있다.

현재 구조는 timer 관리 로직을 `Timeout` class에 모으고, React 연결만 `useTimeout`이 맡는다.

```txt
Timeout class
  imperative timer 관리
  start, clear, disposeEffect 제공

useTimeout hook
  instance 생성 시점 제어
  unmount cleanup 연결
  instance 반환
```

이 분리는 `useAnimationFrame` 같은 utility와도 같은 설계 패턴을 공유한다.

```txt
imperative scheduler
  브라우저 API id를 저장하고 취소한다.

React hook
  instance를 ref에 고정한다.
  mount/unmount 생명주기에 cleanup을 연결한다.
```

React render 안에서 직접 imperative API를 다루기보다, 작은 관리 객체를 만들고 그 객체의 생명주기를 hook이 고정하는 방식이다.

## class instance 패턴의 설계 의도

`Timeout`과 `AnimationFrame`은 서로 다른 browser API를 감싸지만 구조가 거의 같다.

```ts
export class Timeout {
  currentId: TimeoutId | null = null

  start(delay: number, callback: () => void) {
    this.clear()
    this.currentId = setTimeout(() => {
      this.currentId = null
      callback()
    }, delay)
  }

  clear = () => {
    // ...
  }
}
```

```ts
export class AnimationFrame {
  currentId: AnimationFrameId | null = null

  request(callback: () => void) {
    this.cancel()
    this.currentId = requestFrame(() => {
      this.currentId = null
      callback()
    })
  }

  cancel = () => {
    // ...
  }
}
```

공통 구조는 다음과 같다.

```txt
class instance
  현재 예약된 작업 id를 field에 저장한다.
  새 작업을 예약하기 전에 이전 작업을 취소한다.
  예약된 작업이 실행되면 id를 null로 비운다.
  취소 함수를 arrow property로 제공한다.
  React effect cleanup에 연결할 disposeEffect를 제공한다.

hook
  useRefWithInit으로 instance를 한 번만 만든다.
  useOnMount로 unmount cleanup을 등록한다.
  호출자에게 instance를 반환한다.
```

이 패턴은 GoF 디자인 패턴 하나로 정확히 대응되기보다는 React에서 자주 쓰는 `imperative resource를 stable ref에 보관하고 effect cleanup으로 dispose하는 패턴`에 가깝다.

이 문서에서는 다음 이름들로 이해할 수 있다.

- resource controller
- imperative handle
- stable instance with explicit disposal
- latest-only scheduler wrapper
- RAII와 비슷한 lifecycle wrapper

정확한 이름보다 중요한 것은 역할이다.

```txt
React 바깥의 imperative resource
  setTimeout id
  requestAnimationFrame id
  cancel 함수

React 안의 lifecycle
  render 반복
  effect cleanup
  unmount

class instance
  두 세계 사이의 상태ful한 연결 객체
```

## 장점 1. render와 무관한 stable identity

React 컴포넌트는 state, props, context 변경으로 계속 다시 render될 수 있다. 하지만 timeout id나 animation frame id는 render 결과물이 아니라 외부 예약 작업의 식별자다.

이 id를 React state로 관리하면 id가 바뀔 때마다 불필요한 render가 생긴다. 반대로 함수 안의 지역 변수로만 두면 render 사이에서 값이 사라진다.

class instance를 `useRefWithInit`에 넣으면 두 문제를 피한다.

```txt
render 1
  Timeout instance A 생성
  currentId에 timeout id 저장

render 2
  Timeout instance A 재사용
  currentId 유지

unmount
  Timeout instance A의 clear 실행
```

`AnimationFrame`도 같은 방식으로 동작한다.

```txt
render 1
  AnimationFrame instance A 생성
  currentId에 frame id 저장

render 2
  AnimationFrame instance A 재사용
  currentId 유지

unmount
  AnimationFrame instance A의 cancel 실행
```

즉 class instance는 "렌더링에는 영향을 주지 않지만 컴포넌트 생명주기 동안 보존되어야 하는 mutable state"를 담는 장소다.

## 장점 2. latest-only 정책을 객체 안에 넣는다

`Timeout.start`와 `AnimationFrame.request`는 모두 새 작업을 예약하기 전에 이전 작업을 취소한다.

```ts
start(delay: number, callback: () => void) {
  this.clear()
  // 새 timeout 예약
}
```

```ts
request(callback: () => void) {
  this.cancel()
  // 새 frame 예약
}
```

이 구조는 "마지막으로 예약한 작업만 유효하다"는 정책을 호출자가 아니라 객체 안에 넣는다.

호출자가 매번 다음 규칙을 기억할 필요가 줄어든다.

```txt
새 timeout을 예약하기 전에 이전 timeout을 취소해야 한다.
새 animation frame을 예약하기 전에 이전 frame을 취소해야 한다.
```

객체가 이 규칙을 강제하면 사용처는 더 단순해진다.

```ts
timeout.start(delay, () => setDelayPassed(true))
```

이 호출 하나만으로 이전 timeout 취소와 새 timeout 예약이 함께 일어난다.

UI component에서는 이 정책이 자주 필요하다. tooltip open/close delay, avatar fallback delay, transition 후처리, layout 측정 예약처럼 빠르게 상태가 바뀌는 기능에서는 오래된 예약 작업이 뒤늦게 실행되면 화면 상태가 꼬일 수 있다.

```txt
상태 A 기준 callback 예약
상태 B로 변경
상태 A의 callback이 뒤늦게 실행
현재 UI와 맞지 않는 작업 수행
```

latest-only wrapper는 이런 종류의 오래된 예약 작업을 줄인다.

## 장점 3. cleanup을 여러 번 호출해도 안전하다

`clear`와 `cancel`은 모두 `currentId !== null`일 때만 실제 취소를 수행한다.

```txt
첫 cleanup
  currentId 있음
  native 작업 취소
  currentId = null

두 번째 cleanup
  currentId 없음
  아무 일도 하지 않음
```

이 성질을 idempotent cleanup이라고 볼 수 있다.

React에서는 cleanup이 여러 경로에서 호출될 수 있다.

```txt
dependency 변경
  이전 effect cleanup 실행

component unmount
  effect cleanup 실행

호출자 코드
  필요할 때 직접 clear/cancel 호출

useTimeout/useAnimationFrame
  hook 내부 mount cleanup에서도 clear/cancel 연결
```

cleanup이 idempotent하면 이런 호출들이 겹쳐도 안전하다. 사용처는 "이미 취소했는지"를 별도로 추적하지 않아도 된다.

## 장점 4. React와 imperative API의 경계를 분리한다

`Timeout` class는 React를 거의 모른다. `useTimeout` hook은 browser timer의 세부사항을 거의 모른다.

```txt
Timeout class
  currentId 저장
  setTimeout 호출
  clearTimeout 호출
  disposeEffect 제공

useTimeout hook
  Timeout instance 생성 시점 제어
  unmount cleanup 연결
  instance 반환
```

`AnimationFrame`도 같은 방식으로 나뉜다.

```txt
AnimationFrame class
  currentId 저장
  requestFrame 호출
  cancelFrame 호출
  disposeEffect 제공

useAnimationFrame hook
  AnimationFrame instance 생성 시점 제어
  unmount cleanup 연결
  instance 반환
```

이 분리 덕분에 browser API를 다루는 imperative 로직은 class에 모이고, React lifecycle에 묶는 로직은 hook에 모인다.

```txt
imperative resource 관리
  class가 담당

React lifecycle 연결
  hook이 담당
```

이 구조는 테스트나 학습 관점에서도 읽기 좋다. class를 보면 "외부 작업을 어떻게 예약하고 취소하는지"를 알 수 있고, hook을 보면 "그 작업이 컴포넌트 생명주기와 어떻게 연결되는지"를 알 수 있다.

## 장점 5. 함수 전달 시 this binding이 안전하다

`clear`, `cancel`, `disposeEffect`는 arrow property로 정의되어 있다.

```ts
clear = () => {
  // this.currentId 사용
}
```

```ts
disposeEffect = () => {
  return this.clear
}
```

이 방식은 함수를 값으로 넘겨도 `this`가 instance에 묶여 있게 만든다.

```ts
return timeout.clear
```

React effect cleanup은 함수를 값으로 반환한다. 이때 `clear`가 일반 method라면 method를 떼어내는 순간 `this` binding이 사라질 수 있다.

```ts
class Timeout {
  clear() {
    // this.currentId
  }
}

const cleanup = timeout.clear
cleanup()
// this가 의도한 Timeout instance가 아닐 수 있음
```

arrow property는 이 문제를 피한다.

## 왜 React state가 아닌가

`currentId`는 UI에 표시해야 하는 값이 아니다. 이 값은 외부 작업을 취소하기 위한 내부 식별자다.

React state로 관리하면 다음 문제가 생긴다.

```txt
timeout id 저장
  setState 필요
  render 발생

frame id 저장
  setState 필요
  render 발생
```

하지만 timeout id나 frame id가 바뀌었다고 UI를 다시 그릴 이유는 없다. 그래서 이 값은 React state보다 mutable instance field에 더 잘 맞는다.

```txt
React state
  UI 렌더링에 영향을 주는 값

class field/ref
  렌더링에는 영향이 없지만 생명주기 동안 보존해야 하는 값
```

`currentId`는 두 번째에 해당한다.

## 단점과 주의점

class instance는 mutable state를 가진다. 이 점은 의도된 장점이지만, 동시에 주의점이기도 하다.

첫째, field 변경이 render를 일으키지 않는다.

```txt
currentId 변경
  React는 알지 못함
  render 발생하지 않음
```

이 경우에는 문제가 아니다. `currentId`는 화면에 보여줄 값이 아니기 때문이다. 하지만 화면에 반영해야 하는 값이라면 class field가 아니라 React state나 외부 store를 써야 한다.

둘째, callback의 stale closure 문제를 자동으로 해결하지 않는다.

```txt
오래된 render에서 만든 callback
  timeout/frame에 예약됨
  나중에 실행됨
```

`Timeout`과 `AnimationFrame`은 예약과 취소를 관리할 뿐, callback이 최신 props/state를 바라보도록 바꿔주지는 않는다. 호출자는 effect dependency, stable callback, ref 등을 별도로 고려해야 한다.

셋째, 이 instance는 기본적으로 하나의 현재 작업만 관리한다.

```txt
Timeout instance 1개
  currentId 1개
  동시에 하나의 timeout만 의미 있게 관리

AnimationFrame instance 1개
  currentId 1개
  동시에 하나의 frame request만 의미 있게 관리
```

여러 작업을 동시에 관리해야 한다면 id map이나 여러 instance가 필요하다.

## 패턴을 한 문장으로 정리

`Timeout`과 `AnimationFrame`의 class instance 패턴은 "React render와 무관하게 유지되어야 하는 외부 예약 작업의 id를 stable instance에 저장하고, 최신 예약만 유효하게 만들며, unmount 시 명시적으로 dispose하는 구조"다.

```txt
stable instance
  render 사이에서 보존

mutable currentId
  외부 예약 작업 추적

latest-only request/start
  이전 작업 취소 후 새 작업 예약

idempotent cleanup
  여러 번 호출되어도 안전

hook lifecycle bridge
  React mount/unmount와 연결
```

## 설계상 보장하는 것

`useTimeout`이 보장하는 것은 다음과 같다.

- 컴포넌트 생명주기 동안 같은 `Timeout` instance를 재사용한다.
- `start`를 다시 호출하면 이전 timeout은 취소된다.
- timeout이 실행되면 `currentId`는 `null`로 초기화된다.
- `clear`는 여러 번 호출되어도 안전하다.
- unmount 시점에 남은 timeout은 cleanup된다.
- `clear`와 `disposeEffect`는 함수 값으로 넘겨도 `this` binding이 유지된다.

## 설계상 보장하지 않는 것

`useTimeout`은 다음 문제까지 해결하지는 않는다.

- 여러 timeout을 동시에 관리하지 않는다.
- timeout callback의 stale closure 문제를 자동으로 해결하지 않는다.
- `delay` 값의 유효성 검증을 하지 않는다.
- 서버 렌더링에서 timeout을 예약하지 않도록 특별한 분기를 두지 않는다.

특히 stale closure는 호출자가 effect dependency를 올바르게 관리해야 한다. `AvatarFallback`은 `delay`와 `timeout`을 dependency에 넣고, callback에서는 `setDelayPassed(true)`만 호출하므로 위험이 작다.

여러 timeout을 동시에 관리해야 한다면 이 class 하나로는 부족하다. id별 map을 두거나, 호출자 쪽에서 여러 `Timeout` instance를 분리해야 한다.

## 실행 흐름 요약

```txt
컴포넌트 render
  useTimeout 호출
  useRefWithInit으로 Timeout instance 1회 생성 또는 재사용

컴포넌트 mount
  useOnMount가 disposeEffect 등록
  unmount cleanup으로 clear 연결

호출자가 timeout.start(delay, callback) 실행
  기존 timeout 취소
  새 timeout 예약
  currentId 저장

delay 이후
  currentId를 null로 초기화
  callback 실행

dependency 변경 또는 호출자 cleanup
  timeout.clear 실행
  남은 timeout 취소

component unmount
  timeout.clear 실행
  남은 timeout 취소
```

## 핵심 학습 포인트

`useTimeout`의 핵심은 `setTimeout` 자체가 아니라 "React 바깥의 async 작업을 React 생명주기 안으로 끌어오는 방식"이다.

```txt
브라우저 timer
  React를 모른다.
  unmount를 모른다.
  props 변경을 모른다.

Timeout instance
  현재 예약된 작업을 기억한다.
  마지막 작업만 유효하게 만든다.

useTimeout
  instance를 render 사이에서 보존한다.
  unmount cleanup을 연결한다.
```

따라서 이 utility를 읽을 때는 `setTimeout` wrapper로만 보면 안 된다. 더 중요한 설계는 stable instance, idempotent cleanup, lifecycle cleanup, latest timeout only semantics의 조합이다.
