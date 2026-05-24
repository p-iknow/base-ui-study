# 12. `Composite`가 item 목록과 focus 이동을 관리하는 방식

대상 파일:

- `packages/react/src/internals/composite/CompositeContext.ts`
- `packages/react/src/internals/composite/CompositeRoot.tsx`
- `packages/react/src/internals/composite/CompositeItem.tsx`
- `packages/react/src/toggle-group/ToggleGroup.tsx`
- `packages/react/src/toggle/Toggle.tsx`

## 전체 역할

`Composite`는 여러 item이 하나의 묶음으로 동작할 때, item 사이의 키보드 focus 이동을 공통으로 처리하기 위한 내부 모듈이다.

현재 학습 구현에서는 Base UI의 완전한 composite primitive를 구현하지 않고, `ToggleGroup` 안의 `Toggle`에 필요한 최소 기능만 다룬다.

```txt
ToggleGroup
  CompositeRoot로 root DOM을 만든다.
  등록된 item 목록을 기준으로 키보드 focus 이동을 처리한다.

Toggle
  group 안에 있을 때 CompositeItem으로 렌더된다.
  실제 button DOM을 CompositeRoot에 등록한다.
```

`Composite`는 선택 상태를 관리하지 않는다. `pressed`, `value`, `multiple`, `onValueChange` 같은 상태는 `Toggle`과 `ToggleGroup`이 맡고, `Composite`는 focus 이동에만 집중한다.

```txt
선택 상태
  Toggle / ToggleGroup

DOM item 등록
  CompositeItem

키보드 focus 이동
  CompositeRoot
```

## 파일별 책임

### `CompositeContext`

`CompositeContext`는 root와 item 사이의 내부 통신 채널이다.

```ts
export interface CompositeContextValue {
  loopFocus: boolean
  orientation: Orientation
  registerItem: (element: HTMLElement) => () => void
}
```

핵심은 `registerItem`이다. 각 item은 자신의 실제 DOM element를 root에 등록하고, unmount될 때 제거할 cleanup 함수를 받는다.

```txt
CompositeItem mount
  실제 button DOM을 얻는다.
  context.registerItem(button)을 호출한다.

CompositeItem unmount
  registerItem이 반환한 cleanup을 실행한다.
  root의 item 목록에서 제거된다.
```

`loopFocus`와 `orientation`도 context 값에 포함되어 있지만, 현재 구현에서 item은 이 값을 직접 사용하지 않는다. 실제 focus 이동 계산은 root의 keydown handler가 담당한다.

### `CompositeRoot`

`CompositeRoot`는 composite 묶음의 root DOM을 렌더하고, 등록된 item 목록을 보관한다.

```ts
const itemsRef = React.useRef<HTMLElement[]>([])
```

`itemsRef`에는 현재 mount되어 있는 item의 실제 DOM element들이 들어간다. React state가 아니라 ref를 쓰는 이유는, item 목록은 focus 이동을 위한 명령형 데이터이고 item이 등록될 때마다 화면을 다시 렌더할 필요가 없기 때문이다.

```txt
state
  값이 바뀌면 re-render가 필요할 때 사용한다.

ref
  값을 보관하지만 re-render를 일으키지 않는다.
  DOM 노드, timer id, mutable registry 같은 값에 적합하다.
```

item 등록은 다음 흐름으로 처리된다.

```ts
const registerItem = React.useCallback((element: HTMLElement) => {
  itemsRef.current.push(element)
  itemsRef.current.sort((a, b) => {
    const position = a.compareDocumentPosition(b)
    return position & Node.DOCUMENT_POSITION_PRECEDING ? 1 : -1
  })

  return () => {
    itemsRef.current = itemsRef.current.filter((item) => item !== element)
  }
}, [])
```

등록 후 `compareDocumentPosition`으로 DOM 문서 순서대로 정렬한다. React 컴포넌트가 어떤 순서로 effect를 실행하든, 키보드 이동은 실제 화면에 배치된 DOM 순서를 기준으로 해야 하기 때문이다.

예를 들어 DOM이 다음 순서라면:

```tsx
<Toggle value="left">Left</Toggle>
<Toggle value="center">Center</Toggle>
<Toggle value="right">Right</Toggle>
```

root의 item 목록은 다음 순서가 되어야 한다.

```txt
[button Left, button Center, button Right]
```

