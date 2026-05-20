---
title: TypeScript customConditions 로 모노레포 패키지를 src 채로 import 하기
description: package.json exports 에 사용자 정의 condition 을 하나 추가하고 TypeScript customConditions 와 맞춰서, 모노레포 내부에서는 src 를 직접 보고 외부 npm 사용자는 dist 를 보게 만드는 방법.
---

# TypeScript customConditions 로 모노레포 패키지를 src 채로 import 하기

## 문제: 모노레포 안에서도 dist 를 보게 된다

pnpm workspace 로 TypeScript 라이브러리를 만들다 보면 흔히 이런 구조가 된다.

```txt
repo/
  apps/
    playground/
  packages/
    ui/
      src/
      dist/
      package.json
```

`packages/ui` 는 npm 에 배포되는 라이브러리 패키지이고, `apps/playground` 는 같은 워크스페이스 안에서 그 라이브러리를 import 해서 예제를 확인하는 consumer 앱이다.

라이브러리 패키지의 npm 이름이 `@repo/ui` 라고 해보자. playground 앱에서는 실제 사용자와 같은 import 문으로 패키지를 사용한다.

```ts
import { Button } from "@repo/ui";
```

문제는 이 import 를 TypeScript 와 IDE가 보통 패키지 import 처럼 해석한다는 데 있다. `package.json` 의 `exports`, `main`, `types` 를 따라가면 대개 `dist/` 산출물에 도착한다.

```txt
@repo/ui
  -> packages/ui/package.json
  -> exports.import.types 또는 exports.import.default
  -> ./dist/index.d.ts 또는 ./dist/index.js
```

외부 npm 사용자에게는 이 동작이 맞다. 하지만 같은 모노레포 안에서 라이브러리와 playground 앱을 같이 개발할 때는 불편이 바로 드러난다.

- `packages/ui/src/button.tsx` 를 고쳐도 playground 앱은 이전 `dist/` 를 보고 있으므로, 변경을 확인하려면 라이브러리를 다시 빌드해야 한다.
- IDE 의 go to definition 이 원본 구현 파일이 아니라 `dist/index.d.ts` 로 떨어진다.
- find references 와 rename refactor 가 원본 `src/` 경계를 제대로 따라가지 못한다.
- 타입 체크가 실제로 수정 중인 source 가 아니라 마지막으로 빌드된 산출물을 기준으로 돌아갈 수 있다.

요컨대 source 가 같은 레포 안에 있는데도, 내부 consumer 가 배포된 패키지를 쓰는 것처럼 `dist/` 를 보게 되는 것이 문제다.

원하는 동작은 이렇다.

- 모노레포 내부 consumer: `@repo/ui` 를 import 하면 `packages/ui/src/index.ts` 를 본다.
- 외부 npm 사용자: 같은 import 를 쓰지만 `dist/index.js`, `dist/index.cjs`, `dist/index.d.ts` 를 본다.
- IDE: jump-to-definition, find-references, rename refactor 가 `.d.ts` 가 아니라 실제 source 로 이어진다.
- 개발 흐름: 라이브러리 코드를 고칠 때마다 먼저 빌드하지 않아도 consumer 쪽 타입 체크와 IDE가 바로 바뀐 source 를 본다.

즉, 해결하고 싶은 것은 패키지를 의도적으로 두 방식으로 소비하는 일이 아니다. 내부 개발 환경에서만 같은 package import 가 `dist/` 대신 `src/` 로 해석되게 만들어, 빌드 루프와 IDE 탐색 문제를 없애는 것이다.

## 잘못 풀기 쉬운 방식: paths 로 우회하기

가장 먼저 떠올릴 수 있는 방법은 consumer tsconfig 에 `paths` 를 추가하는 것이다.

```json
{
  "compilerOptions": {
    "paths": {
      "@repo/ui": ["../../packages/ui/src/index.ts"]
    }
  }
}
```

이렇게 하면 TypeScript 는 source 를 볼 수 있다. 하지만 패키지의 진짜 공개 인터페이스인 `package.json:exports` 와는 별개의 매핑을 하나 더 만든다.

이 방식의 문제는 중복이다. `exports` 에 서브패스가 늘어날 때마다 `paths` 도 같이 맞춰야 한다. 둘 중 하나가 어긋나면 TypeScript 는 통과하는데 실제 빌드는 실패하거나, IDE에서는 보이는데 배포 패키지에서는 열리지 않는 상태가 된다.

라이브러리 패키지의 공개 경로는 이미 `exports` 에 적혀 있다. 내부 개발용 source 경로도 가능하면 같은 곳에 적는 편이 낫다.

## 핵심: exports 에 사용자 정의 condition 을 추가한다

Node 패키지의 `exports` 는 condition 별로 다른 진입점을 줄 수 있다. 흔히 쓰는 condition 은 `import`, `require`, `types`, `node`, `default` 같은 것들이다.

여기에 패키지 작성자가 직접 만든 condition 도 넣을 수 있다. 예를 들어 내부 source 를 뜻하는 condition 으로 `"@repo/source"` 를 사용할 수 있다.

