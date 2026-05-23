# Phase 5. Toggle

목표는 `Button` 위에 controlled/uncontrolled boolean state를 얹어 첫 stateful control을 완성하고, 별도 phase가 없는 `ToggleGroup` 연동까지 함께 마무리한다.
원본의 `Toggle`은 `<button>`을 렌더링하는 two-state button이고, `ToggleGroup`은 여러 Toggle의 pressed 값을 배열 state로 공유하는 group primitive다.

## 원본에서 확인할 내용

- `packages/react/src/toggle/Toggle.tsx`
- `packages/react/src/toggle/ToggleDataAttributes.ts`
- `packages/react/src/toggle/Toggle.test.tsx`
- `packages/react/src/toggle-group/ToggleGroup.tsx`
- `packages/react/src/toggle-group/ToggleGroupContext.ts`
- `packages/react/src/toggle-group/ToggleGroupDataAttributes.ts`
- `packages/react/src/toggle-group/ToggleGroup.test.tsx`
- 직접 import되는 internals:
  - `useButton`
  - `useRenderElement`
  - `createBaseUIEventDetails`
  - `reasons`
  - `CompositeRoot`
  - `CompositeItem`
- 직접 import되는 utils:
  - `useControlled`
  - `useStableCallback`

## public surface

- component: `Toggle`
- props:
  - `pressed?: boolean`
  - `defaultPressed?: boolean` (`false`)
  - `disabled?: boolean` (`false`)
  - `onPressedChange?: (pressed: boolean, eventDetails: Toggle.ChangeEventDetails) => void`
  - `value?: string`
  - `nativeButton?: boolean`
  - `className`, `style`, `render`, native button props
- group 안의 Toggle은 `value`가 group value 배열에 포함되는지로 `pressed`를 계산한다.
- group 안의 Toggle은 자체 `pressed/defaultPressed`보다 group context를 우선한다.
- group 안의 Toggle은 item click 시 `ToggleGroup`의 `setGroupValue(value, nextPressed, details)`와 자신의 `onPressedChange(nextPressed, details)`를 같은 details로 호출한다.
- group 안의 Toggle은 group disabled와 item disabled를 합쳐 disabled 상태를 계산한다.
- 원본은 `form`과 `type`을 받아도 내부 button의 form validation/type 변경에 참여시키지 않는다. 이 phase에서도 `type` 기본값은 `useButton`의 `type="button"`을 유지하고, Toggle 자체의 form control 동작은 만들지 않는다.
- component: `ToggleGroup`
- props:
  - `value?: readonly string[]`
  - `defaultValue?: readonly string[]`
  - `onValueChange?: (value: string[], eventDetails: ToggleGroup.ChangeEventDetails) => void`
  - `disabled?: boolean` (`false`)
  - `orientation?: 'horizontal' | 'vertical'` (`'horizontal'`)
  - `loopFocus?: boolean` (`true`)
  - `multiple?: boolean` (`false`)
  - `className`, `style`, `render`, div props
- group root는 `role="group"`을 노출한다.
- `multiple={true}`일 때 `data-multiple`을 노출한다.
- `orientation`은 root의 `data-orientation`과 composite keyboard axis에 반영한다.

## 구현 순서

1. `packages/utils`에 `useControlled`를 추가한다.
   - controlled 여부는 첫 렌더의 `controlled !== undefined`로 고정한다.
   - uncontrolled일 때만 내부 state를 갱신한다.
   - dev warning은 학습 구현에서 최소화하거나 생략할 수 있지만, controlled/uncontrolled 판정 규칙은 원본과 맞춘다.
2. `packages/react/src/toggle-group`에 `ToggleGroup`, `ToggleGroupContext`, `ToggleGroupDataAttributes`, `index.ts`를 만든다.
3. `ToggleGroup`에 배열 기반 controlled/uncontrolled value state를 구현한다.
   - `value`가 있으면 controlled, 없으면 `defaultValue ?? []`를 uncontrolled 초기값으로 쓴다.
   - `multiple={false}`이면 새로 pressed된 값 하나만 남기고, 다시 누르면 빈 배열이 된다.
   - `multiple={true}`이면 값을 추가/제거한다.
   - `onValueChange(nextValue, details)` 호출 뒤 `details.cancel()`이면 내부 uncontrolled state 갱신을 멈춘다.
4. `ToggleGroupContext`로 `value`, `setGroupValue`, `disabled`, `orientation`, `isValueInitialized`를 제공한다.
5. `ToggleGroup` root에 `role="group"`, `data-orientation`, `data-multiple`, render/ref/className/style 지원을 연결한다.
6. `CompositeRoot`/`CompositeItem`의 학습용 최소 버전을 추가해 group 안 Toggle의 roving focus를 지원한다.
   - orientation에 맞는 Arrow key로 다음/이전 item에 focus를 이동한다.
   - `Home`/`End`를 지원한다.
   - `loopFocus` 기본값은 `true`다.
   - disabled item은 focus 이동 후보에서 제외한다.
   - RTL/DirectionProvider 통합은 Direction phase 전까지 생략하고 learn 문서에 남긴다.
