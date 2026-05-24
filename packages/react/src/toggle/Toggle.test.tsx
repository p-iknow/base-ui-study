// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest'
import * as React from 'react'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { Toggle } from './Toggle'
import { ToggleGroup } from '../toggle-group/ToggleGroup'

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

function getButtons() {
  return Array.from(document.querySelectorAll('button')) as HTMLButtonElement[]
}

describe('Toggle', () => {
  it('reflects controlled pressed changes', () => {
    function App() {
      const [pressed, setPressed] = React.useState(false)
      return (
        <>
          <button type="button" onClick={() => setPressed(true)}>
            set pressed
          </button>
          <Toggle pressed={pressed}>toggle</Toggle>
        </>
      )
    }

    render(<App />)
    const [control, toggle] = getButtons()

    expect(toggle.getAttribute('aria-pressed')).toBe('false')

    act(() => control.click())

    expect(toggle.getAttribute('aria-pressed')).toBe('true')
    expect(toggle.hasAttribute('data-pressed')).toBe(true)
  })

  it('toggles uncontrolled state and calls onPressedChange', () => {
    const onPressedChange = vi.fn()
    render(
      <Toggle defaultPressed={false} onPressedChange={onPressedChange}>
        toggle
      </Toggle>,
    )
    const [toggle] = getButtons()

    act(() => toggle.click())

    expect(toggle.getAttribute('aria-pressed')).toBe('true')
    expect(onPressedChange).toHaveBeenCalledWith(
      true,
      expect.objectContaining({ reason: 'none' }),
    )
  })

  it('does not change uncontrolled state when details are canceled', () => {
    render(
      <Toggle
        defaultPressed={false}
        onPressedChange={(_, details) => details.cancel()}
      >
        toggle
      </Toggle>,
    )
    const [toggle] = getButtons()

    act(() => toggle.click())

    expect(toggle.getAttribute('aria-pressed')).toBe('false')
  })

  it('does not activate when disabled', () => {
    const onPressedChange = vi.fn()
    render(
      <Toggle disabled onPressedChange={onPressedChange}>
        toggle
      </Toggle>,
    )
    const [toggle] = getButtons()

    expect(toggle.disabled).toBe(true)
    expect(toggle.hasAttribute('data-disabled')).toBe(true)

    act(() => toggle.click())

    expect(onPressedChange).not.toHaveBeenCalled()
    expect(toggle.getAttribute('aria-pressed')).toBe('false')
  })

  it('supports forwarded refs', () => {
    const ref = React.createRef<HTMLButtonElement>()

    render(<Toggle ref={ref}>toggle</Toggle>)

    expect(ref.current).toBeInstanceOf(HTMLButtonElement)
  })

  it('uses custom button semantics for non-native renders', () => {
    render(
      <Toggle nativeButton={false} render={<a href="#toggle">toggle</a>} />,
    )
    const link = document.querySelector('a')

    expect(link?.getAttribute('role')).toBe('button')
    expect(link?.getAttribute('tabindex')).toBe('0')
  })
})

describe('ToggleGroup', () => {
  it('renders a group with defaultValue pressed state', () => {
    render(
      <ToggleGroup aria-label="alignment" defaultValue={['right']}>
        <Toggle value="left">left</Toggle>
        <Toggle value="right">right</Toggle>
      </ToggleGroup>,
    )
    const group = document.querySelector('[role="group"]')
    const [left, right] = getButtons()

    expect(group?.getAttribute('aria-label')).toBe('alignment')
    expect(left.getAttribute('aria-pressed')).toBe('false')
    expect(right.getAttribute('aria-pressed')).toBe('true')
  })

  it('warns when an initialized group contains a toggle without a value', () => {
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined)

    render(
      <ToggleGroup defaultValue={['left']}>
        <Toggle>left</Toggle>
      </ToggleGroup>,
    )

    expect(consoleError).toHaveBeenCalledWith(
      expect.stringContaining(
        'A `<Toggle>` component rendered in a `<ToggleGroup>` has no explicit `value` prop.',
      ),
    )
  })

  it('keeps one pressed item when multiple is false', () => {
    render(
      <ToggleGroup defaultValue={['left']}>
        <Toggle value="left">left</Toggle>
        <Toggle value="right">right</Toggle>
      </ToggleGroup>,
    )
    const [left, right] = getButtons()

    act(() => right.click())

    expect(left.getAttribute('aria-pressed')).toBe('false')
    expect(right.getAttribute('aria-pressed')).toBe('true')
  })

  it('allows multiple pressed items when multiple is true', () => {
    render(
      <ToggleGroup defaultValue={['left']} multiple>
        <Toggle value="left">left</Toggle>
        <Toggle value="right">right</Toggle>
      </ToggleGroup>,
    )
    const [left, right] = getButtons()

    act(() => right.click())

    expect(left.getAttribute('aria-pressed')).toBe('true')
    expect(right.getAttribute('aria-pressed')).toBe('true')
  })

  it('does not update group state when onValueChange cancels details', () => {
    const onValueChange = vi.fn((_, details: ToggleGroup.ChangeEventDetails) =>
      details.cancel(),
    )
    render(
      <ToggleGroup onValueChange={onValueChange}>
        <Toggle value="left">left</Toggle>
      </ToggleGroup>,
    )
    const [left] = getButtons()

    act(() => left.click())

    expect(onValueChange).toHaveBeenCalledWith(
      ['left'],
      expect.objectContaining({ reason: 'none' }),
    )
    expect(left.getAttribute('aria-pressed')).toBe('false')
  })

  it('inherits disabled state from the group', () => {
    render(
      <ToggleGroup disabled>
        <Toggle value="left">left</Toggle>
      </ToggleGroup>,
    )
    const [left] = getButtons()

    expect(left.disabled).toBe(true)
    expect(left.hasAttribute('data-disabled')).toBe(true)
  })

  it('moves focus with orientation keys, Home, End, and loopFocus', () => {
    render(
      <ToggleGroup>
        <Toggle value="one">one</Toggle>
        <Toggle value="two">two</Toggle>
        <Toggle value="three">three</Toggle>
      </ToggleGroup>,
    )
    const [one, two, three] = getButtons()
    one.focus()

    act(() => {
      one.dispatchEvent(
        new KeyboardEvent('keydown', { bubbles: true, key: 'ArrowRight' }),
      )
    })
    expect(document.activeElement).toBe(two)

    act(() => {
      two.dispatchEvent(
        new KeyboardEvent('keydown', { bubbles: true, key: 'End' }),
      )
    })
    expect(document.activeElement).toBe(three)

    act(() => {
      three.dispatchEvent(
        new KeyboardEvent('keydown', { bubbles: true, key: 'ArrowRight' }),
      )
    })
    expect(document.activeElement).toBe(one)

    act(() => {
      one.dispatchEvent(
        new KeyboardEvent('keydown', { bubbles: true, key: 'Home' }),
      )
    })
    expect(document.activeElement).toBe(one)
  })
})
