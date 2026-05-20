# 컴포넌트 namespace 타입 API

대상 패턴: React 컴포넌트 값과 같은 이름의 TypeScript namespace를 선언해서 `Component.Props`, `Component.State` 같은 타입 API를 제공하는 방식.

관련 예시:

- `packages/react/src/separator/Separator.tsx`
- `/Users/youngchang/dev/references/base-ui/packages/react/src/separator/Separator.tsx`

## 어떤 형태인가

Base UI는 컴포넌트 타입을 다음처럼 컴포넌트 이름 아래에 다시 노출한다.

```tsx
export const Component = React.forwardRef(function ComponentImpl(
  componentProps: Component.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  // ...
})

export interface ComponentProps {
  // ...
}

export interface ComponentState {
  // ...
}

export namespace Component {
  export type Props = ComponentProps
  export type State = ComponentState
}
```

여기서 `Component` 값은 런타임 React 컴포넌트이고, `namespace Component`는 타입 공간의 선언이다. TypeScript는 값 선언과 namespace 선언을 같은 이름으로 병합할 수 있어서, 사용자 입장에서는 컴포넌트와 관련 타입을 같은 경로로 접근할 수 있다.

```tsx
import { Component } from '@base-ui/react/component'

type Props = Component.Props
type State = Component.State
```

## 왜 편한가

가장 큰 장점은 타입의 소속이 명확해진다는 점이다.

컴포넌트 라이브러리에는 `Root`, `Trigger`, `Popup`, `Item`, `Label`, `Value`처럼 비슷한 이름의 부품이 많다. 모든 타입을 `RootProps`, `TriggerProps`, `ItemProps`처럼 평평하게 export하면 어느 컴포넌트의 타입인지 import 위치를 계속 봐야 한다. 반면 `DialogRoot.Props`, `SelectTrigger.Props`, `MenuItem.Props`처럼 컴포넌트 값 아래에 타입을 붙이면 타입 이름만 봐도 소속이 드러난다.

사용자 코드에서도 import가 줄어든다.

```tsx
import { Button } from '@base-ui/react/button'

function MyButton(props: Button.Props) {
  return <Button {...props} />
}
```

별도로 `ButtonProps`를 import하지 않아도 되고, 이미 사용 중인 컴포넌트 import를 그대로 타입 참조에도 쓸 수 있다. 특히 wrapper 컴포넌트, 스타일 확장 컴포넌트, story/test helper를 만들 때 편하다.

## 왜 라이브러리 API에 어울리는가

이 패턴은 타입을 공개 API의 일부로 안정적으로 제공하기 좋다.

Base UI의 컴포넌트는 단순한 DOM props만 받지 않는다. `render`, state 기반 `className`/`style`, data attribute state, ref 타입, controlled/uncontrolled 상태처럼 컴포넌트마다 타입 표면이 다르다. 이때 `Component.Props`를 제공하면 사용자는 실제 컴포넌트가 받는 public props를 가장 가까운 이름으로 가져올 수 있다.

또한 `State` 타입을 함께 노출하면 render function이나 state 기반 styling에서 쓰는 state 모양을 문서화하는 효과가 있다.

```tsx
type RenderState = Component.State
```

즉 namespace는 구현을 숨기기 위한 장치라기보다, 컴포넌트의 public type surface를 컴포넌트 이름 아래에 정리하는 장치다.

## `ComponentProps`만 export하는 방식과의 차이

다음 방식도 가능하다.

```tsx
import type { ComponentProps } from '@base-ui/react/component'
```

이 방식은 익숙하고 단순하지만, 컴포넌트 수가 많아질수록 export 이름이 길어지거나 충돌하기 쉽다. 반대로 namespace 방식은 `Props`, `State`처럼 짧은 이름을 쓸 수 있으면서도 `Component.Props`라는 경로가 충돌을 막아준다.

Base UI는 두 방식을 함께 제공한다. `ComponentProps` 같은 직접 export는 일반적인 타입 import에 유용하고, `Component.Props`는 컴포넌트 중심으로 타입을 찾는 사용자에게 편하다.

## 주의할 점

이 패턴은 런타임 객체에 실제 `Props`나 `State` 속성을 붙이는 것이 아니다. namespace 안의 `type`은 컴파일 후 사라진다. 따라서 다음 코드는 타입 위치에서만 의미가 있다.

```tsx
type Props = Component.Props
```

반대로 런타임에서 `Component.Props`를 읽을 수는 없다.

또 하나의 단점은 TypeScript의 namespace 문법이 앱 코드에서는 요즘 자주 쓰이지 않는다는 점이다. 그래서 일반 애플리케이션 코드보다 라이브러리 코드, 특히 공개 타입 API를 오래 유지해야 하는 컴포넌트 라이브러리에서 더 자연스럽다.

## 이 저장소에서 볼 포인트

로컬 구현에서는 아직 `Separator`에만 이 패턴이 들어와 있다. 원본 Base UI는 여러 컴포넌트에서 같은 방식으로 `Props`, `State`를 컴포넌트 namespace 아래에 제공한다.

이후 phase에서 컴포넌트가 늘어나면, 각 컴포넌트의 public props와 render state를 다음 두 경로로 모두 확인한다.

- 직접 export된 타입: `ButtonProps`, `SwitchRootProps` 같은 이름
- 컴포넌트 namespace 타입: `Button.Props`, `SwitchRoot.State` 같은 이름
