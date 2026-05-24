# Phase 6. Switch

목표는 `Toggle`에서 배운 controlled/uncontrolled boolean state를 실제 form control에 연결해, 원본 Base UI Switch의 핵심 구조를 학습용 범위에서 완성하는 것이다.
원본의 `Switch.Root`는 시각적 root를 `<span role="switch">`로 렌더링하고, form 제출과 label activation은 옆에 붙는 hidden checkbox input으로 처리한다. `Switch.Thumb`은 root state를 context로 받아 같은 data attribute를 노출하는 순수 part다.

## 원본에서 확인할 내용

- `packages/react/src/switch/index.ts`
- `packages/react/src/switch/index.parts.ts`
- `packages/react/src/switch/root/SwitchRoot.tsx`
- `packages/react/src/switch/root/SwitchRootContext.ts`
- `packages/react/src/switch/root/SwitchRootDataAttributes.ts`
- `packages/react/src/switch/root/SwitchRoot.test.tsx`
- `packages/react/src/switch/thumb/SwitchThumb.tsx`
- `packages/react/src/switch/thumb/SwitchThumbDataAttributes.ts`
- `packages/react/src/switch/thumb/SwitchThumb.test.tsx`
- `packages/react/src/switch/stateAttributesMapping.ts`
- 직접 import되는 internals:
  - `useButton`
  - `useRenderElement`
  - `createBaseUIEventDetails`
  - `reasons`
  - `getStateAttributesProps`
- 직접 import되는 utils:
  - `useControlled`
  - `useMergedRefs`
  - `useStableCallback`

## public surface

- namespace export: `Switch`
- parts:
  - `Switch.Root`
  - `Switch.Thumb`
- `Switch.Root` props:
  - `checked?: boolean`
  - `defaultChecked?: boolean` (`false`)
  - `disabled?: boolean` (`false`)
  - `readOnly?: boolean` (`false`)
  - `required?: boolean` (`false`)
  - `onCheckedChange?: (checked: boolean, eventDetails: Switch.Root.ChangeEventDetails) => void`
  - `name?: string`
  - `form?: string`
  - `value?: string`
  - `uncheckedValue?: string`
  - `inputRef?: React.Ref<HTMLInputElement>`
  - `nativeButton?: boolean` (`false`)
  - `className`, `style`, `render`, non-native button props
- `Switch.Thumb` props:
  - `className`, `style`, `render`, span props
- `Switch.Root` 기본 렌더링은 `<span>`이고, 원본처럼 hidden checkbox input을 sibling으로 렌더링한다.
- `name`, `form`, `value`, `required`, `disabled`는 root가 아니라 hidden input에 전달한다.
- `value`가 없으면 hidden checkbox에 `value` attribute를 명시하지 않는다. checked form submit 값은 native checkbox 기본값인 `"on"`에 맡긴다.
- `uncheckedValue`가 있고 unchecked 상태이며 `name`이 있을 때는 별도의 hidden input으로 unchecked 값을 제출한다.
- `inputRef`는 hidden checkbox input을 가리킨다.
- `nativeButton={true}`는 render override가 실제 button일 때 쓰는 원본 옵션이다. 학습 구현에서는 phase 범위에 맞춰 기본 `nativeButton={false}` 경로를 우선 구현하고, native button id/label 차이는 테스트 가능하면 포함한다.

## 구현 순서

1. `packages/react/src/switch`에 `root`, `thumb`, `index.ts`, `index.parts.ts`, `stateAttributesMapping.ts` 구조를 만든다.
2. `SwitchRootDataAttributes`와 `SwitchThumbDataAttributes`를 추가한다.
   - 이 저장소 규칙에 맞춰 TypeScript enum이 아니라 `as const` object와 union type으로 정의한다.
   - 최소 attribute는 `data-checked`, `data-unchecked`, `data-disabled`, `data-readonly`, `data-required`다.
   - Field phase 전이므로 `data-valid`, `data-invalid`, `data-touched`, `data-dirty`, `data-filled`, `data-focused`는 보류하거나 타입에만 기록하지 않는다.
