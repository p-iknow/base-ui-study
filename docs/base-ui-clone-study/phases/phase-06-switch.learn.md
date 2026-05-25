# Phase 06. Switch 완료

완료일: 2026-05-24

## 구현 요약

- 구현한 파일:
  - `packages/react/src/switch/index.ts`
  - `packages/react/src/switch/index.parts.ts`
  - `packages/react/src/switch/root/SwitchRoot.tsx`
  - `packages/react/src/switch/root/SwitchRootContext.ts`
  - `packages/react/src/switch/root/SwitchRootDataAttributes.ts`
  - `packages/react/src/switch/thumb/SwitchThumb.tsx`
  - `packages/react/src/switch/thumb/SwitchThumbDataAttributes.ts`
  - `packages/react/src/switch/stateAttributesMapping.ts`
  - `packages/react/src/switch/Switch.test.tsx`
  - `packages/utils/src/visuallyHidden.ts`
- playground:
  - `apps/playground/src/routes/phase-6.tsx`
  - `apps/playground/src/routes/index.tsx`
  - `apps/playground/src/routeTree.gen.ts`
  - `apps/playground/src/styles/global.css`
- 검증:
  - `pnpm test -- packages/react/src/switch/Switch.test.tsx`
  - `pnpm typecheck`
  - `pnpm build`

## 학습 기록

- 이번 phase의 학습 요소:
  - controlled/uncontrolled boolean state를 hidden checkbox input에 연결하는 방식.
  - 시각적 root는 non-native `<span role="switch">`로 두고, label activation과 form submission은 sibling input이 맡는 구조.
  - Root state를 context로 Thumb에 공유하고 동일한 checked/unchecked/disabled/readOnly/required data attribute를 노출하는 part 구성.
- Base UI의 설계 의도:
  - Switch의 사용 경험은 custom element처럼 제공하지만, form submission, reset, label click은 native input의 브라우저 동작을 최대한 재사용한다.
  - root interaction은 hidden input click/change 흐름으로 모아 `onCheckedChange`와 내부 state 갱신 순서를 한 곳에서 유지한다.
  - `value`가 없을 때 checkbox 기본 submit 값 `"on"`을 브라우저에 맡기고, unchecked submit 값은 별도 hidden input으로만 opt-in한다.
- 구현하면서 확인한 public surface:
  - `Switch.Root`, `Switch.Thumb` namespace export.
  - `checked`, `defaultChecked`, `disabled`, `readOnly`, `required`, `onCheckedChange`, `name`, `form`, `value`, `uncheckedValue`, `inputRef`, `nativeButton`.
  - root ARIA: `role="switch"`, `aria-checked`, `aria-readonly`, `aria-required`.
  - root/thumb data attributes: `data-checked`, `data-unchecked`, `data-disabled`, `data-readonly`, `data-required`.
- 원본에서 학습용으로 줄인 부분:
  - Field/Form/Fieldset provider, validation, dirty/touched/focused/validity state 연동은 제외했다.
  - label provider 기반 `aria-labelledby` 자동 계산은 제외하고, hidden input id와 native label activation만 구현했다.
  - ownerWindow/useBaseUiId/useValueChanged 등 넓은 internal stack 대신 `React.useId`, input ref, reset listener로 최소 구현했다.
- 다음 phase에서 다시 볼 부분:
  - Checkbox에서 Switch와 같은 hidden input 구조를 재사용할 수 있는 범위.
  - Field phase에서 validation data attributes와 field provider 통합.
  - form control disabled ancestor를 일반화할 internal helper 필요성.

## 세부 학습 메모

### 전체 구조

`Switch.Root`는 사용자가 상호작용하는 시각적 switch이고, sibling hidden checkbox input은 브라우저 form control 역할을 맡는다. 기본 DOM 의도는 다음과 같다.

```tsx
<Switch.Root>
  <Switch.Thumb />
</Switch.Root>
<input type="checkbox" hidden />
```

Root는 `<span role="switch">`로 렌더링되어 custom UI와 접근성 속성을 제공한다. 하지만 `<span>`은 native form control이 아니므로 `name`, `value`, `required`, `form`, submit, reset, label activation을 직접 처리할 수 없다. 그래서 실제 checkbox input을 옆에 두고, 보이는 Root의 interaction을 input의 click/change 흐름으로 연결한다.

### hidden checkbox input을 두는 이유

hidden input은 시각적으로는 숨겨져 있지만 DOM에는 남아 native checkbox로 동작한다. 이 구조 덕분에 다음 브라우저 기능을 재사용할 수 있다.

