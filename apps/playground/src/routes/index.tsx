import { createFileRoute } from '@tanstack/react-router'
import { Separator } from '@base-ui-study/react/separator'

const learningOrder = [
  {
    name: 'Separator',
    status: 'Phase 1',
    reason: 'Applies the first render pipeline to a public component with ARIA and state attributes.',
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
              <p className="eyebrow">Phase 1</p>
              <h2 id="empty-start">Separator</h2>
            </div>
            <code>packages/react/src</code>
          </div>

          <div className="separator-demo">
            <div className="separator-row">
              <span>Account</span>
              <Separator className="demo-separator" />
              <span>Billing</span>
            </div>

            <div className="vertical-demo">
              <span>Nav</span>
              <Separator orientation="vertical" className="demo-separator" />
              <span>Content</span>
            </div>

            <Separator
              render={<hr className="rendered-separator" />}
              aria-label="Rendered as horizontal rule"
            />
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