```json
{
  "exports": {
    ".": {
      "@repo/source": "./src/index.ts",
      "import": {
        "types": "./dist/index.d.ts",
        "default": "./dist/index.js"
      },
      "require": {
        "types": "./dist/index.d.cts",
        "default": "./dist/index.cjs"
      }
    }
  }
}
```

이 객체 하나가 내부 개발 환경의 source 진입점과 배포 패키지의 dist 진입점을 함께 관리한다.

- `"@repo/source"`: 모노레포 내부 개발자가 볼 source 진입점
- `"import"` / `"require"`: 배포된 패키지 사용자가 볼 dist 진입점

외부 사용자의 Node, 빌드 도구, TypeScript 는 `"@repo/source"` 라는 condition 을 모른다. 그래서 그 키를 선택하지 않고 일반적인 `import` 또는 `require` 경로로 내려간다.

반대로 모노레포 내부 TypeScript 에게는 `"@repo/source"` 를 알고 있다고 알려주면 된다. 그 설정이 `customConditions` 다.

```json
// tsconfig.base.json
{
  "compilerOptions": {
    "customConditions": ["@repo/source"]
  }
}
```

이제 모노레포 내부에서 TypeScript 는 `@repo/ui` 를 해석할 때 `exports["."]["@repo/source"]` 를 후보로 사용한다.

```txt
@repo/ui
  -> package.json exports["."]
  -> "@repo/source" condition matched
  -> ./src/index.ts
```

외부 사용자는 같은 `exports` 객체를 보지만 `@repo/source` condition 을 활성화하지 않았으므로 dist 로 떨어진다.

```txt
@repo/ui
  -> package.json exports["."]
  -> "@repo/source" condition ignored
  -> import/default 또는 require/default
  -> ./dist/index.js 또는 ./dist/index.cjs
```

이게 `customConditions` 의 핵심이다. 내부 개발용 alias 를 tsconfig 어딘가에 따로 숨기지 않고, 패키지의 공식 공개 경로인 `exports` 안에 함께 둔다. 같은 import 문, 같은 `exports` 객체, 다른 condition 선택만으로 source 와 dist 를 나눈다.

## 서브패스 export 도 같은 규칙을 따른다

이 패키지는 루트 export 뿐 아니라 컴포넌트별 서브패스도 공개한다.

```ts
import { Button } from "@repo/ui/button";
```

그래서 `package.json` 의 각 서브패스에도 같은 condition 구조를 반복한다.

```json
{
  "exports": {
    "./button": {
      "@repo/source": "./src/button.ts",
      "import": {
        "types": "./dist/button.d.ts",
        "default": "./dist/button.js"
      },
      "require": {
        "types": "./dist/button.d.cts",
        "default": "./dist/button.cjs"
      }
    }
  }
}
```

이렇게 해두면 루트 import 와 서브패스 import 가 같은 정책을 가진다.

- 내부 TypeScript: `./src/button.ts`
- 외부 ESM 사용자: `./dist/button.js`
- 외부 CJS 사용자: `./dist/button.cjs`
- 외부 타입: `./dist/button.d.ts` 또는 `./dist/button.d.cts`

중요한 점은, 공개할 경로가 늘어날 때 수정할 곳이 `exports` 하나라는 것이다. `paths` 와 `exports` 를 따로 맞추는 일이 없다.

## 이 구조가 주는 효과

이 설정이 완성되면 모노레포 내부 개발 경험은 npm 패키지를 쓰는 모양을 유지하면서 source 를 직접 다루는 쪽으로 바뀐다.

consumer 앱의 import 문은 실제 사용자 코드와 같다.

```ts
import { Button } from "@repo/ui";
import { Dialog } from "@repo/ui/dialog";
```

하지만 TypeScript 와 IDE는 내부 condition 때문에 `src/` 를 본다. 그래서 definition 이동은 `.d.ts` 가 아니라 구현 파일로 가고, rename refactor 와 references 탐색도 source 경계를 따라간다.

배포 패키지의 공개 surface 는 여전히 `exports` 로 검증된다. 외부 사용자는 `@repo/source` 를 활성화하지 않으므로 source 파일을 직접 보지 않는다. 같은 `package.json` 이 내부 개발용 지도와 외부 배포용 지도를 동시에 갖는 셈이다.

## 정리

이 글의 중심은 `customConditions` 한 줄이다.

```json
{
  "compilerOptions": {
    "customConditions": ["@repo/source"]
  }
}
```

그리고 그 한 줄은 `package.json:exports` 의 같은 키와 짝이 맞을 때 의미가 생긴다.

```json
{
  "exports": {
    ".": {
      "@repo/source": "./src/index.ts",
      "import": {
        "types": "./dist/index.d.ts",
        "default": "./dist/index.js"
      }
    }
  }
}
```

`customConditions` 는 TypeScript 에게 "나는 이 condition 을 알고 있다" 고 알려주는 설정이다. `exports` 는 그 condition 이 선택됐을 때 실제로 어느 파일을 볼지 알려준다.

둘을 맞추면 모노레포 내부에서는 source 를 직접 보고, 외부 npm 사용자는 dist 를 본다. `paths` 로 우회하지 않아도 되고, 내부 개발 경로와 외부 배포 경로가 하나의 `exports` 객체 안에서 함께 관리된다.
