# Base UI Clone Study

Base UI를 그대로 복사하지 않고, `utils`와 `react` 패키지를 작은 vertical slice로 다시 만들면서 장기간 학습한다.

이 문서는 학습 허브이자 개요다.

## 문서 목록

1. [Workflow](./workflow.md)
   - 학습 원칙, 기본 작업 루프, 원본 읽기 규칙, 완료 기록 양식
2. [Phase 목록](./phases/README.md)
   - 전체 vertical slice 순서

## 빠른 시작

처음 시작할 때는 아래 순서로 읽는다.

1. 이 문서의 개요와 패키지 역할
2. [Workflow](./workflow.md)
3. [Phase 0. Monorepo와 패키지 기초](./phases/phase-00-monorepo-foundation.md)
4. [Phase 1. Separator](./phases/phase-01-separator.md)

첫 구현 목표는 `utils`의 ref/id/controlled state 흐름을 확인한 뒤 `Button`과 `Separator`를 다시 세우는 것이다.

## 참고 원본

```txt
/Users/youngchang/dev/references/base-ui/packages/utils
/Users/youngchang/dev/references/base-ui/packages/react
```

## 구현 대상 패키지

```txt
packages/utils
packages/react
```

## 패키지 역할

### `packages/utils`

React 컴포넌트에 종속되지 않는 작은 도구와 React hook을 둔다.

- ref, id, controlled state, stable callback 같은 기초 hook
- event listener, cleanup, timeout, interval, animation frame 같은 lifecycle 도구
- DOM owner, disabled element, scroll lock, mouse bounds 같은 브라우저 도구
- store, selector, shallow compare 같은 shared state 도구
- test helper와 error/warn formatting

### `packages/react`

Base UI의 public component API와 accessibility behavior를 학습용으로 구현한다.

- render prop, prop merging, state attributes, polymorphic element behavior
- form control, disclosure, tabs, popup, menu, select, combobox, navigation component
- `packages/utils`에 있는 기초 도구를 조합해서 public surface를 만든다.

## 목표

이 클론은 의도적으로 Base UI보다 작게 유지한다. 목표는 advanced internals를 그대로 복사하기 전에 학습 흐름과 설계 이유를 보존하는 것이다.

## Phase별 문서

1. [Phase 0. Monorepo와 패키지 기초](./phases/phase-00-monorepo-foundation.md)
2. [Phase 1. Separator](./phases/phase-01-separator.md)
3. [Phase 2. Button](./phases/phase-02-button.md)
4. [Phase 3. Input](./phases/phase-03-input.md)
5. [Phase 4. Avatar](./phases/phase-04-avatar.md)
6. [Phase 5. Toggle](./phases/phase-05-toggle.md)
7. [Phase 6. Switch](./phases/phase-06-switch.md)
8. [Phase 7. Checkbox](./phases/phase-07-checkbox.md)
9. [Phase 8. Radio Group](./phases/phase-08-radio-group.md)
10. [Phase 9. Checkbox Group](./phases/phase-09-checkbox-group.md)
11. [Phase 10. Progress](./phases/phase-10-progress.md)
12. [Phase 11. Meter](./phases/phase-11-meter.md)
13. [Phase 12. Direction Provider와 CSP Provider](./phases/phase-12-providers.md)
14. [Phase 13. Collapsible](./phases/phase-13-collapsible.md)
15. [Phase 14. Accordion](./phases/phase-14-accordion.md)
16. [Phase 15. Tabs](./phases/phase-15-tabs.md)
17. [Phase 16. Field](./phases/phase-16-field.md)
18. [Phase 17. Fieldset과 Form](./phases/phase-17-fieldset-form.md)
19. [Phase 18. Number Field](./phases/phase-18-number-field.md)
20. [Phase 19. Slider](./phases/phase-19-slider.md)
21. [Phase 20. OTP Field](./phases/phase-20-otp-field.md)
22. [Phase 21. Popover](./phases/phase-21-popover.md)
23. [Phase 22. Tooltip](./phases/phase-22-tooltip.md)
24. [Phase 23. Preview Card](./phases/phase-23-preview-card.md)
25. [Phase 24. Dialog](./phases/phase-24-dialog.md)
26. [Phase 25. Alert Dialog와 Drawer](./phases/phase-25-alert-dialog-drawer.md)
27. [Phase 26. Menu](./phases/phase-26-menu.md)
28. [Phase 27. Context Menu](./phases/phase-27-context-menu.md)
29. [Phase 28. Menubar와 Toolbar](./phases/phase-28-menubar-toolbar.md)
30. [Phase 29. Select](./phases/phase-29-select.md)
31. [Phase 30. Combobox와 Autocomplete](./phases/phase-30-combobox-autocomplete.md)
32. [Phase 31. Navigation Menu](./phases/phase-31-navigation-menu.md)
33. [Phase 32. Scroll Area](./phases/phase-32-scroll-area.md)
34. [Phase 33. Toast](./phases/phase-33-toast.md)
