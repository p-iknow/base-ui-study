import { Toggle } from '@base-ui-study/react/toggle'
import { ToggleGroup } from '@base-ui-study/react/toggle-group'
import { createFileRoute, Link } from '@tanstack/react-router'
import * as React from 'react'

export const Route = createFileRoute('/phase-5')({
  component: PhaseFive,
})

function PhaseFive() {
  const [pressed, setPressed] = React.useState(false)
  const [singleValue, setSingleValue] = React.useState<string[]>(['center'])

  return (
    <main>
      <section className="section">
        <Link className="back-link" to="/">
          Back to routes
        </Link>

        <div className="section-heading">
          <div>
            <p className="eyebrow">Phase 5</p>
            <h1>Toggle</h1>
          </div>
          <code>@base-ui-study/react/toggle</code>
        </div>

        <div className="toggle-grid">
          <section className="demo-panel toggle-demo">
            <h2>Buttons</h2>
            <div className="button-row">
              <Toggle className="toggle-button" defaultPressed>
                Uncontrolled
              </Toggle>
              <Toggle
                className="toggle-button"
                onPressedChange={setPressed}
                pressed={pressed}
              >
                Controlled
              </Toggle>
              <Toggle className="toggle-button" disabled>
                Disabled
              </Toggle>
              <Toggle
                className="toggle-button rendered-toggle"
                nativeButton={false}
                render={<a href="#custom-toggle">Custom render</a>}
              />
            </div>
            <code>controlled: {String(pressed)}</code>
          </section>

          <section className="demo-panel toggle-demo">
            <h2>Single group</h2>
            <ToggleGroup
              aria-label="Text alignment"
              className="toggle-group"
              onValueChange={setSingleValue}
              value={singleValue}
            >
              <Toggle className="toggle-button" value="left">
                Left
              </Toggle>
              <Toggle className="toggle-button" value="center">
                Center
              </Toggle>
              <Toggle className="toggle-button" value="right">
                Right
              </Toggle>
            </ToggleGroup>
            <code>{singleValue.join(', ') || 'none'}</code>
          </section>

          <section className="demo-panel toggle-demo">
            <h2>Multiple group</h2>
            <ToggleGroup
              aria-label="Text style"
              className="toggle-group"
              defaultValue={['bold', 'italic']}
              multiple
            >
              <Toggle className="toggle-button" value="bold">
                Bold
              </Toggle>
              <Toggle className="toggle-button" value="italic">
                Italic
              </Toggle>
              <Toggle className="toggle-button" value="underline">
                Underline
              </Toggle>
            </ToggleGroup>
          </section>

          <section className="demo-panel toggle-demo">
            <h2>Vertical disabled group</h2>
            <ToggleGroup
              aria-label="Disabled sorting"
              className="toggle-group vertical-toggle-group"
              defaultValue={['newest']}
              disabled
              orientation="vertical"
            >
              <Toggle className="toggle-button" value="newest">
                Newest
              </Toggle>
              <Toggle className="toggle-button" value="popular">
                Popular
              </Toggle>
            </ToggleGroup>
          </section>
        </div>
      </section>
    </main>
  )
}
