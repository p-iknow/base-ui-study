import * as React from 'react'
import type { BaseUIChangeEventDetails } from '../internals/createBaseUIEventDetails'
import type { BaseUIEventReasons } from '../internals/reasons'
import type { Orientation } from '../internals/types'

export interface ToggleGroupContext<Value> {
  disabled: boolean
  isValueInitialized: boolean
  orientation: Orientation
  setGroupValue: (
    newValue: Value,
    nextPressed: boolean,
    eventDetails: BaseUIChangeEventDetails<BaseUIEventReasons['none']>,
  ) => void
  value: readonly Value[]
}

export const ToggleGroupContext = React.createContext<
  ToggleGroupContext<any> | undefined
>(undefined)

export function useToggleGroupContext<Value>(optional = true) {
  const context = React.useContext<ToggleGroupContext<Value> | undefined>(
    ToggleGroupContext,
  )

  if (context === undefined && !optional) {
    throw new Error(
      'Base UI: ToggleGroupContext is missing. ToggleGroup parts must be placed within <ToggleGroup>.',
    )
  }

  return context
}
