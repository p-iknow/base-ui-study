# Workflow

## 학습 원칙

1. 한 번에 한 개념만 배운다.
2. 원본은 필요한 파일과 가까운 테스트만 읽는다.
3. 처음 구현은 Base UI보다 작게 만든다.
4. `utils`와 `internals`는 특정 컴포넌트를 완성하는 데 필요할 때만 도입한다.
5. public API, accessibility surface, state attribute, ref behavior를 우선한다.
6. positioning, popup, composite navigation 같은 고급 내부 구조는 필요한 컴포넌트가 나올 때 도입한다.

## 기본 작업 루프

1. 완성할 컴포넌트 slice를 고른다.
2. 해당 slice의 public API, aria/data surface, interaction 목표를 먼저 적는다.
3. 원본의 public component file, 가까운 context/store file, 해당 테스트만 읽는다.
4. 컴포넌트를 완성하는 데 필요한 `packages/utils/src` 유틸을 구현하거나 정리한다.
5. 컴포넌트 내부 구현에 필요한 `packages/react/src/internals`를 최소 범위로 만든다.
6. `packages/react/src`에 public component를 구현하고 export를 정리한다.
7. `apps/playground`에 실제 사용 예제를 추가한다.
8. `pnpm typecheck`와 `pnpm build`를 실행한다.
9. 가능하면 slice 단위 테스트를 추가한다.
10. 문서의 "현재 클론 상태"를 갱신한다.

## Slice별 읽기 규칙

원본을 읽을 때는 아래 범위를 넘기지 않는다.

1. public component entry file
2. 같은 디렉터리의 context/store file
3. 직접 import하는 `internals` 또는 `utils` 파일
4. 해당 component test
5. type definition file

읽은 뒤에는 아래를 기록한다.

- public prop
- data attribute
- aria attribute
- keyboard behavior
- controlled/uncontrolled behavior
- 필요한 `utils`
- 필요한 `internals`
- 나중으로 미룬 기능

## 완료 기록 양식

각 slice를 끝낼 때 아래 형식으로 문서에 추가한다.

```md
### YYYY-MM-DD: Button slice

- 읽은 원본:
- 구현한 파일:
- playground:
- 검증:
- 남긴 TODO:
```
