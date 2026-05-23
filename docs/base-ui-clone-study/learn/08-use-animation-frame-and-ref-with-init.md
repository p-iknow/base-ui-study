# 08. `useAnimationFrame`과 `useRefWithInit`가 frame 작업의 생명주기를 고정하는 방식

대상 파일:

- `packages/utils/src/useAnimationFrame.ts`
- `packages/utils/src/useRefWithInit.ts`
- `packages/utils/src/useOnMount.ts`
- `packages/utils/src/useTimeout.ts`

관련 원본:

- `/Users/youngchang/dev/references/base-ui/packages/utils/src/useAnimationFrame.ts`
- `/Users/youngchang/dev/references/base-ui/packages/utils/src/useRefWithInit.ts`

## 전체 역할

`useAnimationFrame`은 React 컴포넌트 안에서 `requestAnimationFrame`을 안전하게 사용하기 위한 utility다.

브라우저의 `requestAnimationFrame`은 한번 예약하면 컴포넌트 생명주기를 알지 못한다. 컴포넌트가 unmount된 뒤에도 callback이 실행될 수 있고, 같은 렌더 흐름에서 여러 번 예약되면 이전 callback을 정리하는 책임도 호출자가 직접 져야 한다.

이 파일은 그 책임을 두 층으로 나눈다.

```txt
전역 frame scheduler
  여러 callback을 하나의 native requestAnimationFrame 안에 모은다.
  id 기반 cancel을 제공한다.

AnimationFrame instance
  컴포넌트별로 현재 예약된 frame id 하나를 기억한다.
  새 request 전에 이전 request를 취소한다.
  unmount cleanup에서 현재 예약을 취소한다.

useAnimationFrame
  AnimationFrame instance를 React ref에 1회 생성한다.
  mount effect cleanup으로 instance.cancel을 연결한다.
```

`useRefWithInit`은 여기서 `AnimationFrame` instance가 렌더마다 새로 만들어지지 않도록 보장한다.

## 전역 scheduler 상태

`useAnimationFrame.ts`의 상단 상태는 module 단위 scheduler다.

```ts
const callbacks: Array<FrameRequestCallback | null> = []
let callbacksCount = 0
let isScheduled = false
let nextId = 1
let startId = 1
```

- `callbacks`: 다음 frame에 실행할 callback 목록이다.
- `callbacksCount`: 아직 취소되지 않은 callback 수다.
- `isScheduled`: native `requestAnimationFrame(tick)`이 이미 예약되어 있는지 나타낸다.
- `nextId`: 새 frame request에 부여할 id다.
- `startId`: 현재 `callbacks` 배열의 첫 요소가 대응하는 id다.

이 scheduler는 native `requestAnimationFrame`의 id를 그대로 쓰지 않는다. 내부에서 직접 증가하는 id를 만들고, 그 id를 배열 index로 다시 매핑한다.

## requestFrame

`requestFrame`은 callback을 내부 queue에 넣고 id를 반환한다.

```ts
function requestFrame(callback: FrameRequestCallback) {
  const id = nextId
  nextId += 1
  callbacks.push(callback)
  callbacksCount += 1

  if (!isScheduled) {
    requestAnimationFrame(tick)
    isScheduled = true
  }

  return id
}
```

중요한 점은 `isScheduled`다.

여러 곳에서 `requestFrame`을 호출해도 native `requestAnimationFrame`은 한 번만 예약된다. 그 한 번의 frame에서 내부 `callbacks` 목록을 순회한다.

```txt
requestFrame A
  callbacks = [A]
  native rAF 예약

requestFrame B
  callbacks = [A, B]
  이미 예약되어 있으므로 native rAF 추가 예약 없음

다음 frame
  tick에서 A, B 실행
```

즉 이 scheduler는 여러 callback을 하나의 browser frame으로 batch한다.

## cancelFrame

`cancelFrame`은 id를 받아 현재 queue 안의 위치를 계산한다.

```ts
function cancelFrame(id: AnimationFrameId) {
  const index = id - startId

  if (index >= 0 && index < callbacks.length && callbacks[index] !== null) {
    callbacks[index] = null
    callbacksCount -= 1
  }
}
```

예를 들어 현재 queue의 `startId`가 `10`이고 취소할 id가 `12`라면 취소 대상은 `callbacks[2]`다.

```txt
startId = 10

id 10 -> callbacks[0]
id 11 -> callbacks[1]
id 12 -> callbacks[2]
```

취소할 때 배열에서 요소를 제거하지 않고 `null`로 바꾸는 이유는 index 매핑을 유지하기 위해서다. 중간 요소를 제거하면 뒤 요소들의 index가 바뀌고, 이미 발급된 id로 위치를 계산할 수 없어진다.

```txt
callbacks = [A, B, C]
cancel B
callbacks = [A, null, C]
```

