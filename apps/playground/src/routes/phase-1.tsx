import { createFileRoute, Link } from '@tanstack/react-router'
import { Separator } from '@base-ui-study/react/separator'

export const Route = createFileRoute('/phase-1')({
  component: PhaseOne,
})

function PhaseOne() {
  return (
    <main>
      <section className="section">
        <Link className="back-link" to="/">
          Back to routes
        </Link>

        <div className="section-heading">
          <div>
            <p className="eyebrow">Phase 1</p>
            <h1>Separator</h1>
          </div>
          <code>@base-ui-study/react/separator</code>
        </div>

        <div className="demo-panel">
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
        </div>
      </section>
    </main>
  )
}
