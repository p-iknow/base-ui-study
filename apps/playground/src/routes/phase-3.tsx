import { createFileRoute, Link } from '@tanstack/react-router'
import { Input } from '@base-ui-study/react/input'

export const Route = createFileRoute('/phase-3')({
  component: PhaseThree,
})

function PhaseThree() {
  return (
    <main>
      <section className="section">
        <Link className="back-link" to="/">
          Back to routes
        </Link>

        <div className="section-heading">
          <div>
            <p className="eyebrow">Phase 3</p>
            <h1>Input</h1>
          </div>
          <code>@base-ui-study/react/input</code>
        </div>

        <form className="input-demo" method="get">
          <label className="input-field">
            <span>Text</span>
            <Input
              className="demo-input"
              name="title"
              placeholder="Project title"
            />
          </label>

          <label className="input-field">
            <span>Required</span>
            <Input
              className="demo-input"
              name="owner"
              placeholder="Owner"
              required
            />
          </label>

          <label className="input-field">
            <span>Disabled</span>
            <Input
              className="demo-input"
              defaultValue="Read-only billing code"
              disabled
              name="billingCode"
            />
          </label>

          <label className="input-field">
            <span>Invalid</span>
            <Input
              className="demo-input"
              defaultValue="missing-domain"
              invalid
              name="email"
              type="email"
            />
          </label>
        </form>
      </section>
    </main>
  )
}