실행 시에는 optional chaining으로 취소된 callback을 건너뛴다.

```ts
callback?.(timestamp)
```

## tick

`tick`은 native rAF가 실제로 실행될 때 호출된다.

```ts
function tick(timestamp: number) {
  isScheduled = false

  const currentCallbacks = callbacks.splice(0)
  const currentCallbacksCount = callbacksCount
  callbacksCount = 0
  startId = nextId

  if (currentCallbacksCount > 0) {
    currentCallbacks.forEach((callback) => callback?.(timestamp))
  }
}
```

여기서 가장 중요한 부분은 실행 전에 현재 queue를 비운다는 점이다.

```ts
const currentCallbacks = callbacks.splice(0)
```

이렇게 하면 callback 실행 중에 다시 `requestFrame`을 호출해도 새 callback은 다음 frame queue에 들어간다.

```txt
frame 1 시작
  currentCallbacks = [A]
  callbacks = []

A 실행 중 requestFrame(B)
  callbacks = [B]
  native rAF 다시 예약

frame 1 종료

frame 2
  B 실행
```

만약 queue를 비우지 않고 같은 배열을 순회하면 callback 실행 중 추가된 작업이 같은 frame에서 같이 실행될 수 있다. 이 utility는 frame 단위를 명확히 분리한다.

`callbacksCount`를 따로 저장하는 이유는 모든 callback이 취소된 경우에도 빠르게 no-op 처리하기 위해서다. array에는 `null`이 남아 있을 수 있지만, 살아 있는 callback 수가 0이면 순회 자체를 피할 수 있다.

## AnimationFrame 클래스

전역 scheduler는 정적 함수로도 노출된다.

```ts
export class AnimationFrame {
  static create() {
    return new AnimationFrame()
  }

  static request(callback: FrameRequestCallback) {
    return requestFrame(callback)
  }

  static cancel(id: AnimationFrameId) {
    cancelFrame(id)
  }
}
```

정적 API는 특정 컴포넌트 instance와 관계없이 frame callback을 예약할 때 쓸 수 있다.

instance API는 컴포넌트 생명주기와 연결하기 위한 wrapper다.

```ts
currentId: AnimationFrameId | null = null
```

instance는 자신이 마지막으로 예약한 frame id 하나만 기억한다.

```ts
request(callback: () => void) {
  this.cancel()
  this.currentId = requestFrame(() => {
    this.currentId = null
    callback()
  })
}
```

`request`는 새 frame을 예약하기 전에 기존 예약을 취소한다. 따라서 같은 instance에서 여러 번 호출하면 마지막 요청만 살아남는다.

```txt
frame.request(A)
  currentId = 1

frame.request(B)
  id 1 취소
  currentId = 2

다음 frame
  A는 실행되지 않음
  B 실행
```

이 패턴은 "다음 frame에 한번만 실행하되, 그 전에 새 요청이 오면 최신 요청으로 교체"하는 용도에 맞다.

callback이 실제로 실행되면 `currentId`를 먼저 비운다.

```ts
this.currentId = null
callback()
```

그래야 callback 안에서 다시 `request` 또는 `cancel`이 호출되어도 이미 끝난 id를 잘못 취소하지 않는다.

## cleanup 연결

`cancel`은 현재 예약이 있을 때만 취소한다.

```ts
cancel = () => {
  if (this.currentId !== null) {
    cancelFrame(this.currentId)
    this.currentId = null
  }
}
```

`disposeEffect`는 React effect에 넘기기 위한 shape다.

```ts
disposeEffect = () => {
  return this.cancel
}
```

`useOnMount`는 빈 dependency array로 effect를 한번만 등록한다.

```ts
export function useOnMount(effect: React.EffectCallback) {
  React.useEffect(effect, EMPTY)
}
```

따라서 `useAnimationFrame`은 mount 시 cleanup을 등록하고, unmount 시 예약된 frame을 취소한다.

```ts
export function useAnimationFrame() {
  const frame = useRefWithInit(AnimationFrame.create).current
  useOnMount(frame.disposeEffect)
  return frame
}
```

이 hook을 쓰는 쪽은 `AnimationFrame` instance를 받아서 필요할 때 `request`를 호출한다.

```ts
const frame = useAnimationFrame()

frame.request(() => {
  // next animation frame
})
```

컴포넌트가 unmount되면 `frame.cancel`이 cleanup으로 실행된다.

## useRefWithInit

`useRefWithInit`은 lazy initializer를 받는 `useRef` wrapper다.

```ts
const UNINITIALIZED = {}
```

`UNINITIALIZED`는 아직 초기화되지 않았음을 나타내는 sentinel 값이다. `null`이나 `undefined`를 쓰지 않는 이유는 initializer의 정상 반환값이 `null` 또는 `undefined`일 수도 있기 때문이다.

