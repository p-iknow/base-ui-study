# useRenderElement 설계 배경과 동작 흐름

대상 파일: `packages/react/src/internals/useRenderElement.tsx`

관련 파일:

- `packages/react/src/internals/types.ts`
- `packages/react/src/internals/getStateAttributesProps.ts`
- `packages/react/src/merge-props/mergeProps.ts`
- `packages/react/src/separator/Separator.tsx`
- `docs/base-ui-clone-study/learn/00-use-render-element-diagram.html`

## 왜 이 hook이 필요한가

`useRenderElement`는 Base UI 컴포넌트들이 최종 DOM element를 만드는 방식을 공통화하기 위해 만든 내부 hook이다.

Base UI 같은 headless UI 라이브러리는 일반적인 컴포넌트 라이브러리보다 렌더링 커스터마이징 요구가 크다. 사용자는 컴포넌트의 동작, 접근성, 상태 관리는 라이브러리에 맡기면서도 실제로 어떤 태그를 렌더링할지, 어떤 element 구조를 쓸지, 어떤 className과 style을 붙일지는 직접 제어하고 싶어 한다.

예를 들어 `Separator`는 기본적으로 `div`를 렌더링할 수 있다.

```tsx
<Separator />
```

하지만 어떤 사용자는 `hr`로 렌더링하고 싶을 수 있다.

```tsx
<Separator render={<hr />} />
```

또 어떤 사용자는 render function으로 완전히 직접 element를 만들고 싶을 수 있다.

```tsx
<Separator
  render={(props, state) => (
    <div {...props} data-kind={state.orientation} />
  )}
/>
```

이런 기능을 `Separator`, `Button`, `Input`, `Switch`, `Dialog.Trigger` 같은 모든 컴포넌트 안에 각각 구현하면 같은 코드가 계속 반복된다. 더 큰 문제는 반복 자체보다 렌더링 규칙이 컴포넌트마다 조금씩 달라질 수 있다는 점이다.

어떤 컴포넌트는 `ref`를 제대로 합치고, 어떤 컴포넌트는 누락할 수 있다. 어떤 컴포넌트는 `className`을 잘 병합하고, 어떤 컴포넌트는 사용자 className이 내부 className을 덮어쓸 수 있다. 어떤 컴포넌트는 `data-*` 상태 속성을 제공하고, 어떤 컴포넌트는 제공하지 않을 수 있다.

`useRenderElement`는 이런 문제를 줄이기 위해 만들어진 공통 render pipeline이다.

컴포넌트별 파일은 자기 컴포넌트의 의미에 집중한다.

- 이 컴포넌트의 기본 태그는 무엇인가
- 이 컴포넌트의 상태는 무엇인가
- 이 컴포넌트에 필요한 ARIA 속성은 무엇인가
- 이 컴포넌트가 사용자에게 넘겨야 하는 native props는 무엇인가

반대로 `useRenderElement`는 모든 컴포넌트에 공통으로 필요한 최종 렌더링 규칙을 담당한다.

- 기본 태그로 element를 만든다.
- `render` prop이 있으면 기본 태그를 대체한다.
- 내부 props와 사용자 props를 병합한다.
- `className`과 `style`을 state 기반 함수로 받을 수 있게 한다.
- 컴포넌트 state를 `data-*` attribute로 노출한다.
- forwarded ref와 render element ref를 합친다.
- render function 또는 render element 방식 모두를 지원한다.

## Separator에서의 사용 예

현재 로컬 구현에서 `useRenderElement`를 사용하는 대표 컴포넌트는 `Separator`다.

```tsx
export const Separator = React.forwardRef(function SeparatorComponent(
  componentProps: Separator.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const {
    className: _className,
    orientation = 'horizontal',
    render: _render,
    style: _style,
    ...elementProps
  } = componentProps
  const state: Separator.State = { orientation }

  return useRenderElement('div', componentProps, {
    state,
    ref: forwardedRef,
    props: [
      {
        role: 'separator',
        'aria-orientation': orientation,
      },
      elementProps,
    ],
  })
})
```

이 코드를 문장으로 바꾸면 다음과 같다.

