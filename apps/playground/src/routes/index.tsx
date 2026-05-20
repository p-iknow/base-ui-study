import { createFileRoute } from '@tanstack/react-router'

const learningOrder = [
  {
    name: 'mergeProps',
    status: 'First',
    reason: 'Defines how public props and internal props combine before any component exists.',
  },
  {
    name: 'composeRefs',
    status: 'Next',
    reason: 'Makes forwarded refs, local refs, and render override refs work together.',
  },
  {
    name: 'useRenderElement',
    status: 'Then',
    reason: 'Creates the shared render pipeline for tag defaults and render overrides.',
  },
  {
    name: 'Button',
    status: 'After internals',
    reason: 'Applies the first internal slice to one public primitive.',
  },
]

export const Route = createFileRoute('/')({
  component: Home,
})

function Home() {
  return (
    <main>
      <section className="workspace">
        <div>
          <p className="eyebrow">Base UI Clone Study</p>
          <h1>@base-ui-study/react</h1>
          <p className="lede">
            Clone Base UI from the local reference package by rebuilding one small internal slice at
            a time, then applying it to the smallest useful component.
          </p>
          <pre>
            <code>/Users/youngchang/dev/references/base-ui/packages/react</code>
          </pre>
        </div>

        <section className="demo-panel" aria-labelledby="empty-start">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Reset</p>
              <h2 id="empty-start">No cloned components yet</h2>
            </div>
            <code>packages/react/src</code>
          </div>

          <div className="notes-grid">
            <code>internals</code>
            <code>primitive</code>
            <code>playground</code>
            <code>typecheck</code>
          </div>
        </section>
      </section>

      <section className="section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Roadmap</p>
            <h2>Suggested Clone Order</h2>
          </div>
        </div>
        <div className="api-list">
          {learningOrder.map((item) => (
            <article className="api-item" key={item.name}>
              <div>
                <h3>{item.name}</h3>
                <p>{item.reason}</p>
              </div>
              <code>{item.status}</code>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}
