// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest'
import * as React from 'react'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { Switch } from './index'

let root: Root | null = null
let container: HTMLDivElement | null = null

afterEach(() => {
  if (root) {
    act(() => root?.unmount())
  }
  vi.restoreAllMocks()
  root = null
  container?.remove()
  container = null
})

function render(element: React.ReactElement) {
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)

  act(() => {
    root?.render(element)
  })

  return container
}

function getSwitch() {
  return document.querySelector('[role="switch"]') as HTMLElement
}

function getInput() {
  return document.querySelector('input[type="checkbox"]') as HTMLInputElement
}

describe('Switch', () => {
  it('toggles uncontrolled state and state attributes when clicked', () => {
    render(
      <Switch.Root>
        <Switch.Thumb data-testid="thumb" />
      </Switch.Root>,
    )
    const switchElement = getSwitch()
    const thumb = document.querySelector('[data-testid="thumb"]')

    expect(switchElement.getAttribute('aria-checked')).toBe('false')
    expect(switchElement.hasAttribute('data-unchecked')).toBe(true)
    expect(thumb?.hasAttribute('data-unchecked')).toBe(true)

    act(() => switchElement.click())

    expect(switchElement.getAttribute('aria-checked')).toBe('true')
    expect(switchElement.hasAttribute('data-checked')).toBe(true)
    expect(thumb?.hasAttribute('data-checked')).toBe(true)
  })

  it('reflects controlled checked changes on root and thumb', () => {
    function App() {
      const [checked, setChecked] = React.useState(false)
      return (
        <>
          <button type="button" onClick={() => setChecked(true)}>
            set checked
          </button>
          <Switch.Root checked={checked}>
            <Switch.Thumb data-testid="thumb" />
          </Switch.Root>
        </>
      )
    }

    render(<App />)

    expect(getSwitch().getAttribute('aria-checked')).toBe('false')

    act(() => {
      document.querySelector('button')?.click()
    })

    expect(getSwitch().getAttribute('aria-checked')).toBe('true')
    expect(
      document
        .querySelector('[data-testid="thumb"]')
        ?.hasAttribute('data-checked'),
    ).toBe(true)
  })

  it('calls onCheckedChange with cancelable details', () => {
    const onCheckedChange = vi.fn(
      (_checked: boolean, details: Switch.Root.ChangeEventDetails) =>
        details.cancel(),
    )

    render(<Switch.Root onCheckedChange={onCheckedChange} />)

    act(() => getSwitch().click())

    expect(onCheckedChange).toHaveBeenCalledWith(
      true,
      expect.objectContaining({ reason: 'none' }),
    )
    expect(getSwitch().getAttribute('aria-checked')).toBe('false')
  })

  it('does not change when disabled or readOnly', () => {
    const onDisabledChange = vi.fn()
    const onReadOnlyChange = vi.fn()

    render(
      <>
        <Switch.Root disabled onCheckedChange={onDisabledChange} />
        <Switch.Root readOnly onCheckedChange={onReadOnlyChange} />
      </>,
    )
    const [disabledSwitch, readOnlySwitch] = Array.from(
      document.querySelectorAll('[role="switch"]'),
    ) as HTMLElement[]

    expect(disabledSwitch.getAttribute('aria-disabled')).toBe('true')
    expect(readOnlySwitch.getAttribute('aria-readonly')).toBe('true')

    act(() => {
      disabledSwitch.click()
      readOnlySwitch.click()
    })

    expect(onDisabledChange).not.toHaveBeenCalled()
    expect(onReadOnlyChange).not.toHaveBeenCalled()
    expect(disabledSwitch.getAttribute('aria-checked')).toBe('false')
    expect(readOnlySwitch.getAttribute('aria-checked')).toBe('false')
  })

  it('places form props on the hidden input instead of the root', () => {
    const inputRef = React.createRef<HTMLInputElement>()

    render(
      <Switch.Root
        inputRef={inputRef}
        name="notifications"
        required
        value="enabled"
      />,
    )

    const switchElement = getSwitch()
    const input = getInput()

    expect(switchElement.getAttribute('name')).toBeNull()
    expect(switchElement.getAttribute('value')).toBeNull()
    expect(switchElement.getAttribute('aria-required')).toBe('true')
    expect(input.name).toBe('notifications')
    expect(input.required).toBe(true)
    expect(input.value).toBe('enabled')
    expect(inputRef.current).toBe(input)
  })

  it('submits checked and unchecked values', () => {
    render(
      <form>
        <Switch.Root name="airplane" uncheckedValue="off" value="on" />
      </form>,
    )

    const form = document.querySelector('form') as HTMLFormElement

    expect(new FormData(form).get('airplane')).toBe('off')

    act(() => getSwitch().click())

    expect(new FormData(form).get('airplane')).toBe('on')
  })

  it('does not submit a default unchecked value without uncheckedValue', () => {
    render(
      <form>
        <Switch.Root name="updates" />
      </form>,
    )

    const form = document.querySelector('form') as HTMLFormElement

    expect(new FormData(form).has('updates')).toBe(false)

    act(() => getSwitch().click())

    expect(new FormData(form).get('updates')).toBe('on')
  })

  it('returns uncontrolled state to defaultChecked on form reset', async () => {
    render(
      <form>
        <Switch.Root defaultChecked name="mode" />
        <button type="reset">reset</button>
      </form>,
    )

    act(() => getSwitch().click())
    expect(getSwitch().getAttribute('aria-checked')).toBe('false')

    await act(async () => {
      document.querySelector('button')?.click()
      await new Promise((resolve) => window.setTimeout(resolve))
    })

    expect(getSwitch().getAttribute('aria-checked')).toBe('true')
  })

  it('supports label activation and forwarded refs', () => {
    const ref = React.createRef<HTMLElement>()

    render(
      <label>
        Label
        <Switch.Root ref={ref} />
      </label>,
    )

    act(() => {
      document.querySelector('label')?.click()
    })

    expect(getSwitch().getAttribute('aria-checked')).toBe('true')
    expect(ref.current).toBeInstanceOf(HTMLSpanElement)
  })

  it('supports render overrides and function className/style', () => {
    render(
      <Switch.Root
        checked
        className={(state) => (state.checked ? 'is-on' : undefined)}
        render={<a href="#switch">switch</a>}
        style={(state) => ({ opacity: state.checked ? 1 : 0.5 })}
      />,
    )

    const link = document.querySelector('a') as HTMLAnchorElement

    expect(link.getAttribute('role')).toBe('switch')
    expect(link.className).toContain('is-on')
    expect(link.style.opacity).toBe('1')
  })
})