`Separator`는 기본적으로 `div`로 렌더링된다. 현재 상태는 `{ orientation }`이다. 내부적으로 필요한 접근성 속성은 `role="separator"`와 `aria-orientation`이다. 사용자가 넘긴 나머지 element props도 최종 element에 들어가야 한다. forwarded ref도 최종 element에 연결되어야 한다. 이 모든 값을 `useRenderElement`에 넘기면 최종 element 생성은 공통 pipeline이 처리한다.

중요한 점은 `Separator`가 직접 `<div />`를 반환하지 않는다는 것이다.

```tsx
return <div role="separator" aria-orientation={orientation} />
```

이렇게 직접 반환하지 않고 `useRenderElement`에 위임한다. 그래야 `render`, `ref`, `className`, `style`, `data-*`, prop 병합 규칙이 다른 컴포넌트와 같은 방식으로 동작한다.

## API 구조

`useRenderElement`의 호출 형태는 다음과 같다.

```tsx
useRenderElement(element, componentProps, params)
```

### element

`element`는 기본으로 렌더링할 intrinsic tag name이다.

```tsx
useRenderElement('div', componentProps, params)
useRenderElement('button', componentProps, params)
useRenderElement('input', componentProps, params)
```

`render` prop이 없으면 이 태그를 사용해서 최종 element를 만든다.

```tsx
return React.createElement(element, outProps)
```

### componentProps

`componentProps`는 사용자가 public component에 넘긴 props다.

```tsx
<Separator
  className="demo-separator"
  style={{ width: 120 }}
  render={<hr />}
  aria-label="Section separator"
/>
```

이 값에는 `className`, `style`, `render` 같은 Base UI 공통 커스터마이징 props가 들어올 수 있다. 타입은 `BaseUIComponentProps`에 정의되어 있다.

```tsx
export type BaseUIComponentProps<
  ElementType extends React.ElementType,
  State,
> = Omit<
  React.ComponentPropsWithoutRef<ElementType>,
  'className' | 'style' | 'render'
> & {
  className?: string | ((state: State) => string | undefined)
  render?:
    | React.ReactElement
    | ComponentRenderFn<React.HTMLAttributes<HTMLElement>, State>
  style?: React.CSSProperties | ((state: State) => React.CSSProperties | undefined)
}
```

여기서 중요한 특징은 `className`과 `style`이 단순 값만 받는 것이 아니라 state를 인자로 받는 함수도 받을 수 있다는 점이다.

```tsx
<Separator
  orientation="vertical"
  className={(state) =>
    state.orientation === 'vertical' ? 'is-vertical' : 'is-horizontal'
  }
/>
```

이 방식은 headless UI에서 자주 쓰이는 패턴이다. 컴포넌트 내부 상태를 public styling API에 연결하되, 스타일링 방식 자체는 사용자에게 맡긴다.

### params

`params`는 컴포넌트 내부에서 계산한 렌더링 재료다.

```tsx
export type UseRenderElementParameters<
  State extends object,
  RenderedElementType extends Element,
  TagName extends IntrinsicTagName,
> = {
  props?:
    | RenderFunctionProps<TagName>
    | Array<RenderFunctionProps<TagName> | undefined>
  ref?: React.Ref<RenderedElementType>
  state?: State
  stateAttributesMapping?: StateAttributesMapping<State>
}
```

`props`는 최종 element에 들어갈 내부 props 또는 내부 props와 사용자 props의 배열이다.

`ref`는 최종 element에 연결할 forwarded ref다.

`state`는 컴포넌트의 현재 상태다. 이 값은 `data-*` attribute 생성, state 기반 `className`, state 기반 `style`, render function 호출에 사용된다.

`stateAttributesMapping`은 state를 기본 `data-*` 규칙과 다르게 변환하고 싶을 때 사용한다.

## componentProps와 params의 차이

`componentProps`와 `params`의 가장 큰 차이는 값의 출처다.

`componentProps`는 사용자가 public component에 직접 넘긴 원본 props다.

```tsx
<Separator
  orientation="vertical"
  className="demo-separator"
  render={<hr />}
  aria-label="Section separator"
/>
```

위 JSX에서 `Separator`가 받은 props 전체가 `componentProps`다.

개념적으로는 다음과 같다.

```tsx
const componentProps = {
  orientation: 'vertical',
  className: 'demo-separator',
  render: <hr />,
  'aria-label': 'Section separator',
}
```

