import { Button } from '@base-ui-study/react/button'
import { createFileRoute } from '@tanstack/react-router'

const componentPath =
  '/Users/youngchang/dev/references/base-ui/packages/react/src/button/Button.tsx'

const learningOrder = [
  {
    name: 'Button',
    status: 'Ready',
    reason:
      'DOM state, disabled semantics, ref merging, and render override are visible without context.',
  },
  {
    name: 'Toggle',
    status: 'Next',
    reason: 'Adds controlled and uncontrolled state on top of Button.',
  },
  {
    name: 'Meter',
    status: 'After Toggle',
    reason: 'Introduces compound parts, context, labels, and derived values.',
  },
  {
    name: 'Checkbox',
    status: 'Then',
    reason: 'Adds form participation, mixed state, and hidden input behavior.',
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
            Clone one headless component at a time from the local Base UI reference package. Start
            with Button, then layer in state, context, and compound parts.
          </p>
          <pre>
            <code>{componentPath}</code>
          </pre>
        </div>

        <section className="demo-panel" aria-labelledby="button-demo">
          <div className="section-heading">
            <div>
              <p className="eyebrow">First Clone</p>
              <h2 id="button-demo">Button</h2>
            </div>
            <code>@base-ui-study/react/button</code>
          </div>

          <div className="button-row">
            <Button className="demo-button">Native button</Button>
            <Button className="demo-button" disabled>
              Disabled
            </Button>
            <Button className="demo-button" disabled focusableWhenDisabled>
              Focusable disabled
            </Button>
          </div>

          <Button
            className={(state) => (state.disabled ? 'render-button is-disabled' : 'render-button')}
            render={<a href="https://base-ui.com/react/components/button">Render as link</a>}
          />

          <div className="notes-grid">
            <code>data-disabled</code>
            <code>aria-disabled</code>
            <code>focusableWhenDisabled</code>
            <code>render override</code>
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
