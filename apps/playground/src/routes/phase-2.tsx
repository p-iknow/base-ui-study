import { createFileRoute, Link } from '@tanstack/react-router'
import { Button } from '@base-ui-study/react/button'

export const Route = createFileRoute('/phase-2')({
  component: PhaseTwo,
})

function PhaseTwo() {
  return (
    <main>
      <section className="section">
        <Link className="back-link" to="/">
          Back to routes
        </Link>

        <div className="section-heading">
          <div>
            <p className="eyebrow">Phase 2</p>
            <h1>Button</h1>
          </div>
          <code>@base-ui-study/react/button</code>
        </div>

        <div className="button-demo">
          <div className="button-row">
            <Button className="demo-button">Native button</Button>
            <Button className="demo-button" disabled>
              Native disabled
            </Button>
            <Button className="demo-button" disabled focusableWhenDisabled>
              Focusable disabled
            </Button>
          </div>

          <div className="button-row">
            <Button
              nativeButton={false}
              render={
                <a className="render-button" href="#custom-button">
                  Custom anchor
                </a>
              }
            />
            <Button
              disabled
              nativeButton={false}
              render={
                <a className="render-button" href="#disabled-custom">
                  Disabled anchor
                </a>
              }
            />
            <Button
              disabled
              focusableWhenDisabled
              nativeButton={false}
              render={
                <a className="render-button" href="#focusable-custom">
                  Focusable anchor
                </a>
              }
            />
          </div>
        </div>
      </section>
    </main>
  )
}