- form submit 시 checked 상태이면 `name=value`가 제출된다.
- `value`를 명시하지 않으면 checkbox 기본 submit 값인 `"on"`이 사용된다.
- unchecked 상태에서는 기본적으로 값이 제출되지 않는다.
- `uncheckedValue`가 있을 때만 별도 `<input type="hidden">`을 렌더링해 unchecked 값을 opt-in으로 제출한다.
- wrapping `<label>` 또는 `htmlFor` label activation이 실제 input을 통해 동작한다.
- form reset이 native input의 checked 값을 `defaultChecked`로 되돌린다.
- `required`, `disabled`, `form` 같은 native form 속성을 input에 전달할 수 있다.

input을 `display: none`으로 제거하지 않고 visually hidden style로 숨기는 이유는 form control로서 DOM과 브라우저 동작에 계속 참여해야 하기 때문이다. 사용자가 보는 것은 Root지만, form 관점에서 실제 control은 checkbox input이다.

### Root와 Thumb를 나누는 이유

Base UI는 headless component parts 패턴을 사용한다. `Switch.Root`는 상태와 동작을 가진 본체이고, `Switch.Thumb`는 Root state를 따라가는 시각적 part다.

- `Switch.Root` 담당:
  - `checked`/`defaultChecked` controlled, uncontrolled 상태 관리.
  - click, Enter, Space activation 처리.
  - `role="switch"`, `aria-checked`, `aria-readonly`, `aria-required` 제공.
  - hidden checkbox input 렌더링.
  - form submit/reset/label activation 연결.
  - `disabled`, `readOnly`, `required` 상태 계산.
  - Root state를 context로 자식 part에 제공.
- `Switch.Thumb` 담당:
  - Root context에서 state를 읽는다.
  - 기본 `<span>`을 렌더링한다.
  - Root와 같은 checked/unchecked/disabled/readOnly/required data attributes를 노출한다.
  - 움직이는 손잡이 같은 시각 표현을 CSS로 만들 수 있게 한다.

일반적인 switch 디자인은 track/thumb 구조다. track은 바깥 레일 또는 배경이고, thumb는 그 안에서 좌우로 움직이는 손잡이다. Base UI에는 별도 `Switch.Track` part가 없으며 보통 `Switch.Root`가 track 역할을 하고 `Switch.Thumb`가 thumb 역할을 한다.

```tsx
<Switch.Root className="switch-track">
  <Switch.Thumb className="switch-thumb" />
</Switch.Root>
```

`Switch.Thumb`는 필수 기능이 아니다. Thumb가 없어도 Root는 `role="switch"`, checked state, hidden input, form 동작을 모두 수행한다. 다만 Thumb가 없으면 일반적인 손잡이 UI가 없으므로 Root 하나만으로 track 색상이나 배경을 상태에 따라 스타일링해야 한다.

### state attribute 설계

Root와 Thumb는 같은 state를 공유하고 같은 상태성 data attribute를 노출한다.

- checked이면 `data-checked`.
- unchecked이면 `data-unchecked`.
- disabled이면 `data-disabled`.
- readOnly이면 `data-readonly`.
- required이면 `data-required`.

`checked`는 true/false 양쪽 모두 스타일링 hook이 필요하므로 custom mapping을 둔다. 일반 boolean state는 true일 때만 공통 `getStateAttributesProps`가 `data-*` attribute를 만든다.

이 구조 덕분에 사용자는 Root 기준으로도, Thumb 기준으로도 스타일링할 수 있다.

```css
.switch-track[data-checked] {
  background: green;
}

.switch-thumb[data-checked] {
  transform: translateX(20px);
}
```

### 변경 흐름

Root click은 직접 `setCheckedState`를 호출하지 않고 hidden input을 클릭한다. 그 후 input의 `onChange`에서 모든 상태 변경을 처리한다.

1. Root click 발생.
2. `readOnly`, `disabled`, disabled fieldset ancestor를 확인한다.
3. 활성화 가능하면 hidden input을 click한다.
4. checkbox input의 checked 값이 바뀐다.
5. input `onChange`에서 `nextChecked`를 읽는다.
6. `createBaseUIEventDetails(REASONS.none, nativeEvent)`로 cancel 가능한 details를 만든다.
7. `onCheckedChange?.(nextChecked, details)`를 호출한다.
8. `details.cancel()`이 호출되지 않았으면 uncontrolled state를 갱신한다.

이 순서를 유지하면 Root click, label click, keyboard activation이 모두 input change 경로로 모인다. 또한 `onCheckedChange`는 단순 알림이 아니라 uncontrolled 상태 변경을 취소할 수 있는 hook이 된다.

### form reset handler와 setTimeout

uncontrolled Switch는 React state가 source of truth이고, hidden checkbox는 native form reset의 영향을 받는다. form reset이 발생하면 브라우저는 input의 checked 값을 `defaultChecked`로 되돌리지만, React의 `checked` state는 자동으로 바뀌지 않는다.

따라서 reset 후 input의 실제 checked 값을 읽어 `setCheckedState`로 다시 동기화해야 한다.