반면 `params`는 컴포넌트 내부에서 계산해서 `useRenderElement`에 넘기는 렌더링 재료다.

```tsx
return useRenderElement('div', componentProps, {
  state,
  ref: forwardedRef,
  props: [
    {
      role: 'separator',
      'aria-orientation': orientation,
    },
    elementProps,
  ],
})
```

이 세 번째 인자가 `params`다.

개념적으로는 다음과 같다.

```tsx
const params = {
  state: { orientation: 'vertical' },
  ref: forwardedRef,
  props: [
    {
      role: 'separator',
      'aria-orientation': 'vertical',
    },
    elementProps,
  ],
}
```

즉 `componentProps`는 사용자 입력이고, `params`는 컴포넌트가 그 입력을 해석해서 만든 내부 렌더링 지시서다.

`componentProps`에는 `render`, `className`, `style`처럼 공통 render pipeline이 직접 해석해야 하는 public API가 들어 있다.

```tsx
const { className: classNameProp, render, style: styleProp } = componentProps
```

`useRenderElement`는 이 값들을 보고 다음을 결정한다.

- `render`가 있으면 기본 태그 대신 사용한다.
- `className`이 함수면 state를 넣어 실행한다.
- `style`이 함수면 state를 넣어 실행한다.

`params`에는 컴포넌트가 계산한 값이 들어 있다.

- 현재 상태인 `state`
- 최종 element에 붙일 내부 ARIA props
- 사용자 DOM props에서 공통 props를 제거한 `elementProps`
- forwarded ref
- state를 `data-*`로 바꾸는 mapping

`Separator` 기준으로 보면 흐름은 다음과 같다.

```tsx
const {
  className: _className,
  orientation = 'horizontal',
  render: _render,
  style: _style,
  ...elementProps
} = componentProps
```

여기서 `componentProps`는 원본이다. 그 원본에서 `orientation`을 읽어서 state를 만든다.

```tsx
const state = { orientation }
```

그리고 `className`, `render`, `style`, `orientation`을 제외한 나머지를 `elementProps`로 만든다.

```tsx
const elementProps = {
  'aria-label': 'Section separator',
  id: 'foo',
  onClick: handleClick,
}
```

그 다음 `useRenderElement`에 원본 `componentProps`와 가공된 `params`를 함께 넘긴다.

```tsx
useRenderElement('div', componentProps, {
  state,
  ref: forwardedRef,
  props: [
    {
      role: 'separator',
      'aria-orientation': orientation,
    },
    elementProps,
  ],
})
```

둘을 함께 넘기는 이유는 역할이 다르기 때문이다. `componentProps`는 사용자가 요청한 공통 커스터마이징 API를 해석하는 데 필요하고, `params`는 최종 element props를 조립하는 데 필요하다.

| 구분 | `componentProps` | `params` |
| --- | --- | --- |
| 누가 만드나 | 사용자가 JSX로 넘김 | 컴포넌트 내부에서 만듦 |
| 성격 | public props 원본 | 렌더링에 필요한 가공된 정보 |
| 예시 | `orientation`, `className`, `render`, `style`, `aria-label` | `state`, `ref`, `props`, `stateAttributesMapping` |
| `useRenderElement`에서의 역할 | 공통 public API를 해석하는 데 사용 | 최종 element props를 조립하는 데 사용 |
| 대표 사용 | `render`, `className`, `style` 처리 | `data-*`, ARIA, ref, elementProps 처리 |

한 줄로 정리하면 `componentProps`는 사용자가 컴포넌트에 준 원본 props이고, `params`는 컴포넌트가 그 props를 해석해서 만든 `useRenderElement`용 렌더링 지시서다.

## 전체 실행 흐름

### 1. componentProps에서 공통 props를 꺼낸다

```tsx
const { className: classNameProp, render, style: styleProp } = componentProps
const state = params.state ?? ({} as State)
```

`componentProps`에서 `className`, `render`, `style`을 꺼낸다. 이 세 가지는 Base UI의 공통 렌더링 API다.

`state`는 params에서 받는다. state가 없으면 빈 객체를 사용한다.

### 2. render element가 가진 ref를 읽고 forwarded ref와 합친다