이 순서를 알아야 `ArrowRight`를 눌렀을 때 `Left -> Center -> Right`로 focus를 보낼 수 있다.

### `CompositeItem`

`CompositeItem`은 개별 item DOM을 root에 등록하는 wrapper다.

```ts
const itemRef = React.useRef<ElementType | null>(null)
```

item은 자신의 실제 DOM을 알아야 root에 등록할 수 있다. 현재 `Toggle`은 `button`으로 렌더되므로, `CompositeItem`이 잡는 element는 실제 `HTMLButtonElement`다.

```ts
const mergedRef = useMergedRefs<ElementType>(
  (element) => {
    itemRef.current = element
  },
  refs?.[0],
  refs?.[1],
  refs?.[2],
)
```

여기서 내부 ref와 외부 ref를 합친다. `Toggle`에는 여러 ref가 동시에 필요하다.

```txt
CompositeItem 내부 ref
  root에 등록할 실제 DOM을 저장한다.

useButton의 buttonRef
  button 관련 내부 동작에 사용한다.

forwardedRef
  사용자가 <Toggle ref={...} />로 받은 ref다.
```

하나의 DOM element를 여러 곳에서 알아야 하므로 `useMergedRefs`로 ref들을 합친다.

mount 후에는 context에 등록한다.

```ts
React.useEffect(() => {
  const element = itemRef.current
  if (!context || !element) {
    return undefined
  }

  return context.registerItem(element)
}, [context])
```

이 effect가 실행되면 root는 item DOM을 알게 된다. effect가 cleanup될 때는 `registerItem`이 반환한 함수가 실행되어 item 목록에서 제거된다.

## item을 ref에 등록하는 이유

item을 ref에 등록하는 직접적인 이유는 키보드 이동 시 실제 DOM에 `.focus()`를 호출해야 하기 때문이다.

```ts
enabledItems[nextIndex]?.focus()
```

React 컴포넌트 인스턴스나 props만으로는 focus를 이동할 수 없다. 브라우저 focus는 실제 DOM element에 대한 명령형 작업이다.

따라서 root는 다음 정보가 필요하다.

```txt
현재 group 안에 어떤 item DOM들이 있는가?
그 item들은 실제 문서에서 어떤 순서인가?
각 item은 disabled 상태인가?
다음 focus 대상 DOM은 무엇인가?
```

이 질문에 답하려면 item의 실제 `HTMLElement` 목록이 필요하다.

예를 들어 사용자가 `Center` 버튼에 focus를 둔 상태에서 `ArrowRight`를 누르면:

```txt
등록된 item 목록
  [Left button, Center button, Right button]

현재 item
  Center button

다음 item
  Right button

실행
  Right button.focus()
```

이 흐름을 만들기 위해 각 item은 mount 시점에 자신의 DOM을 root에 등록한다.

## 현재 focus된 item은 어떻게 판단하는가

현재 구현은 “현재 focus된 item”을 별도 state나 ref로 저장하지 않는다. keydown 이벤트가 발생했을 때의 `event.target`을 현재 item으로 본다.

```ts
onKeyDown(event) {
  const target = event.target
  if (!(target instanceof HTMLElement)) {
    return
  }

  if (event.key === nextKey) {
    event.preventDefault()
    moveFocus(target, 'next')
  }
}
```

`Toggle` 버튼에 focus가 있는 상태에서 방향키를 누르면 keydown 이벤트가 root까지 bubble된다. 이때 `event.target`은 실제로 keydown이 발생한 button이다.

그 다음 `moveFocus`에서 등록된 item 목록 중 현재 target의 위치를 찾는다.

```ts
const currentIndex = enabledItems.indexOf(currentTarget)
let nextIndex = currentIndex
```

이 방식의 흐름은 다음과 같다.

```txt
1. 사용자가 Center button에 focus를 둔다.
2. ArrowRight를 누른다.
3. keydown 이벤트가 CompositeRoot까지 bubble된다.
4. CompositeRoot는 event.target을 읽는다.
5. event.target은 Center button이다.
6. enabledItems.indexOf(Center button)으로 현재 index를 찾는다.
7. 다음 index를 계산한다.
8. 다음 button에 focus()를 호출한다.
```

예시는 다음과 같다.

```tsx
<ToggleGroup defaultValue={['center']}>
  <Toggle value="left">Left</Toggle>
  <Toggle value="center">Center</Toggle>
  <Toggle value="right">Right</Toggle>
</ToggleGroup>
```