```ts
function handleReset() {
  window.setTimeout(() => {
    if (inputRef.current) {
      setCheckedState(inputRef.current.checked)
    }
  })
}
```

`setTimeout`을 쓰는 이유는 reset 이벤트 handler가 실행되는 시점에는 브라우저의 reset default action이 아직 반영되기 전일 수 있기 때문이다. 다음 task에서 input 값을 읽으면 reset이 끝난 뒤의 checked 값을 얻을 수 있다.

이 handler는 uncontrolled일 때만 등록된다. controlled Switch는 `checked` prop이 외부 source of truth이므로 form reset이 내부 state를 직접 바꾸면 안 된다.

### nativeButton 옵션

기본 Root는 native button이 아니라 `<span role="switch">`다. 이 경우 `useButton({ native: false })`가 non-native element에 필요한 버튼 동작을 보정한다.

```tsx
<Switch.Root>
  <Switch.Thumb />
</Switch.Root>
```

기본 의도:

```html
<span role="switch" tabindex="0"></span>
<input type="checkbox" hidden />
```

`nativeButton={true}`는 사용자가 render override로 실제 `<button>`을 Root로 쓰고 싶을 때 사용하는 옵션이다.

```tsx
<Switch.Root nativeButton render={<button type="button" />}>
  <Switch.Thumb />
</Switch.Root>
```

이 경우 button은 이미 Enter/Space activation, focus, disabled 같은 native semantics를 가지므로 `useButton`이 native button 기준 props를 만든다.

`id` 처리도 달라진다.

- 기본 non-native Root에서는 사용자가 넘긴 `id`를 hidden input에 주고, Root에는 내부 generated id를 준다. `label htmlFor`가 실제 form control인 input을 활성화해야 하기 때문이다.
- `nativeButton={true}`에서는 `id`가 rendered button/root에 남고 hidden input id는 생략된다.

### Field와의 관계

원본 Base UI의 `Switch.Root`는 Field와 연동되도록 설계되어 있다. 원본의 `SwitchRootState`는 `FieldRootState`를 확장하고, `useFieldRootContext`, `useFormContext`, labelable provider, field control registration을 사용한다.

Field와 함께 쓰이면 Switch는 다음 정보를 Field에서 가져오거나 Field에 반영한다.

- field-level `name`.
- field-level `disabled`.
- label id 기반 `aria-labelledby`.
- validation props와 `aria-invalid`.
- `data-valid`, `data-invalid`.
- `data-touched`, `data-dirty`.
- `data-filled`, `data-focused`.
- change/blur/focus 시점의 validation commit.
- Form submit 시 invalid field focus와 error clearing.

따라서 원본의 완성된 사용 형태는 다음에 가깝다.

```tsx
<Field.Root name="airplane">
  <Field.Label>Airplane mode</Field.Label>
  <Switch.Root required>
    <Switch.Thumb />
  </Switch.Root>
  <Field.Error />
</Field.Root>
```

이번 학습 구현은 Field phase 전이므로 이 통합을 의도적으로 제외했다. 현재 구현은 standalone Switch의 핵심 구조, 즉 controlled/uncontrolled checked state, hidden input form integration, state attributes, Root/Thumb part 구성을 먼저 학습하기 위한 최소 버전이다. Field phase에서는 현재 `SwitchRootState`에 Field state를 합치고, validation props와 labelable provider를 연결하는 방향으로 확장해야 한다.

## 읽은 원본

- public component:
  - `/Users/youngchang/dev/references/base-ui/packages/react/src/switch/index.ts`
  - `/Users/youngchang/dev/references/base-ui/packages/react/src/switch/index.parts.ts`
  - `/Users/youngchang/dev/references/base-ui/packages/react/src/switch/root/SwitchRoot.tsx`
  - `/Users/youngchang/dev/references/base-ui/packages/react/src/switch/thumb/SwitchThumb.tsx`
- context/store:
  - `/Users/youngchang/dev/references/base-ui/packages/react/src/switch/root/SwitchRootContext.ts`
  - `/Users/youngchang/dev/references/base-ui/packages/react/src/switch/stateAttributesMapping.ts`
- internals:
  - local `useButton`, `useRenderElement`, `createBaseUIEventDetails`, `reasons`, `getStateAttributesProps`.
- utils:
  - local `useControlled`, `useMergedRefs`, `useStableCallback`.
  - upstream visually hidden style usage.
- tests:
  - `/Users/youngchang/dev/references/base-ui/packages/react/src/switch/root/SwitchRoot.test.tsx`
  - `/Users/youngchang/dev/references/base-ui/packages/react/src/switch/thumb/SwitchThumb.test.tsx`

## 남긴 TODO

- Field/Form phase에서 validation, labelable provider, validity state attributes를 원본 흐름에 맞춰 확장한다.