3. `stateAttributesMapping`에서 `checked`를 원본처럼 양방향 state attribute로 매핑한다.
   - checked면 `data-checked`.
   - unchecked면 `data-unchecked`.
   - boolean `disabled`, `readOnly`, `required`는 기존 `getStateAttributesProps` 기본 매핑 또는 명시 mapping으로 노출한다.
4. `SwitchRootContext`를 만들고 root state를 `Switch.Thumb`에 제공한다.
5. `Switch.Root`에 controlled/uncontrolled checked state를 구현한다.
   - `checked`가 `undefined`가 아니면 controlled로 본다.
   - uncontrolled 초기값은 `Boolean(defaultChecked)`다.
   - uncontrolled state 갱신은 `details.cancel()`이 호출되지 않았을 때만 수행한다.
6. `Switch.Root`는 `useButton({ disabled, native: nativeButton })`을 사용한다.
   - 기본 root는 원본처럼 non-native button semantics를 갖는 `<span role="switch">`다.
   - keyboard activation은 `useButton`의 Enter/Space 처리에 맡긴다.
   - disabled 상태에서는 `aria-disabled`, `data-disabled`, tabIndex 규칙이 `useButton`과 일치해야 한다.
7. root props를 원본 순서에 맞춰 구성한다.
   - `role="switch"`
   - `aria-checked={checked}`
   - `aria-readonly={readOnly || undefined}`
   - `aria-required={required || undefined}`
   - click 시 readOnly/disabled면 아무것도 바꾸지 않는다.
   - 활성화 가능하면 root click에서 hidden input click/change 흐름을 통해 checked state를 바꾼다.
8. hidden checkbox input을 root 옆에 렌더링한다.
   - `type="checkbox"`
   - `checked={checked}`
   - `disabled={disabled}`
   - `required={required}`
   - `name`, `form`, `value`, `id`
   - `tabIndex={-1}`
   - `aria-hidden={true}`
   - visually hidden style
   - `ref`는 내부 ref, `inputRef`, 필요한 sync ref를 `useMergedRefs`로 합친다.
9. hidden input `onChange`에서 원본의 상태 변경 순서를 따른다.
   - native event가 이미 defaultPrevented면 중단한다.
   - `readOnly`면 `event.preventDefault()` 후 중단한다.
   - `nextChecked = event.currentTarget.checked`를 계산한다.
   - `createBaseUIEventDetails(REASONS.none, event.nativeEvent)`로 details를 만든다.
   - `onCheckedChange?.(nextChecked, details)`를 호출한다.
   - `details.cancel()`이 호출되었으면 uncontrolled state를 갱신하지 않는다.
   - 취소되지 않았으면 `setCheckedState(nextChecked)`를 호출한다.
10. form reset 동기화를 구현한다.
    - uncontrolled Switch는 form reset 후 `defaultChecked`로 돌아가야 한다.
    - 구현은 hidden input이 속한 form의 `reset` 이벤트를 듣고, 다음 tick에 input의 `checked` 값을 root state로 반영하는 최소 helper로 시작한다.
    - controlled Switch는 reset 이벤트가 내부 state를 직접 바꾸지 않는다.
11. native label activation을 고려한다.
    - wrapping `<label>` 또는 `htmlFor` label click이 hidden input을 활성화하고 root state가 바뀌어야 한다.
    - 기본 non-native root에서는 `id`를 hidden input에 연결하고, root에는 내부 id를 쓰는 원본 구조를 따른다.
    - `nativeButton={true}`에서는 `id`가 rendered button/root에 남고 hidden input id는 생략되는 원본 차이를 확인한다.
12. `Switch.Thumb`은 `useSwitchRootContext()`로 state를 읽고 `useRenderElement('span', ...)`만 수행한다.
    - Thumb 자체 state는 Root state와 같다.
    - Root와 같은 checked/unchecked/disabled/readOnly/required data attributes를 노출한다.
