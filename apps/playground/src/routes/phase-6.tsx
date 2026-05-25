import { Switch } from '@base-ui-study/react/switch'
import { createFileRoute, Link } from '@tanstack/react-router'
import * as React from 'react'

export const Route = createFileRoute('/phase-6')({
  component: PhaseSix,
})

function PhaseSix() {
  const [checked, setChecked] = React.useState(false)
  const [submitted, setSubmitted] = React.useState('not submitted')

  return (
    <main>
      <section className="section">
        <Link className="back-link" to="/">
          Back to routes
        </Link>

        <div className="section-heading">
          <div>
            <p className="eyebrow">Phase 6</p>
            <h1>Switch</h1>
          </div>
          <code>@base-ui-study/react/switch</code>
        </div>

        <div className="switch-grid">
          <form
            className="demo-panel switch-demo"
            onSubmit={(event) => {
              event.preventDefault()
              const formData = new FormData(event.currentTarget)
              setSubmitted(
                JSON.stringify(Object.fromEntries(formData.entries())),
              )
            }}
          >
            <h2>Form values</h2>
            <label className="switch-row">
              <Switch.Root className="switch-root" name="digest">
                <Switch.Thumb className="switch-thumb" />
              </Switch.Root>
              Native default value
            </label>
            <label className="switch-row">
              <Switch.Root
                className="switch-root"
                name="availability"
                uncheckedValue="off"
                value="on"
              >
                <Switch.Thumb className="switch-thumb" />
              </Switch.Root>
              Explicit off value
            </label>
            <div className="button-row">
              <button className="form-button" type="submit">
                Submit
              </button>
              <button className="form-button" type="reset">
                Reset
              </button>
            </div>
            <code>{submitted}</code>
          </form>

          <section className="demo-panel switch-demo">
            <h2>Controlled</h2>
            <label className="switch-row">
              <Switch.Root
                checked={checked}
                className="switch-root"
                onCheckedChange={setChecked}
              >
                <Switch.Thumb className="switch-thumb" />
              </Switch.Root>
              Notifications
            </label>
            <div className="button-row">
              <button
                className="form-button"
                type="button"
                onClick={() => setChecked((value) => !value)}
              >
                Toggle outside
              </button>
            </div>
            <code>checked: {String(checked)}</code>
          </section>

          <section className="demo-panel switch-demo">
            <h2>Disabled fieldset</h2>
            <fieldset disabled>
              <label className="switch-row">
                <Switch.Root
                  className="switch-root"
                  defaultChecked
                  name="locked"
                >
                  <Switch.Thumb className="switch-thumb" />
                </Switch.Root>
                Inherited native disabled
              </label>
            </fieldset>
            <label className="switch-row">
              <Switch.Root className="switch-root" disabled>
                <Switch.Thumb className="switch-thumb" />
              </Switch.Root>
              Component disabled
            </label>
          </section>

          <section className="demo-panel switch-demo">
            <h2>Read only and required</h2>
            <label className="switch-row">
              <Switch.Root className="switch-root" readOnly>
                <Switch.Thumb className="switch-thumb" />
              </Switch.Root>
              Read only
            </label>
            <label className="switch-row">
              <Switch.Root className="switch-root" required>
                <Switch.Thumb className="switch-thumb" />
              </Switch.Root>
              Required
            </label>
          </section>
        </div>
      </section>
    </main>
  )
}
