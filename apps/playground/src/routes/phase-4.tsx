import { Avatar } from '@base-ui-study/react/avatar'
import { createFileRoute, Link } from '@tanstack/react-router'
import * as React from 'react'

const SUCCESS_AVATAR =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96">
      <rect width="96" height="96" rx="20" fill="#0f6b58"/>
      <circle cx="48" cy="38" r="18" fill="#d8f3ea"/>
      <path d="M18 86c5-20 18-30 30-30s25 10 30 30" fill="#d8f3ea"/>
    </svg>
  `)

const ALT_AVATAR =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96">
      <rect width="96" height="96" rx="20" fill="#334155"/>
      <circle cx="48" cy="48" r="25" fill="#f6d365"/>
      <path d="M35 55c5 6 21 6 26 0" stroke="#334155" stroke-width="6" stroke-linecap="round" fill="none"/>
    </svg>
  `)

export const Route = createFileRoute('/phase-4')({
  component: PhaseFour,
})

function PhaseFour() {
  const [animatedSrc, setAnimatedSrc] = React.useState<string>()
  const [delayedSrc, setDelayedSrc] = React.useState<string>()

  React.useEffect(() => {
    const timer = window.setTimeout(() => setDelayedSrc(SUCCESS_AVATAR), 1400)
    return () => window.clearTimeout(timer)
  }, [])

  return (
    <main>
      <section className="section">
        <Link className="back-link" to="/">
          Back to routes
        </Link>

        <div className="section-heading">
          <div>
            <p className="eyebrow">Phase 4</p>
            <h1>Avatar</h1>
          </div>
          <code>@base-ui-study/react/avatar</code>
        </div>

        <div className="avatar-grid">
          <AvatarExample
            title="Loaded image"
            src={SUCCESS_AVATAR}
            fallback="YC"
          />
          <AvatarExample
            title="Failed image"
            src="/missing-avatar.png"
            fallback="ER"
          />
          <AvatarExample title="No source" fallback="NS" />
          <AvatarExample
            title="Delayed fallback"
            src={delayedSrc}
            fallback="WA"
            delay={650}
          />

          <section className="avatar-example">
            <div>
              <h2>Animated switch</h2>
              <button
                className="demo-button"
                type="button"
                onClick={() =>
                  setAnimatedSrc((current) =>
                    current === ALT_AVATAR ? undefined : ALT_AVATAR,
                  )
                }
              >
                Toggle image
              </button>
            </div>
            <Avatar.Root className="demo-avatar">
              <Avatar.Image
                alt="Animated avatar"
                className="demo-avatar-image"
                src={animatedSrc}
              />
              <Avatar.Fallback className="demo-avatar-fallback">
                AN
              </Avatar.Fallback>
            </Avatar.Root>
          </section>
        </div>
      </section>
    </main>
  )
}

function AvatarExample(props: {
  delay?: number
  fallback: string
  src?: string
  title: string
}) {
  const { delay, fallback, src, title } = props

  return (
    <section className="avatar-example">
      <h2>{title}</h2>
      <Avatar.Root className="demo-avatar">
        <Avatar.Image alt="" className="demo-avatar-image" src={src} />
        <Avatar.Fallback className="demo-avatar-fallback" delay={delay}>
          {fallback}
        </Avatar.Fallback>
      </Avatar.Root>
    </section>
  )
}
