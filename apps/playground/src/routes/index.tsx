import { createGreeting } from '@repo/package'
import { createFileRoute } from '@tanstack/react-router'

const examples = [
  {
    name: 'Root import',
    importPath: '@repo/package',
    code: createGreeting({ name: 'TypeScript' }),
    description: 'Import the public API from the package root during local development.',
  },
  {
    name: 'Subpath import',
    importPath: '@repo/package/create-greeting',
    code: createGreeting({ greeting: 'Welcome', name: 'Template User' }),
    description: 'Export focused entrypoints when consumers should import a smaller surface.',
  },
]

const packageChecks = [
  'pnpm --filter @repo/package run build',
  'pnpm --filter @repo/package run test:attw',
  'pnpm --filter @repo/package run test:publint',
]

export const Route = createFileRoute('/')({
  component: Home,
})

function Home() {
  return (
    <main>
      <section className="hero">
        <div>
          <p className="eyebrow">TypeScript Package Template</p>
          <h1>@repo/package</h1>
          <p className="lede">
            A publishable TypeScript package with ESM and CommonJS builds, typed exports, workspace
            source imports, and release checks.
          </p>
          <pre>
            <code>pnpm add @repo/package</code>
          </pre>
        </div>
      </section>

      <section className="section">
        <div className="section-heading">
          <p className="eyebrow">API</p>
          <h2>Example Exports</h2>
        </div>
        <div className="api-list">
          {examples.map((example) => (
            <article className="api-item" key={example.importPath}>
              <div>
                <h3>{example.name}</h3>
                <p>{example.description}</p>
              </div>
              <div>
                <code>{example.importPath}</code>
                <code>{example.code}</code>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-heading">
          <p className="eyebrow">Package Checks</p>
          <h2>Ready for Publishing</h2>
        </div>
        <div className="check-grid">
          {packageChecks.map((command) => (
            <code key={command}>{command}</code>
          ))}
        </div>
      </section>
    </main>
  )
}
