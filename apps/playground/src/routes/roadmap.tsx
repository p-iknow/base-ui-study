import { createFileRoute, Link } from '@tanstack/react-router'

const learningOrder = [
  {
    name: 'Separator',
    status: 'Phase 1',
    reason:
      'Applies the first render pipeline to a public component with ARIA and state attributes.',
  },
  {
    name: 'useMergedRefs',
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
    status: 'Phase 2',
    reason: 'Adds disabled semantics, focus rules, and click handling to a pressable primitive.',
  },
  {
    name: 'Input',
    status: 'Phase 3',
    reason: 'Keeps native form control behavior while exposing input state attributes.',
  },
]

export const Route = createFileRoute('/roadmap')({
  component: Roadmap,
})

function Roadmap() {
  return (
    <main>
      <section className="section">
        <Link className="back-link" to="/">
          Back to routes
        </Link>

        <div className="section-heading">
          <div>
            <p className="eyebrow">Roadmap</p>
            <h1>Suggested Clone Order</h1>
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