```tsx
const renderElementRef = React.isValidElement(render)
  ? getReactElementRef(render)
  : undefined
const mergedRef = useMergedRefs(params.ref, renderElementRef)
```

사용자는 다음처럼 `Separator` 자체에 ref를 줄 수 있다.

```tsx
const separatorRef = React.useRef<HTMLDivElement>(null)

<Separator ref={separatorRef} />
```

동시에 `render`로 넘긴 element에도 ref가 있을 수 있다.

```tsx
const hrRef = React.useRef<HTMLHRElement>(null)

<Separator render={<hr ref={hrRef} />} />
```

이 경우 둘 중 하나만 살리면 안 된다. `Separator`에 전달된 forwarded ref도 동작해야 하고, render element에 있던 ref도 동작해야 한다.

그래서 `useMergedRefs`로 두 ref를 하나의 callback ref처럼 합친다. 최종적으로는 `outProps.ref = mergedRef`가 된다.

### 3. params.props를 하나의 props 객체로 합친다

```tsx
const resolvedProps = Array.isArray(params.props)
  ? mergeProps<TagName>(
      ...(params.props as Array<React.ComponentPropsWithoutRef<TagName> | undefined>),
    )
  : mergeProps<TagName>(
      params.props as React.ComponentPropsWithoutRef<TagName> | undefined,
    )
```

`params.props`는 단일 객체일 수도 있고 배열일 수도 있다.

`Separator`는 배열을 넘긴다.

```tsx
props: [
  {
    role: 'separator',
    'aria-orientation': orientation,
  },
  elementProps,
],
```

첫 번째 객체는 컴포넌트 내부에서 만든 접근성 props다. 두 번째 객체는 사용자가 넘긴 나머지 DOM props다.

`mergeProps`는 이 값들을 하나로 합친다. 단순 object spread가 아니라 `className`, `style`, event handler에 특별한 병합 규칙을 적용한다.

예를 들어 `className`은 둘 중 하나를 덮어쓰지 않고 문자열을 합친다. `style`은 객체를 병합한다. event handler는 기존 handler와 새 handler를 순서대로 호출하는 함수로 합친다.

`params.props`를 배열로 받을 수 있게 한 이유는 props의 출처를 분리해서 넘기고, `useRenderElement` 안에서 일관된 규칙으로 병합하기 위해서다.

`Separator`의 배열은 출처가 다른 두 props 묶음을 담고 있다.

```tsx
props: [
  internalAccessibilityProps,
  userElementProps,
]
```

첫 번째 묶음은 컴포넌트 내부가 보장해야 하는 props다.

```tsx
{
  role: 'separator',
  'aria-orientation': orientation,
}
```

두 번째 묶음은 사용자가 넘긴 DOM props다.

```tsx
{
  id: 'billing-separator',
  'aria-label': 'Billing section',
  onClick: handleClick,
}
```

배열로 받으면 각 props 묶음의 의미와 우선순위가 선명해진다.

```tsx
props: [
  internalProps,
  userProps,
]
```

이 구조는 내부 props를 먼저 깔고, 사용자 props를 그 뒤에 병합한다는 의도를 드러낸다. 배열 순서가 곧 병합 순서다.

물론 컴포넌트 안에서 미리 합쳐서 넘길 수도 있다.

```tsx
props: {
  role: 'separator',
  'aria-orientation': orientation,
  ...elementProps,
}
```

하지만 이 방식은 각 컴포넌트가 props 병합 규칙을 직접 신경 써야 한다. 단순 object spread는 `className`, `style`, event handler 병합에 적합하지 않다.

예를 들어 event handler는 단순 spread로 합치면 앞의 handler가 사라질 수 있다.

```tsx
const props = {
  onClick: internalOnClick,
  ...elementProps,
}
```

이 경우 `elementProps.onClick`이 있으면 `internalOnClick`은 덮어써진다.

반대로 순서를 바꾸면 사용자 handler가 덮어써질 수 있다.

```tsx
const props = {
  ...elementProps,
  onClick: internalOnClick,
}
```

그래서 Base UI는 이런 병합을 `mergeProps`에 맡긴다. `mergeProps`는 event handler를 둘 다 호출하는 함수로 합치고, `className`은 문자열로 합치며, `style`은 객체로 병합한다.