타입은 두 가지 호출 방식을 지원한다.

```ts
export function useRefWithInit<T>(init: () => T): React.RefObject<T>
export function useRefWithInit<T, U>(
  init: (arg: U) => T,
  initArg: U,
): React.RefObject<T>
```

인자 없는 initializer:

```ts
const frameRef = useRefWithInit(AnimationFrame.create)
```

인자를 받는 initializer:

```ts
const valueRef = useRefWithInit(createValue, options)
```

구현은 ref의 현재 값이 sentinel일 때만 initializer를 실행한다.

```ts
export function useRefWithInit(
  init: (arg?: unknown) => unknown,
  initArg?: unknown,
) {
  const ref = React.useRef(UNINITIALIZED as never)

  if (ref.current === UNINITIALIZED) {
    ref.current = init(initArg) as never
  }

  return ref
}
```

이 utility는 다음 코드와 다르다.

```ts
const ref = React.useRef(init())
```

`useRef(init())`는 `useRef`가 첫 렌더의 값만 사용하더라도 `init()` 호출 자체는 매 렌더마다 평가된다.

`useRefWithInit(init)`은 `ref.current`가 sentinel일 때만 `init`을 호출하므로 렌더가 반복되어도 initializer가 다시 실행되지 않는다.

## useAnimationFrame에서 useRefWithInit이 필요한 이유

`useAnimationFrame`은 컴포넌트마다 `AnimationFrame` instance 하나를 유지해야 한다.

```ts
const frame = useRefWithInit(AnimationFrame.create).current
```

만약 렌더마다 새 `AnimationFrame` instance가 만들어지면 다음 문제가 생긴다.

```txt
render 1
  frame A 생성
  frame A가 currentId = 1 예약

render 2
  frame B 생성
  component code는 frame B를 사용

unmount cleanup
  frame B만 cancel
  frame A의 예약은 남을 수 있음
```

`useRefWithInit`을 쓰면 mount부터 unmount까지 같은 instance를 유지한다.

```txt
render 1
  AnimationFrame instance 생성

render 2
  같은 instance 재사용

unmount
  같은 instance의 currentId 취소
```

이 구조 때문에 request, cancel, cleanup이 모두 같은 `currentId`를 바라본다.

## useTimeout과 같은 패턴

`useTimeout`도 같은 구조를 쓴다.

```ts
export function useTimeout() {
  const timeout = useRefWithInit(Timeout.create).current
  useOnMount(timeout.disposeEffect)
  return timeout
}
```

`Timeout` instance는 `currentId`를 들고 있고, 새 timeout을 시작하기 전에 기존 timeout을 정리한다.

```txt
useRefWithInit
  instance를 컴포넌트 생명주기 동안 고정

useOnMount(instance.disposeEffect)
  unmount cleanup 연결

instance.currentId
  현재 예약된 async 작업 추적
```

`useAnimationFrame`과 `useTimeout`은 같은 설계 패턴을 공유한다. 차이는 scheduler다.

- `useTimeout`: native `setTimeout` id를 그대로 저장하고 `clearTimeout`으로 취소한다.
- `useAnimationFrame`: 여러 callback을 자체 scheduler에 모은 뒤 내부 id로 취소한다.

## Base UI 원본과의 차이

원본 Base UI의 `useAnimationFrame`은 scheduler를 class로 감싸고, test 환경에서 fake `requestAnimationFrame`이 바뀌는 경우를 감지하는 guard도 포함한다.

로컬 구현은 Avatar phase에서 필요한 핵심 흐름만 남겼다.

- frame callback queue
- id 기반 cancel
- instance별 마지막 request 교체
- unmount cleanup
- `useRefWithInit`을 통한 lazy instance 생성

아직 로컬 구현에는 원본의 test-environment guard나 scheduler class abstraction은 없다. 현재 학습 목적에서는 rAF batching과 React lifecycle cleanup을 이해하는 것이 핵심이다.

## 설계 의도

이 utility 조합의 설계 의도는 "브라우저 frame 예약은 imperative하지만, React 컴포넌트에서는 생명주기와 함께 닫혀야 한다"는 점이다.

```txt
imperative API
  requestAnimationFrame
  cancelAnimationFrame 또는 내부 cancel

React lifecycle
  render가 반복됨
  mount/unmount가 있음
  cleanup이 필요함

bridge
  useRefWithInit으로 stable instance 생성
  instance가 imperative state를 보관
  useOnMount로 cleanup 등록
```

따라서 `useAnimationFrame`은 단순히 `requestAnimationFrame`을 hook으로 감싼 것이 아니다. frame 예약을 batching하고, 같은 instance의 이전 예약을 교체하고, unmount 이후 callback 실행을 막는 lifecycle boundary 역할을 한다.
