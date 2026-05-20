import { describe, expect, it } from 'vitest'
import { createGreeting } from './index.js'

describe('createGreeting', () => {
  it('creates a default greeting', () => {
    expect(createGreeting({ name: 'Package Author' })).toBe('Hello, Package Author!')
  })

  it('creates a custom greeting', () => {
    expect(createGreeting({ greeting: 'Welcome', name: 'Template User' })).toBe(
      'Welcome, Template User!',
    )
  })
})
