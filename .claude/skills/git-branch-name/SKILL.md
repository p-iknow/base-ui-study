---
name: git-branch-name
description: Analyze a task description and generate a conventional git branch name. Use when the user asks to create a branch, name a branch, or generate a branch name from a task description (Korean or English). Trigger phrases include "브랜치명", "branch name", "checkout -b", or any request to convert work context into a git branch identifier. Outputs `{type}/{kebab-case}` format and the ready-to-run `git checkout -b` command without executing it.
---

# Git Branch Name Generator

Analyze the current task or description and generate a conventional git branch name.

## Inputs

- **description** (required): Task description, work summary, or context to analyze.

If description is empty, ask the user for one before proceeding.

## Examples

```
사용자 로그인 기능 추가
fix: 버튼 클릭 안되는 버그 수정
현재 todo 분석해서 브랜치명 만들어줘
```

## Instructions

### Step 1: Analyze Input

Parse the description to extract:
- **Action**: What is being done (add, fix, update, remove, etc.)
- **Target**: What is being affected (login, button, API, etc.)
- **Context**: Additional qualifiers if any

If description says "현재 작업" or "current work":
1. Read active tasks (TodoRead / TaskList)
2. Check `git diff --stat` for changed files
3. Infer branch purpose from context

### Step 2: Detect Branch Type

| Type | Korean Triggers | English Triggers |
|------|-----------------|------------------|
| `feat` | 추가, 구현, 기능, 새로운, 만들기 | add, implement, feature, create, new |
| `fix` | 수정, 버그, 오류, 에러, 해결, 고치기 | fix, bug, error, resolve, correct |
| `chore` | 설정, 환경, 의존성, 빌드, 배포 | config, setup, build, deploy, dependency |
| `docs` | 문서, README, 주석, 설명 | doc, readme, comment, documentation |
| `refactor` | 리팩토링, 개선, 정리, 구조 | refactor, improve, cleanup, restructure |
| `test` | 테스트, 검증, 스펙 | test, spec, verify |
| `style` | 스타일, 포맷, 린트 | style, format, lint, css |

**Default**: `feat` (if type cannot be determined)

### Step 3: Generate Branch Name

Apply naming rules:

1. **Format**: `{type}/{kebab-case-description}`
2. **Korean → English**: Translate Korean keywords to English
3. **Kebab-case**: Lowercase, hyphen-separated
4. **Max length**: 50 characters total
5. **No special chars**: Only lowercase letters, numbers, hyphens
6. **Concise**: Keep only essential keywords (2-4 words)

### Step 4: Output

Provide the branch name with a ready-to-use git command.

## Output Format

### Success

```
**Branch Name:** `{generated-branch-name}`

```bash
git checkout -b {generated-branch-name}
```

**분석:**
- Type: {detected-type}
- Keywords: {extracted-keywords}
```

### Ambiguous Type

```
**Branch Name:** `feat/{description}`

```bash
git checkout -b feat/{description}
```

**Note:** 타입을 명확히 판단하기 어려워 `feat`으로 기본 설정했습니다.
```

### Failure

```
Branch name 생성 실패: {reason}

다음과 같이 설명을 추가해주세요:
- 사용자 인증 기능 추가
- fix: 로그인 버튼 오류
```

## Naming Examples

| Input | Output |
|-------|--------|
| 사용자 로그인 기능 추가 | `feat/user-login` |
| fix: 버튼 클릭 안됨 | `fix/button-click` |
| OAuth2 인증 구현 | `feat/oauth2-auth` |
| README 업데이트 | `docs/update-readme` |
| 코드 정리 및 리팩토링 | `refactor/code-cleanup` |
| API 응답 에러 수정 | `fix/api-response-error` |
| 테스트 케이스 추가 | `test/add-test-cases` |
| CI/CD 파이프라인 설정 | `chore/cicd-pipeline` |

## Safety

| Rule | Enforcement |
|------|-------------|
| No git execution | Only output the command, never execute |
| No assumptions | Ask if description is empty |
| Sanitize output | Remove all special characters |

## Related Skills

| Skill | Purpose |
|-------|---------|
| `git-atomic-commit` | Create atomic commits |
| `git-draft-pr` | Create pull request |