등록된 item 목록:

```txt
index 0: Left button
index 1: Center button
index 2: Right button
```

`Center button`에서 `ArrowRight`:

```txt
currentTarget = Center button
currentIndex = 1
direction = next
nextIndex = 2
focus target = Right button
```

`Center button`에서 `ArrowLeft`:

```txt
currentTarget = Center button
currentIndex = 1
direction = prev
nextIndex = 0
focus target = Left button
```

## orientation에 따른 방향키

`CompositeRoot`는 `orientation`에 따라 다음/이전 키를 다르게 정한다.

```ts
const nextKey = orientation === 'horizontal' ? 'ArrowRight' : 'ArrowDown'
const previousKey = orientation === 'horizontal' ? 'ArrowLeft' : 'ArrowUp'
```

수평 group:

```txt
ArrowRight
  다음 item으로 이동한다.

ArrowLeft
  이전 item으로 이동한다.
```

수직 group:

```txt
ArrowDown
  다음 item으로 이동한다.

ArrowUp
  이전 item으로 이동한다.
```

`Home`과 `End`는 orientation과 관계없이 동작한다.

```txt
Home
  첫 번째 enabled item으로 이동한다.

End
  마지막 enabled item으로 이동한다.
```

## loopFocus

`loopFocus`는 끝에서 다시 반대편으로 순환할지 결정한다. 기본값은 `true`다.

```ts
if (nextIndex < 0 || nextIndex >= enabledItems.length) {
  if (!loopFocus) {
    return
  }
  nextIndex = (nextIndex + enabledItems.length) % enabledItems.length
}
```

`loopFocus={true}`일 때:

```txt
[Left, Center, Right]

Right에서 ArrowRight
  Left로 이동한다.

Left에서 ArrowLeft
  Right로 이동한다.
```

`loopFocus={false}`일 때:

```txt
[Left, Center, Right]

Right에서 ArrowRight
  아무 이동도 하지 않는다.

Left에서 ArrowLeft
  아무 이동도 하지 않는다.
```

## disabled item 제외

focus 이동 대상은 enabled item만 사용한다.

```ts
const enabledItems = itemsRef.current.filter(
  (item) =>
    !item.hasAttribute('disabled') &&
    item.getAttribute('aria-disabled') !== 'true',
)
```

즉 다음 item은 focus 대상에서 제외된다.

```html
<button disabled>Disabled</button>
<button aria-disabled="true">Aria disabled</button>
```

예를 들어 목록이 다음과 같다면:

```txt
Left button
Center button disabled
Right button
```

enabled 목록은 다음과 같다.

```txt
[Left button, Right button]
```

`Left`에서 `ArrowRight`를 누르면 `Center`를 건너뛰고 `Right`로 이동한다.

## `ToggleGroup`과 연결되는 방식

`ToggleGroup`은 group root를 `CompositeRoot`로 만든다.

```tsx
<CompositeRoot
  className={componentProps.className}
  loopFocus={loopFocus}
  orientation={orientation}
  props={[{ role: 'group' }, elementProps]}
  refs={[forwardedRef]}
  render={componentProps.render}
  state={state}
  stateAttributesMapping={stateAttributesMapping}
  style={componentProps.style}
/>
```

여기서 `CompositeRoot`는 두 가지 일을 동시에 한다.

```txt
렌더 파이프라인
  useRenderElement로 root div를 만든다.
  role, 사용자 props, ref, render override, className, style, data attribute를 합친다.

composite 동작
  item 등록 context를 제공한다.
  root onKeyDown에서 focus 이동을 처리한다.
```

`Toggle`은 group context 안에 있을 때 `CompositeItem`으로 렌더된다.

```tsx
if (groupContext) {
  return (
    <CompositeItem
      className={componentProps.className}
      props={[buttonProps]}
      refs={refs}
      render={componentProps.render}
      state={state}
      style={componentProps.style}
      tag="button"
    />
  )
}
```

group 밖의 단독 `Toggle`은 composite item으로 등록되지 않는다.

```tsx
return useRenderElement('button', componentProps, {
  state,
  ref: refs,
  props: buttonProps,
})
```

즉 composite 동작은 group 안에서만 켜진다.

## 작은 동작 예시

다음 코드를 생각해 볼 수 있다.

