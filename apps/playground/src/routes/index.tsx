import { createFileRoute, Link } from '@tanstack/react-router'

const playgroundRoutes = [
  {
    to: '/phase-1',
    label: 'Separator',
    status: 'Phase 1',
    reason:
      'Applies the first render pipeline to a public component with ARIA and state attributes.',
  },
  {
    to: '/phase-2',
    label: 'Button',
    status: 'Phase 2',
    reason:
      'Adds disabled semantics, focus rules, and click handling to a pressable primitive.',
  },
  {
    to: '/phase-3',
    label: 'Input',
    status: 'Phase 3',
    reason:
      'Keeps native form control behavior while exposing input state attributes.',
  },
  {
    to: '/phase-4',
    label: 'Avatar',
    status: 'Phase 4',
    reason:
      'Shares image loading state across parts and coordinates fallback/image mounting.',
  },
  {
    to: '/phase-5',
    label: 'Toggle',
    status: 'Phase 5',
    reason:
      'Adds controlled boolean state and grouped toggle value coordination on top of button behavior.',
  },
  {
    to: '/phase-6',
    label: 'Switch',
    status: 'Phase 6',
    reason:
      'Connects boolean state to a hidden checkbox for native labels, form submission, and reset behavior.',
  },
  {
    to: '/roadmap',
    label: 'Suggested Clone Order',
    status: 'Roadmap',
    reason: 'Lists the current learning order for upcoming study slices.',
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
            Clone Base UI from the local reference package by rebuilding one
            small internal slice at a time, then applying it to the smallest
            useful component.
          </p>
          <pre>
            <code>/Users/youngchang/dev/references/base-ui/packages/react</code>
          </pre>
        </div>

        <section className="demo-panel" aria-labelledby="playground-routes">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Playground</p>
              <h2 id="playground-routes">Routes</h2>
            </div>
          </div>

          <div className="api-list">
            {playgroundRoutes.map((item) => (
              <Link className="api-item route-link" key={item.to} to={item.to}>
                <div>
                  <h3>{item.label}</h3>
                  <p>{item.reason}</p>
                </div>
                <code>{item.status}</code>
              </Link>
            ))}
          </div>
        </section>
      </section>
    </main>
  )
}
