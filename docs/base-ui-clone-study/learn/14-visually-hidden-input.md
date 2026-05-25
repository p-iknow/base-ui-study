# 14. `visuallyHidden`과 hidden form input

대상 파일:

- `packages/utils/src/visuallyHidden.ts`
- 관련 사용처: `packages/react/src/switch/root/SwitchRoot.tsx`

## 전체 역할

`visuallyHidden`은 요소를 화면에서는 보이지 않게 만들지만, DOM과 브라우저의 기본 동작에서는 살아 있게 두는 style object다.

```ts
export const visuallyHidden: React.CSSProperties = {
  border: 0,
  clip: 'rect(0 0 0 0)',
  height: 1,
  margin: -1,
  overflow: 'hidden',
  padding: 0,
  position: 'absolute',
  whiteSpace: 'nowrap',
  width: 1,
}
```

Switch에서는 이 style을 hidden checkbox input에 사용한다. 사용자가 보는 switch UI는 `Switch.Root`가 담당하지만, 실제 form control 역할은 sibling checkbox input이 담당하기 때문이다.

```tsx
<Switch.Root>
  <Switch.Thumb />
</Switch.Root>
<input type="checkbox" style={visuallyHiddenInput} />
```

이 input은 화면에 보이면 안 되지만, form submit, form reset, label activation, native checked state에는 계속 참여해야 한다.

## `display: none`을 쓰지 않는 이유

hidden form input을 만들 때 가장 단순한 방식은 `display: none`처럼 보일 수 있다. 하지만 Switch의 checkbox input에는 적합하지 않다.

```css
display: none;
```

이렇게 하면 요소가 레이아웃과 렌더링 tree에서 빠진다. 브라우저와 보조 기술이 해당 요소를 일반적인 상호작용 대상이나 form control로 다루지 않을 수 있다.

Switch hidden checkbox는 다음 동작에 계속 참여해야 한다.

- `name`/`value` 기반 form submit.
- checked checkbox의 기본 submit 값 `"on"`.
- unchecked checkbox는 submit에 포함되지 않는 native 규칙.
- wrapping label 또는 `htmlFor` label activation.
- form reset 시 `defaultChecked`로 돌아가는 native 동작.
- `required`, `disabled`, `form` 같은 form 속성.

따라서 "없애는" hidden이 아니라 "보이지 않게만 하는" hidden이 필요하다.

## 각 속성의 의도

### `position: 'absolute'`

요소를 일반 문서 흐름에서 뺀다. 이렇게 하지 않으면 1px 크기의 요소라도 주변 레이아웃에 영향을 줄 수 있다.

```ts
position: 'absolute'
```

Switch의 hidden input은 시각적 배치에 참여하면 안 된다. Root가 실제 화면 UI를 담당하고, input은 form behavior만 담당한다.

### `width: 1`, `height: 1`

요소를 완전히 0 크기로 만들지 않고 1px 크기로 남긴다.

```ts
width: 1,
height: 1,
```

이 값은 visually hidden 패턴에서 자주 쓰인다. 요소를 너무 완전히 없애지 않으면서도 화면에서는 사실상 보이지 않게 만들기 위한 절충이다.

0 크기 요소는 브라우저, 보조 기술, form control, focus 관련 동작에서 예외적인 대상으로 취급될 여지가 있다. 1px 영역을 남기면 요소가 DOM상 실체를 가진 control로 남는다.

### `margin: -1`

1px 크기로 남긴 요소가 레이아웃에 미세하게 영향을 주지 않도록 상쇄한다.

```ts
margin: -1
```

`width`와 `height`를 1px로 둔 이유는 요소를 완전히 없애지 않기 위해서다. 반대로 `margin: -1`은 그 1px이 화면 배치나 스크롤 영역에 영향을 덜 주게 하기 위한 값이다.

즉 두 값은 서로 반대 목적이 아니라 함께 동작한다.

```txt
width/height: 1
  요소의 실체는 남긴다.

margin: -1
  그 실체가 레이아웃에 영향을 주지 않게 줄인다.
```

### `clip: 'rect(0 0 0 0)'`

요소의 보이는 영역을 0 크기로 잘라낸다.

```ts
clip: 'rect(0 0 0 0)'
```

`width`와 `height`가 1px이어도 이 clip 값 때문에 실제 화면에 그려지는 영역은 없다. 이 속성은 오래된 visually hidden 패턴에서 널리 쓰이는 방식이다.

### `overflow: 'hidden'`

잘린 영역 밖의 내용이 보이지 않게 한다.

```ts
overflow: 'hidden'
```

`clip`과 함께 사용해, 요소 내부 내용이나 native control의 시각적 조각이 밖으로 새어 나오지 않게 한다.

### `border: 0`, `padding: 0`

기본 border나 padding이 남아 1px 영역 밖으로 시각적 흔적을 만들지 않게 한다.

```ts
border: 0,
padding: 0,
```

native input은 브라우저/OS 기본 스타일을 가질 수 있으므로, 숨김 요소에는 이런 기본 박스 스타일을 제거하는 편이 안전하다.