```tsx
function Example() {
  return (
    <ToggleGroup defaultValue={['bold']} loopFocus orientation="horizontal">
      <Toggle value="bold">Bold</Toggle>
      <Toggle value="italic">Italic</Toggle>
      <Toggle value="underline">Underline</Toggle>
    </ToggleGroup>
  )
}
```

렌더 후 내부적으로는 다음과 비슷한 구조가 된다.

```txt
CompositeRoot div role="group"
  button Bold
  button Italic
  button Underline
```

각 `Toggle`의 `CompositeItem` effect가 실행되면 root의 registry는 다음처럼 채워진다.

```txt
itemsRef.current = [
  Bold button,
  Italic button,
  Underline button,
]
```

`Italic`에 focus가 있을 때 `ArrowRight`를 누르면:

```txt
event.target = Italic button
enabledItems = [Bold button, Italic button, Underline button]
currentIndex = 1
nextIndex = 2
enabledItems[2].focus()
```

결과적으로 `Underline` 버튼에 focus가 이동한다.

`Underline`에 focus가 있을 때 `ArrowRight`를 누르면:

```txt
event.target = Underline button
currentIndex = 2
nextIndex = 3
nextIndex가 범위를 벗어남
loopFocus가 true
nextIndex = 0
Bold button.focus()
```

결과적으로 `Bold` 버튼으로 순환한다.

## 현재 구현의 중요한 전제

현재 구현은 `event.target`이 등록된 item DOM 그 자체라는 전제를 둔다.

`Toggle`은 실제 focusable element가 `button`이고, `CompositeItem`도 그 `button`을 등록하므로 이 전제가 잘 맞는다.

하지만 item 내부에 별도의 focusable 자식이 들어가면 문제가 생길 수 있다.

```tsx
<CompositeItem tag="button">
  <span>Label</span>
</CompositeItem>
```

이 정도는 괜찮다. button에 focus가 있으므로 keydown target은 보통 button이다.

하지만 나중에 item 내부 구조가 다음처럼 복잡해지면:

```tsx
<div role="option">
  <input />
  <span>Label</span>
</div>
```

keydown의 `event.target`이 등록된 item인 `div`가 아니라 내부 `input`일 수 있다. 그러면 현재 로직의 이 줄이 실패할 수 있다.

```ts
const currentIndex = enabledItems.indexOf(currentTarget)
```

`currentTarget`이 `input`이고 `enabledItems`에는 `div`가 들어 있다면 `indexOf` 결과는 `-1`이다.

더 완성도 높은 composite 구현에서는 이런 경우를 위해 다음 처리가 추가될 수 있다.

```txt
현재 active item을 별도 state/ref로 관리한다.
document.activeElement를 기준으로 현재 item을 찾는다.
event.target.closest(...)로 등록 item 조상을 찾는다.
각 item에 metadata를 부여한다.
roving tabIndex를 관리한다.
```

현재 phase의 `ToggleGroup`에서는 button 자체가 item이므로 단순한 `event.target` 방식으로 충분하다.

## 현재 구현에서 의도적으로 빠진 것

현재 `Composite`는 학습용 최소 버전이다. 다음 기능은 아직 구현하지 않았다.

- roving `tabIndex`
- active item state
- item metadata
- RTL 방향 처리
- nested composite
- typeahead
- grid/listbox/menu 수준의 복합 navigation
- disabled지만 focus 가능한 item 정책
- 내부 focusable child를 가진 item 처리

이 기능들은 `Tabs`, `RadioGroup`, `Menu`, `Select`, `Combobox`처럼 더 복잡한 composite interaction이 필요한 phase에서 다시 확장할 수 있다.

## 핵심 정리

`Composite`의 핵심은 “React item 목록”이 아니라 “실제 DOM item 목록”을 root가 알고 있게 만드는 것이다.

```txt
CompositeItem
  실제 DOM을 ref로 잡는다.
  root에 등록한다.

CompositeRoot
  등록된 DOM 목록을 문서 순서로 정렬한다.
  keydown event.target을 현재 item으로 본다.
  다음 focus 대상 DOM을 계산한다.
  focus()를 호출한다.
```

item을 ref에 등록하는 이유는 DOM focus가 실제 element에 대한 명령형 작업이기 때문이다. 현재 focus된 item은 별도 상태로 추적하지 않고, keydown 이벤트가 발생한 `event.target`으로 판단한다.