7. `packages/react/src/toggle`에 `Toggle`, `ToggleDataAttributes`, `index.ts`를 만든다.
8. 독립 Toggle에는 `pressed`, `defaultPressed = false`, `disabled = false`, `onPressedChange` API를 구현한다.
9. group 안 Toggle에는 `value` 기반 pressed 계산과 group disabled 상속을 구현한다.
   - `value`가 `undefined`일 때는 원본처럼 group value와 일관성이 깨질 수 있으므로 dev warning을 남기거나, 최소한 learn 문서에 원본 경고 동작을 기록한다.
   - `value=""`처럼 falsy value는 안정적인 id 대체가 필요하므로 학습 구현에서는 명시 value를 그대로 쓰되 테스트로 동작을 고정한다.
10. `useButton`을 재사용해 native/custom button의 pointer, click, keyboard, disabled 규칙을 `Button`과 맞춘다.
11. `useRenderElement`를 통해 `render`, function `className`, function `style`, forwarded ref가 기존 primitive와 같은 방식으로 동작하게 한다.
12. 상태별 속성을 노출한다.
   - 항상 `aria-pressed={pressed}`를 노출한다.
   - pressed일 때 `data-pressed`를 노출한다.
   - disabled일 때 `data-disabled`를 노출하고, native button이면 `disabled`도 붙인다.
13. Toggle click activation에서 다음 순서를 지킨다.
   - 사용자 `onClick`이 `preventDefault()`를 호출하면 Toggle 내부 상태 변경이 실행되지 않는다.
   - disabled 상태에서는 `onPressedChange`와 상태 변경이 실행되지 않는다.
   - 활성화되면 `nextPressed = !pressed`를 계산하고 `onPressedChange(nextPressed, details)`를 호출한다.
   - group 안이면 같은 details로 `setGroupValue(value, nextPressed, details)`를 호출한다.
   - `details.cancel()`이 호출되면 내부 uncontrolled state 갱신을 멈춘다.
   - 취소되지 않은 경우 `setPressedState(nextPressed)`를 호출한다.
14. `createBaseUIEventDetails`와 `REASONS.none`의 최소 버전을 추가해 `onPressedChange`/`onValueChange` 두 번째 인자 표면을 원본과 맞춘다.
15. root export에 `Toggle`, `ToggleGroup`과 타입을 추가한다.
16. playground에 controlled Toggle, uncontrolled Toggle, disabled Toggle, custom render, single ToggleGroup, multiple ToggleGroup 예제를 추가한다.
17. focused tests를 추가한다.
    - controlled prop 변경이 `aria-pressed`에 반영된다.
    - uncontrolled click이 `aria-pressed`와 `data-pressed`를 토글한다.
    - `onPressedChange`는 user activation에서 다음 값을 받는다.
    - disabled Toggle은 `disabled`/`data-disabled`를 갖고 callback을 호출하지 않는다.
    - forwarded ref는 `HTMLButtonElement`를 가리킨다.
    - `render={<a />}` 또는 `nativeButton={false}`에서 role/tabIndex/keyboard activation이 `useButton` 규칙을 따른다.
    - ToggleGroup root는 `role="group"`을 가진다.
    - uncontrolled `defaultValue`가 item pressed state에 반영된다.
    - controlled `value` prop 변경이 item pressed state에 반영된다.
    - `multiple={false}`에서는 한 item만 pressed된다.
    - `multiple={true}`에서는 여러 item이 동시에 pressed된다.
    - group disabled가 child Toggle disabled state에 반영된다.
    - item disabled는 개별 Toggle에만 반영된다.
    - `onValueChange`는 다음 배열과 cancel 가능한 details를 받는다.
    - Arrow/Home/End keyboard focus 이동이 orientation과 `loopFocus`를 따른다.

## 필요한 utils

- `useControlled`
- `useStableCallback`

## 필요한 internals

- `useButton`
- `useRenderElement`
- `getStateAttributesProps`
- `createBaseUIEventDetails`
- `reasons`
- `CompositeRoot`
- `CompositeItem`

## 이번 phase에서 보류할 원본 범위

- `ToolbarRootContext`와의 통합.
- `DirectionProvider` 기반 RTL arrow key 반전.
- group 안에서 `value`가 없을 때 dev warning을 띄우는 `useIsoLayoutEffect`/`error` 흐름은 구현 여건에 따라 최소화할 수 있다. 단, learn 문서에는 원본 동작을 기록한다.

## 완료 기준

- controlled와 uncontrolled 동작이 분리된다.
- keyboard와 pointer activation이 `Button`과 같은 규칙을 따른다.
- `aria-pressed`, `data-pressed`, `data-disabled`, native `disabled`가 원본 Toggle 테스트 기대와 맞는다.
- `onPressedChange`는 user activation에서 다음 pressed 값과 cancel 가능한 details를 받는다.
- callback이 `details.cancel()`을 호출하면 uncontrolled 내부 state가 갱신되지 않는다.
- `render`, function `className`/`style`, forwarded ref가 기존 Base UI primitive 패턴과 맞는다.
- `ToggleGroup` controlled/uncontrolled value가 child Toggle의 pressed state와 동기화된다.
- `ToggleGroup`의 `multiple`, `disabled`, `orientation`, `loopFocus`, `onValueChange`가 원본 테스트의 핵심 기대와 맞는다.