이 구조는 `Separator`보다 복잡한 컴포넌트에서 더 중요해진다. 예를 들어 `Button`은 내부 button props, 접근성 props, focus props, press props, 사용자 props처럼 여러 출처의 props를 가질 수 있다.

```tsx
props: [
  internalButtonProps,
  accessibilityProps,
  focusProps,
  pressProps,
  elementProps,
]
```

`Input`도 native input props, validation props, 사용자 props를 따로 만들 수 있다.

```tsx
props: [
  nativeInputProps,
  validationProps,
  elementProps,
]
```

각 묶음은 서로 다른 내부 hook이나 로직에서 만들어질 수 있다. 배열로 받으면 이 묶음들을 억지로 한 객체로 미리 합치지 않고 그대로 넘길 수 있다. 최종 병합 규칙은 `useRenderElement`와 `mergeProps`가 공통으로 책임진다.

정리하면 `params.props` 배열은 여러 출처에서 온 props 묶음을 순서 있게 모아두고, 공통 병합 규칙으로 안전하게 합치기 위한 구조다.

### 4. state를 data attribute로 변환하고 props에 합친다

```tsx
const outProps = {
  ...getStateAttributesProps(state, params.stateAttributesMapping),
  ...resolvedProps,
} as React.HTMLAttributes<HTMLElement> & React.RefAttributes<RenderedElementType>
```

`getStateAttributesProps`는 state를 DOM attribute로 바꾼다.

예를 들어 state가 다음과 같다면:

```tsx
const state = {
  orientation: 'horizontal',
}
```

기본 변환 결과는 다음과 같다.

```tsx
{
  'data-orientation': 'horizontal'
}
```

이 값은 최종 DOM에 들어간다.

```html
<div data-orientation="horizontal"></div>
```

이 설계가 중요한 이유는 CSS에서 컴포넌트 상태를 직접 선택할 수 있기 때문이다.

```css
.demo-separator[data-orientation='horizontal'] {
  width: 100%;
}

.demo-separator[data-orientation='vertical'] {
  height: 24px;
}
```

Headless UI는 스타일을 직접 강제하지 않는다. 대신 state를 DOM에 노출해서 사용자가 CSS로 스타일을 작성할 수 있게 한다.

### 5. className을 resolve하고 병합한다

```tsx
const className = resolveValue(classNameProp, state)
if (className !== undefined) {
  outProps.className = mergeClassNames(outProps.className, className)
}
```

`classNameProp`은 문자열일 수도 있고 함수일 수도 있다.

```tsx
className="demo-separator"
```

또는:

```tsx
className={(state) =>
  state.orientation === 'vertical' ? 'demo-separator vertical' : 'demo-separator'
}
```

`resolveValue`는 값이 함수면 `state`를 넣어 호출하고, 함수가 아니면 그대로 반환한다.

```tsx
function resolveValue<Value, State>(
  value: Value | ((state: State) => Value | undefined) | undefined,
  state: State,
) {
  if (typeof value === 'function') {
    return (value as (state: State) => Value | undefined)(state)
  }

  return value
}
```

그 결과를 기존 `outProps.className`과 병합한다.

### 6. style을 resolve하고 병합한다

```tsx
const style = resolveValue(styleProp, state)
if (style !== undefined) {
  outProps.style = {
    ...outProps.style,
    ...style,
  }
}
```

`style`도 `className`과 같은 방식으로 동작한다. 객체를 직접 받을 수도 있고, state를 받아 객체를 반환하는 함수일 수도 있다.

```tsx
<Separator
  style={(state) => ({
    opacity: state.orientation === 'vertical' ? 0.8 : 1,
  })}
/>
```

최종적으로 내부 style과 사용자 style이 합쳐진다.

### 7. ref를 최종 props에 넣는다

```tsx
outProps.ref = mergedRef
```

여기까지 오면 `outProps`는 최종 element에 들어갈 준비가 된 props 객체다.

여기에는 다음 성격의 값들이 함께 들어 있다.

- `data-*` state attributes
- ARIA attributes
- role
- 사용자 DOM props
- 병합된 className
- 병합된 style
- 병합된 ref
- 병합된 event handlers

### 8. render function이면 함수를 호출한다

```tsx
if (typeof render === 'function') {
  return render(outProps, state)
}
```

사용자가 render function을 넘긴 경우다.

