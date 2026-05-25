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
7. Checkbox and Checkbox Group
8. Radio Group
9. Progress
10. Meter
11. Direction Provider와 CSP Provider
12. Collapsible
13. Accordion
14. Tabs
15. Field
16. Fieldset과 Form
17. Number Field
18. Slider
19. OTP Field
20. Popover
21. Tooltip
22. Preview Card
23. Dialog
24. Alert Dialog와 Drawer
25. Menu
26. Context Menu
27. Menubar와 Toolbar
28. Select
29. Combobox와 Autocomplete
30. Navigation Menu
31. Scroll Area
32. Toast
