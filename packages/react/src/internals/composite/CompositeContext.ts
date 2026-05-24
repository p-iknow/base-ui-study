import * as React from 'react'
import type { Orientation } from '../types'

export interface CompositeContextValue {
  loopFocus: boolean
  orientation: Orientation
  registerItem: (element: HTMLElement) => () => void
}

export const CompositeContext =
  React.createContext<CompositeContextValue | null>(null)