13. root export에 `Switch`와 타입을 추가하고 `package.json` exports에 `./switch` entry를 추가한다.
14. playground에 `/phase-6` route를 추가한다.
    - uncontrolled submit 예제: unchecked일 때 제출값 없음, checked일 때 `"on"` 또는 custom `value`.
    - `uncheckedValue` 예제: off 값 제출.
    - controlled 예제: 외부 state와 `onCheckedChange`.
    - disabled fieldset/native disabled 예제: disabled 상태에서 interaction이 막히는지 보여준다.
15. focused tests를 추가한다.
    - click으로 `aria-checked`와 `data-checked`/`data-unchecked`가 토글된다.
    - controlled prop 변경이 root와 thumb state에 반영된다.
    - `onCheckedChange`는 다음 checked 값과 cancel 가능한 details를 받는다.
    - `details.cancel()`이면 uncontrolled state가 갱신되지 않는다.
    - disabled Switch는 callback과 state 변경이 실행되지 않는다.
    - readOnly Switch는 `aria-readonly`를 노출하고 state가 변경되지 않는다.
    - required Switch는 `aria-required`와 hidden input `required`를 갖는다.
    - `inputRef`는 hidden checkbox input을 가리킨다.
    - `name`/`value`는 root가 아니라 hidden input에만 붙는다.
    - form submit에 checked value가 포함되고 unchecked 기본 상태에서는 포함되지 않는다.
    - `uncheckedValue`가 unchecked submit에 포함된다.
    - form reset 후 uncontrolled state가 `defaultChecked`로 돌아간다.
    - wrapping label과 `htmlFor` label click이 Switch를 토글한다.
    - forwarded ref는 root span을 가리킨다.
    - `render` override와 function `className`/`style`이 기존 render pipeline과 맞는다.

## 필요한 utils

- `useControlled`
- `useMergedRefs`
- `useStableCallback`
- visually hidden style helper

## 필요한 internals

- `useButton`
- `useRenderElement`
- `getStateAttributesProps`
- `createBaseUIEventDetails`
- `reasons`
- hidden input reset sync helper

## 이번 phase에서 보류할 원본 범위

- `Field.Root`, `Form`, validation, `Fieldset.Root`, labelable provider와의 통합.
- `aria-labelledby`를 label provider 또는 sibling label에서 자동 계산하는 원본의 전체 흐름.
- `data-valid`, `data-invalid`, `data-touched`, `data-dirty`, `data-filled`, `data-focused` 같은 Field 연동 attributes.
- password manager, browser autofill, validation message 등 broad form infrastructure.
- 원본의 `useBaseUiId`, `ownerWindow`, `useIsoLayoutEffect`, `useValueChanged`까지 포함한 전체 internal stack. 단, form reset과 native input dispatch에 필요한 최소 기능은 구현한다.

## 완료 기준

- `Switch.Root`/`Switch.Thumb` namespace API와 export surface가 원본 구조와 맞는다.
- root는 기본적으로 `<span role="switch">`를 렌더링하고, hidden checkbox input을 sibling으로 렌더링한다.
- click, Enter, Space activation이 `useButton` 규칙을 통해 checked state를 바꾼다.
- controlled와 uncontrolled checked state가 분리되고, cancel 가능한 `onCheckedChange` details가 동작한다.
- `aria-checked`, `aria-readonly`, `aria-required`, `data-checked`, `data-unchecked`, `data-disabled`, `data-readonly`, `data-required`가 root와 thumb에 맞게 노출된다.
- form submit에 checked value가 포함되고, unchecked 기본 상태는 native checkbox처럼 값을 제출하지 않는다.
- `uncheckedValue`를 지정하면 unchecked 상태의 submit 값이 포함된다.
- form reset에서 uncontrolled Switch가 `defaultChecked`로 돌아간다.
- disabled/readOnly 상태와 disabled form ancestor 안에서 user interaction이 막힌다.
- native label click이 hidden input을 통해 Switch state를 토글한다.
- `inputRef`, forwarded ref, `render`, function `className`/`style`이 기존 Base UI primitive 패턴과 맞는다.