### `whiteSpace: 'nowrap'`

숨겨진 텍스트가 줄바꿈되면서 예상치 못한 크기나 스크롤 영역을 만들지 않게 한다.

```ts
whiteSpace: 'nowrap'
```

Switch의 checkbox input 자체에는 긴 텍스트가 들어가지 않지만, `visuallyHidden`은 범용 utility이므로 텍스트 숨김에도 사용할 수 있다.

## `visuallyHiddenInput`

input 전용 style은 기본 `visuallyHidden`에 `left: 0`과 `opacity: 0`을 추가한다.

```ts
export const visuallyHiddenInput: React.CSSProperties = {
  ...visuallyHidden,
  left: 0,
  opacity: 0,
}
```

이 style은 Switch에서 `name`이 있는 hidden checkbox에 사용된다.

```ts
style: name ? visuallyHiddenInput : visuallyHidden
```

`name`이 있다는 것은 input이 실제 form submission에 참여한다는 뜻이다. 따라서 Base UI 원본처럼 form control input에는 더 보수적인 숨김 style을 적용한다.

## input에 `left: 0`을 추가하는 이유

`visuallyHidden`은 `position: absolute`를 사용하지만 `top`이나 `left`를 지정하지 않는다. 이 경우 요소는 static position을 기준으로 absolute 위치가 정해진다.

대부분의 hidden text에는 문제가 되지 않는다. 하지만 hidden input은 label activation, focus, validation, form behavior에 관여하는 실제 control이다. 브라우저가 control의 위치를 참조하는 상황이 있을 수 있으므로, input 전용 style은 x 위치를 예측 가능하게 고정한다.

```ts
left: 0
```

이 값은 input을 화면에 보이게 하려는 목적이 아니다. 이미 clip, overflow, opacity가 숨김을 담당한다. `left: 0`은 absolute positioned input의 기준 위치를 안정화하는 역할이다.

## input에 `opacity: 0`을 추가하는 이유

`clip`과 `overflow`만으로도 요소는 보이지 않아야 한다. 하지만 native input은 브라우저와 OS가 고유한 스타일을 그리는 form control이다. 특정 렌더링 상황에서 시각적 흔적이 생기지 않도록 input 전용 style은 `opacity: 0`을 한 번 더 적용한다.

```ts
opacity: 0
```

`opacity: 0`은 요소를 DOM과 form 동작에서 제거하지 않는다. 이 점이 `display: none`이나 `visibility: hidden`과 다르다.

```txt
opacity: 0
  보이지 않지만 요소는 존재한다.
  form submit/reset/label activation에 계속 참여할 수 있다.

display: none
  렌더링 tree에서 빠진다.
  interaction과 form-control-like behavior에 문제가 생길 수 있다.
```

## 왜 모든 visually hidden 요소에 `opacity: 0`을 붙이지 않는가

`visuallyHidden`은 범용 utility이고, `visuallyHiddenInput`은 form input 전용 utility다.

일반 visually hidden 요소는 스크린리더용 텍스트나 접근성 보조 콘텐츠에 사용할 수 있다. 이 경우 널리 쓰이는 기본 visually hidden 패턴을 유지하는 편이 낫다.

반면 Switch의 hidden checkbox input은 화면 정보를 제공하는 텍스트가 아니라, native form behavior를 유지하기 위한 control이다. 그래서 input 전용으로 더 강한 숨김 방어막인 `opacity: 0`과 위치 안정화인 `left: 0`을 추가한다.

## Switch에서 `name` 여부로 style을 나누는 이유

SwitchRoot는 hidden checkbox input의 style을 다음처럼 정한다.

```ts
style: name ? visuallyHiddenInput : visuallyHidden
```

`name`이 있으면 이 input은 form submission의 실제 값으로 참여한다. 이 경우 브라우저의 form control 동작을 안정적으로 유지하는 것이 중요하므로 input 전용 style을 쓴다.

`name`이 없으면 form submission에는 참여하지 않는다. 그래도 checked state, label activation, reset sync 같은 동작에는 input이 필요하므로 일반 visually hidden style을 적용한다.

즉 둘 다 "보이지 않게 하지만 살아 있게" 하는 style이고, `visuallyHiddenInput`은 form submission에 참여하는 input에 더 보수적으로 적용되는 variant다.

## Switch 관점의 역할 정리

Switch에서 hidden input은 시각적 UI가 아니다. 시각적 UI는 Root와 Thumb가 담당한다.

```txt
Switch.Root
  사용자가 보고 누르는 track 역할
  role="switch", aria-checked, data-checked 제공

Switch.Thumb
  Root 안에서 움직이는 손잡이 역할
  Root state를 context로 받아 같은 data attribute 제공

hidden checkbox input
  form submit/reset/label activation/native checked behavior 담당
  화면에는 보이지 않아야 하지만 DOM에서는 살아 있어야 함
```

그래서 hidden input의 style은 단순한 미관 문제가 아니라, custom UI와 native form behavior를 동시에 만족시키기 위한 핵심 구현이다.
