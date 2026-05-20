---
name: base-ui-clone-study
description: Follow the Base UI clone study workflow in this repository. Use when implementing, reviewing, planning, or documenting Base UI clone phases under docs/base-ui-clone-study, packages/utils, packages/react, or apps/playground; when the user asks to work on the next phase, clone a Base UI component, consult the local Base UI reference, or write a phase learn document.
---

# Base UI Clone Study

Use this skill to rebuild Base UI as small learning-oriented vertical slices. Preserve the study goal: clone enough of Base UI to naturally learn its public API, accessibility behavior, state attributes, ref/render pipeline, and internal design reasons without copying the full upstream implementation early.

## Core Rules

1. Learn one concept at a time.
2. Read only the upstream files needed for the current phase and nearby tests.
3. Keep the first implementation smaller than Base UI.
4. Introduce `packages/utils` and `packages/react/src/internals` only when a component needs them.
5. Prioritize public API, accessibility surface, state attributes, ref behavior, and observable interactions.
6. Defer positioning, popup, composite navigation, and broad internal abstractions until a phase requires them.
7. Never discard user changes or unrelated repository work.

## Local Map

Study docs:

```txt
docs/base-ui-clone-study/overview.md
docs/base-ui-clone-study/workflow.md
docs/base-ui-clone-study/phases/README.md
docs/base-ui-clone-study/phases/phase-XX-name.md
docs/base-ui-clone-study/phases/phase-XX-name.learn.md
```

Implementation targets:

```txt
packages/utils
packages/react
apps/playground
```

Upstream Base UI reference:

```txt
/Users/youngchang/dev/references/base-ui/packages/react
/Users/youngchang/dev/references/base-ui/packages/utils
```

## Phase Workflow

1. Identify the current or requested phase from `docs/base-ui-clone-study/phases/README.md` and the matching `phase-XX-name.md`.
2. Read the phase goal, implementation order, required utils, required internals, and completion criteria.
3. Write down the learning target for the slice before implementation: the Base UI design idea being studied, not just the files to create.
4. Inspect the local package shape and existing exports before editing.
5. Read upstream reference files using the limited reference workflow below.
6. Implement only the utils, internals, public component, exports, and playground examples required for this phase.
7. Run `pnpm typecheck` and `pnpm build` after implementation. Add focused tests when the phase has meaningful behavior risk or existing test infrastructure supports it.
8. Create or update the phase learn document next to the phase file: `docs/base-ui-clone-study/phases/phase-XX-name.learn.md`.
9. In the final response, summarize implemented files, verification, and the learning record location.

## Reference Workflow

Start from upstream `packages/react`, then move outward only as imports or tests require.

1. Find the public component entry and export surface for the phase component.
2. Read same-directory type, constants, context, and store files.
3. Follow only directly imported `internals` and `utils`.
4. Read the component tests to capture public behavior, accessibility, keyboard/pointer interactions, controlled/uncontrolled behavior, and data attributes.
5. Read upstream `packages/utils` implementations only for utilities actually imported by the component or internals.

Do not pre-copy the upstream directory structure. If an upstream helper is broad, implement the smallest local version that satisfies the current phase and note deferred behavior in the learn document.

Useful search commands:

```bash
rg -n "ComponentName" /Users/youngchang/dev/references/base-ui/packages/react
find /Users/youngchang/dev/references/base-ui/packages/react/src -iname '*component-name*' -maxdepth 4
rg -n "useSomeUtility|someUtility" /Users/youngchang/dev/references/base-ui/packages/utils /Users/youngchang/dev/references/base-ui/packages/react
```

## What To Record While Reading

Capture these notes for the phase learn document:

- Learning elements for this phase.
- Public props and default values.
- Data attributes.
- ARIA attributes.
- Keyboard and pointer behavior.
- Controlled/uncontrolled behavior.
- Ref behavior and render override behavior.
- Base UI design intent inferred from code and tests.
- Required `packages/utils` utilities.
- Required `packages/react/src/internals`.
- Scope intentionally reduced for the study implementation.
- Behavior deferred to later phases.

## Learn Document Template

Create `docs/base-ui-clone-study/phases/phase-XX-name.learn.md` with this shape:

```md
# Phase XX. Name 완료

완료일: YYYY-MM-DD

## 구현 요약

- 구현한 파일:
- playground:
- 검증:

## 학습 기록

- 이번 phase의 학습 요소:
- Base UI의 설계 의도:
- 구현하면서 확인한 public surface:
- 원본에서 학습용으로 줄인 부분:
- 다음 phase에서 다시 볼 부분:

## 읽은 원본

- public component:
- context/store:
- internals:
- utils:
- tests:

## 남긴 TODO

-
```

Keep the learn document factual. Distinguish direct upstream observations from inferences.
