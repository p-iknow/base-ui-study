# Workflow

## 학습 원칙

1. 한 번에 한 개념만 배운다.
2. 원본은 필요한 파일과 가까운 테스트만 읽는다.
3. 처음 구현은 Base UI보다 작게 만든다.
4. `utils`와 `internals`는 특정 컴포넌트를 완성하는 데 필요할 때만 도입한다.
5. public API, accessibility surface, state attribute, ref behavior를 우선한다.
6. positioning, popup, composite navigation 같은 고급 내부 구조는 필요한 컴포넌트가 나올 때 도입한다.

## 원본 reference 참고 규칙

원본 Base UI 코드는 아래 로컬 reference를 기준으로 읽는다.

```txt
/Users/youngchang/dev/references/base-ui/packages/react
/Users/youngchang/dev/references/base-ui/packages/utils
```

컴포넌트 phase를 시작할 때는 `packages/react`에서 먼저 public component entry를 찾는다. 예를 들어 `Separator` phase라면 원본의 `packages/react/src/separator` 또는 같은 이름의 component 디렉터리에서 시작한다.

원본을 읽는 순서는 아래를 따른다.

1. public component entry와 export surface를 먼저 확인한다.
2. 같은 디렉터리의 type, constants, context, store 파일을 확인한다.
3. public component가 직접 import하는 `internals`와 `utils`만 따라간다.
4. 해당 component test를 읽어 public behavior, accessibility, interaction 기대값을 확인한다.
5. 필요한 `packages/utils` 구현은 component에서 실제로 import된 것부터 확인한다.

원본을 읽을 때는 전체 구조를 미리 복사하지 않는다. 현재 phase의 public behavior를 이해하는 데 필요한 파일까지만 읽고, 다음 phase에서 실제 재사용될 때 다시 확장한다.

## 기본 작업 루프

1. 완성할 컴포넌트 slice를 고른다.
2. 해당 slice에서 배울 Base UI 설계 요소를 먼저 적는다.
3. 해당 slice의 public API, aria/data surface, interaction 목표를 먼저 적는다.
4. 원본의 public component file, 가까운 context/store file, 해당 테스트만 읽는다.
5. 컴포넌트를 완성하는 데 필요한 `packages/utils/src` 유틸을 구현하거나 정리한다.
6. 컴포넌트 내부 구현에 필요한 `packages/react/src/internals`를 최소 범위로 만든다.
7. `packages/react/src`에 public component를 구현하고 export를 정리한다.
8. `apps/playground`에 실제 사용 예제를 추가한다. phase 예제는 가능하면 `apps/playground/src/routes/phase-N.tsx`에 분리하고, `index.tsx`는 route hub로 유지한다.
9. `pnpm typecheck`와 `pnpm build`를 실행한다.
10. 가능하면 slice 단위 테스트를 추가한다.
11. phase별 학습 완료 문서를 phase 문서 옆에 작성한다.

## Slice별 읽기 규칙

원본을 읽을 때는 아래 범위를 넘기지 않는다.

1. public component entry file
2. 같은 디렉터리의 context/store file
3. 직접 import하는 `internals` 또는 `utils` 파일
4. 해당 component test
5. type definition file

읽은 뒤에는 아래를 기록한다.

- 이번 slice의 학습 요소
- public prop
- data attribute
- aria attribute
- keyboard behavior
- controlled/uncontrolled behavior
- Base UI의 설계 의도
- 필요한 `utils`
- 필요한 `internals`
- 학습용 구현에서 줄인 범위
- 나중으로 미룬 기능

## 완료 문서 규칙

각 phase를 끝낼 때 완료 기록은 phase 문서 안에 덧붙이지 않고 phase 문서 옆에 별도 학습 문서로 작성한다.

```txt
docs/base-ui-clone-study/phases/phase-XX-name.learn.md
```

학습 완료 문서는 아래 형식을 따른다.

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
