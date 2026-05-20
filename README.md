# base-ui-study

Study workspace for cloning Base UI headless React components one by one.

This template keeps the full setup from the source repository:

- pnpm workspace with `apps/*` and `packages/*`
- Base UI clone package built with `tsdown`
- `package.json` exports with `@repo/source` custom condition
- playground app for local package development
- Nx task pipeline
- Vitest workspace
- Changesets release setup
- GitHub Actions workflows
- oxlint, oxfmt, Sheriff, and Knip checks

## Workspace

```text
apps/
  playground/        TanStack Start playground app
packages/
  react/     Study clone package
```

## Commands

```bash
pnpm install
pnpm build
pnpm dev
pnpm test
pnpm typecheck
pnpm lint
pnpm format
pnpm format:check
pnpm sheriff
pnpm knip
pnpm check
pnpm --filter @base-ui-study/react run build
```

## Source-First Workspace Imports

The package export map includes an internal source condition:

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

The root TypeScript config enables that condition:

```json
{
  "compilerOptions": {
    "customConditions": ["@repo/source"]
  }
}
```

Inside the workspace, TypeScript and IDE navigation can resolve package imports
to `src/` instead of stale `dist/` output. Published consumers still use the
normal `dist/` entries.

## License

MIT