```tsx
<Separator
  render={(props, state) => (
    <div {...props} data-debug-orientation={state.orientation} />
  )}
/>
```

이 방식은 가장 자유도가 높다. Base UI는 계산된 props와 state를 넘겨주고, 최종 JSX는 사용자가 만든다.

다만 이 render function은 React component처럼 사용하는 것이 아니라 일반 함수처럼 호출된다. 원본 Base UI에는 `render={Component}`처럼 대문자로 시작하는 컴포넌트를 직접 넘기는 실수를 경고하는 로직도 있다. 로컬 학습용 구현에서는 아직 그 경고 로직은 제외되어 있다.

### 9. render가 React element면 cloneElement로 props를 주입한다

```tsx
if (React.isValidElement(render)) {
  const clonedProps = mergeProps(
    outProps,
    render.props as React.HTMLAttributes<HTMLElement>,
  )
  clonedProps.ref = mergedRef
  return React.cloneElement(render, clonedProps)
}
```

사용자가 다음처럼 element를 넘긴 경우다.

```tsx
<Separator render={<hr className="rendered-separator" />} />
```

이때 hook은 `<hr />`를 그대로 반환하지 않는다. Base UI가 계산한 props를 `<hr />`에 합쳐서 clone한다.

최종적으로는 개념상 다음과 비슷한 element가 된다.

```tsx
<hr
  role="separator"
  aria-orientation="horizontal"
  data-orientation="horizontal"
  className="rendered-separator"
  ref={mergedRef}
/>
```

사용자가 element를 직접 제공했더라도 Base UI가 보장해야 하는 접근성 속성, state attribute, ref는 유지되어야 한다. 이것이 `cloneElement`를 사용하는 이유다.

### 10. render가 없으면 기본 태그를 만든다

```tsx
return React.createElement(element, outProps)
```

`render` prop이 없으면 처음 인자로 받은 기본 태그를 사용한다.

`Separator`의 경우:

```tsx
useRenderElement('div', componentProps, params)
```

따라서 기본 결과는 `div`다.

```html
<div role="separator" aria-orientation="horizontal" data-orientation="horizontal"></div>
```

## 세 가지 렌더링 모드

`useRenderElement`는 최종적으로 세 가지 렌더링 모드를 지원한다.

### 기본 태그 렌더링

사용자가 `render`를 넘기지 않은 경우다.

```tsx
<Separator />
```

결과는 기본 태그인 `div`다.

```tsx
React.createElement('div', outProps)
```

### React element override

사용자가 React element를 넘긴 경우다.

```tsx
<Separator render={<hr />} />
```

결과는 사용자가 넘긴 element를 clone한 값이다.

```tsx
React.cloneElement(render, clonedProps)
```

이 방식은 태그만 바꾸고 Base UI가 계산한 props와 ref는 유지하고 싶을 때 적합하다.

### render function override

사용자가 render function을 넘긴 경우다.

```tsx
<Separator
  render={(props, state) => (
    <div {...props}>
      {state.orientation}
    </div>
  )}
/>
```

결과는 사용자가 반환한 React element다.

```tsx
render(outProps, state)
```

이 방식은 element 구조를 더 강하게 제어하고 싶을 때 적합하다.

## 이 hook이 없을 때 생기는 문제

`useRenderElement`가 없다면 각 컴포넌트는 다음을 직접 처리해야 한다.

```tsx
function Separator(props, ref) {
  const {
    render,
    className,
    style,
    orientation = 'horizontal',
    ...other
  } = props

  const state = { orientation }
  const dataProps = getStateAttributesProps(state)
  const resolvedClassName =
    typeof className === 'function' ? className(state) : className
  const resolvedStyle =
    typeof style === 'function' ? style(state) : style

  const outProps = {
    ...dataProps,
    role: 'separator',
    'aria-orientation': orientation,
    ...other,
    className: resolvedClassName,
    style: resolvedStyle,
    ref,
  }

  if (typeof render === 'function') {
    return render(outProps, state)
  }

  if (React.isValidElement(render)) {
    return React.cloneElement(render, outProps)
  }

  return <div {...outProps} />
}
```

이 코드는 단순해 보이지만 같은 패턴이 모든 컴포넌트에 반복된다. 반복되는 동안 ref 병합, event 병합, className 병합, style 병합, data attribute 생성, render override 처리에서 미묘한 차이가 생긴다.

