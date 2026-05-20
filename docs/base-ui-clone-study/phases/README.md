# Phases

각 phase는 하나의 컴포넌트 또는 강하게 결합된 컴포넌트 묶음을 완성하는 vertical slice다.

## 진행 규칙

1. phase의 목표 컴포넌트를 정한다.
2. 원본에서 public entry, 가까운 context/store, 직접 import하는 internal, 테스트만 읽는다.
3. 해당 컴포넌트를 완성하는 데 필요한 `packages/utils` 유틸만 먼저 구현한다.
4. 해당 컴포넌트에 필요한 `packages/react/src/internals`만 만든다.
5. public component, exports, playground 예제, 검증을 끝낸다.
6. 완료 기록은 같은 디렉터리의 `phase-XX-name.learn.md`에 별도 문서로 작성한다.
7. 다른 컴포넌트에서 쓰일 수 있는 범용화는 다음 phase에서 실제 재사용될 때만 확장한다.

## Phase 목록

0. Monorepo와 Vertical Slice 기초
1. Separator
2. Button
3. Input
4. Avatar
5. Toggle
6. Switch
7. Checkbox
8. Radio Group
9. Checkbox Group
10. Progress
11. Meter
12. Direction Provider와 CSP Provider
13. Collapsible
14. Accordion
15. Tabs
16. Field
17. Fieldset과 Form
18. Number Field
19. Slider
20. OTP Field
21. Popover
22. Tooltip
23. Preview Card
24. Dialog
25. Alert Dialog와 Drawer
26. Menu
27. Context Menu
28. Menubar와 Toolbar
29. Select
30. Combobox와 Autocomplete
31. Navigation Menu
32. Scroll Area
33. Toast
