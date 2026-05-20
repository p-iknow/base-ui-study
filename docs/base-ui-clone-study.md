# Base UI Clone Study

Reference package:

```txt
/Users/youngchang/dev/references/base-ui/packages/react
```

Study package in this repo:

```txt
packages/react
```

## Working Loop

1. Pick one component from the reference package.
2. Read only its public component file, nearby context files, and tests.
3. Recreate the smallest useful version in `packages/react/src`.
4. Add a playground example in `apps/playground`.
5. Run `pnpm typecheck` and `pnpm build`.

## Full Clone Order

The order is dependency-first, not alphabetical. Build shared internals once, then clone components from the smallest behavior surface to the most integrated popup and navigation systems.

### 0. Package Foundation

1. `types`: public component prop types and shared state typing.
2. `merge-props`: event handler, className, style, and prop merging semantics.
3. `use-render`: public render escape hatch.
4. `direction-provider`: text direction context used by keyboard and positioning behavior.
5. `csp-provider`: nonce context for style injection.
6. `unstable-use-media-query`: small standalone hook.

### 1. Primitive Elements

1. `separator`: static semantics and orientation attributes.
2. `button`: disabled semantics, refs, render overrides, `data-*` state.
3. `input`: native input wrapper patterns.
4. `avatar`: image loading state and fallback behavior.

### 2. State Primitives

1. `toggle`: controlled and uncontrolled boolean state on top of button behavior.
2. `switch`: pressable boolean control plus form semantics.
3. `checkbox`: checked, unchecked, indeterminate state and hidden input behavior.
4. `radio`: single item form control.
5. `radio-group`: grouped value state and keyboard movement.
6. `checkbox-group`: grouped checkbox value state.

### 3. Value Display Components

1. `progress`: range math, label/value context, indicator sizing.
2. `meter`: similar to progress with min/max/value text semantics.

### 4. Disclosure And Tabs

1. `collapsible`: open/closed state, mounted state, transition attributes.
2. `accordion`: multiple collapsibles coordinated through collection and context.
3. `tabs`: roving focus, activation mode, panels, and orientation.

### 5. Form Composition

1. `field`: field-level ids, validity state, labels, descriptions, errors.
2. `fieldset`: grouped field state.
3. `form`: submit/reset integration and field validation wiring.
4. `number-field`: spinbutton semantics, parsing, formatting, stepping.
5. `slider`: pointer/keyboard value movement and range math.
6. `otp-field`: multi-input coordination and paste behavior.

### 6. Popup Foundation

1. `floating-ui-react`: keep this as a compatibility wrapper around Floating UI behavior.
2. Popup utilities under `utils/popups`: popup store, trigger map, focus guards, scroll lock, dismiss logic.
3. Shared positioning utilities under `utils`: anchor positioning, arrows, viewport sizing, scroll edges.

### 7. Simple Popup Components

1. `popover`: trigger, portal, positioner, popup, arrow, backdrop basics.
2. `tooltip`: delayed open/close, hover/focus interactions, positioning.
3. `preview-card`: tooltip-like popup with richer trigger timing.
4. `dialog`: modal state, focus trap, dismiss, title/description aria wiring.
5. `alert-dialog`: dialog specialization with alert semantics.
6. `drawer`: dialog behavior plus swipe/edge placement patterns.

### 8. Menu Systems

1. `menu`: composite items, roving focus, nested popups, typeahead, checkbox/radio menu items.
2. `context-menu`: pointer context trigger and menu reuse.
3. `menubar`: horizontal root coordination over menu behavior.
4. `toolbar`: roving focus group for buttons/toggles.

### 9. Selection And Combobox

1. `select`: listbox selection, trigger/value display, popup positioning, collection, typeahead.
2. `combobox`: input plus popup collection, filtering, highlighted item, value synchronization.
3. `autocomplete`: combobox-like autocomplete API on top of input/list behavior.

### 10. Navigation And Feedback

1. `navigation-menu`: menu-like navigation, viewport coordination, pointer grace behavior.
2. `scroll-area`: custom scrollbars, viewport measurements, resize observers.
3. `toast`: provider, viewport, queue, timers, swipe dismiss, portal behavior.

## Practical Milestones

1. Milestone A: foundation plus `separator`, `button`, `input`, `avatar`.
2. Milestone B: all non-popup controls through `meter`.
3. Milestone C: disclosure, tabs, and form composition.
4. Milestone D: popup foundation plus popover, tooltip, dialog family.
5. Milestone E: menu, select, combobox, autocomplete.
6. Milestone F: navigation-menu, scroll-area, toast.

## Current Clone

Implemented:

```txt
packages/react/src/button/Button.tsx
packages/react/src/internals/useButton.ts
packages/react/src/internals/useRenderElement.tsx
```

The clone is intentionally smaller than Base UI. The goal is to preserve the learning shape before copying advanced internals.