Base UI의 컴포넌트 수가 늘어날수록 이런 차이는 버그가 된다. `useRenderElement`는 이 규칙들을 한 곳으로 모아서 컴포넌트 구현의 일관성을 유지한다.

## Base UI 설계 관점에서의 의미

`useRenderElement`는 단순히 JSX 생성을 줄이는 helper가 아니다. Base UI의 컴포넌트 설계를 나누는 기준점이다.

컴포넌트 파일의 책임은 다음과 같다.

- public props를 해석한다.
- 기본값을 정한다.
- 현재 state를 만든다.
- 접근성 속성을 계산한다.
- 필요한 native props를 준비한다.

`useRenderElement`의 책임은 다음과 같다.

- state를 DOM attribute로 바꾼다.
- 사용자 props와 내부 props를 합친다.
- className과 style을 resolve한다.
- ref를 합친다.
- render override를 적용한다.
- 기본 태그 또는 사용자 지정 element를 최종적으로 반환한다.

이 분리가 있기 때문에 각 컴포넌트는 점점 복잡해져도 렌더링 커스터마이징 API를 일관되게 유지할 수 있다.

## 현재 로컬 구현과 원본 Base UI의 차이

이 저장소의 `useRenderElement`는 학습용으로 줄인 버전이다. Phase 1의 목표는 `Separator`를 통해 최소 render pipeline을 이해하는 것이었다.

원본 Base UI의 `useRenderElement`에는 더 많은 방어 로직과 기능이 있다.

- `enabled` 옵션으로 렌더링을 비활성화하고 `null`을 반환하는 기능
- 여러 ref 배열을 병합하는 `useMergedRefsN`
- render prop에 React component를 직접 넘기는 실수를 감지하는 개발 모드 경고
- `React.lazy` element 관련 workaround
- `button` 기본 `type="button"` 보정
- `img` 기본 `alt=""` 보정
- 더 넓은 타입 범위와 SSR 환경 고려
- frozen empty object를 피하기 위한 방어 로직

로컬 구현은 이런 기능을 아직 모두 포함하지 않는다. 지금 구현은 다음 핵심만 담고 있다.

- 기본 태그 렌더링
- React element override
- render function override
- state 기반 `data-*` attribute
- state 기반 `className`
- state 기반 `style`
- props 병합
- ref 병합

이 범위는 Phase 1의 `Separator` 학습 목적에 맞춘 것이다. 이후 `Button`, `Input`, popup 계열 컴포넌트로 갈수록 원본의 추가 기능들을 다시 볼 필요가 있다.

## 읽는 순서 추천

이 hook을 처음 읽을 때는 다음 순서가 이해하기 좋다.

1. `Separator.tsx`에서 `useRenderElement` 호출부를 먼저 본다.
2. `types.ts`에서 `BaseUIComponentProps`가 어떤 public API를 열어두는지 본다.
3. `getStateAttributesProps.ts`에서 state가 어떻게 `data-*`로 바뀌는지 본다.
4. `mergeProps.ts`에서 props 병합 규칙을 본다.
5. `useRenderElement.tsx`에서 최종 렌더링 분기 세 가지를 본다.
6. 원본 Base UI의 `useRenderElement.tsx`와 비교해서 학습용 구현에서 생략된 부분을 확인한다.

## 핵심 이해 포인트

`useRenderElement`를 “컴포넌트를 렌더링하는 hook”이라고만 보면 역할이 작아 보인다.

더 정확하게는 “Base UI 컴포넌트의 public customization API를 실제 DOM element로 변환하는 공통 pipeline”이다.

사용자는 public component에 props를 넘긴다.

```tsx
<Separator
  orientation="vertical"
  className={(state) => state.orientation}
  render={<hr />}
/>
```

컴포넌트는 state와 접근성 props를 계산한다.

```tsx
const state = { orientation }
```

`useRenderElement`는 이 모든 것을 합쳐 최종 element를 만든다.

```tsx
<hr
  role="separator"
  aria-orientation="vertical"
  data-orientation="vertical"
  className="vertical"
/>
```

이 흐름이 Base UI의 “headless but customizable”한 성격을 지탱한다.
