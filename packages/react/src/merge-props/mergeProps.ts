import type * as React from 'react'
import type { BaseUIEvent } from '../internals/types'

type ElementType = React.ElementType
type PropsOf<T extends ElementType> = React.ComponentPropsWithoutRef<T> &
  React.RefAttributes<unknown>
type InputProps<T extends ElementType> = PropsOf<T> | undefined

export function mergeProps<T extends ElementType>(...propsList: Array<InputProps<T>>): PropsOf<T> {
  const merged = {} as Record<string, unknown>

  propsList.forEach((props) => {
    if (!props) {
      return
    }

    Object.entries(props).forEach(([name, value]) => {
      if (name === 'className') {
        merged[name] = mergeClassNames(merged[name] as string | undefined, value as string)
        return
      }

      if (name === 'style') {
        merged[name] = {
          ...(merged[name] as React.CSSProperties | undefined),
          ...(value as React.CSSProperties | undefined),
        }
        return
      }

      if (isEventHandler(name, value)) {
        merged[name] = mergeEventHandlers(
          merged[name] as ((event: unknown) => void) | undefined,
          value,
        )
        return
      }

      merged[name] = value
    })
  })

  return merged as PropsOf<T>
}

export function mergeClassNames(
  previousClassName: string | undefined,
  nextClassName: string | undefined,
) {
  if (!nextClassName) {
    return previousClassName
  }

  if (!previousClassName) {
    return nextClassName
  }

  return `${nextClassName} ${previousClassName}`
}

function mergeEventHandlers(
  previousHandler: ((event: unknown) => void) | undefined,
  nextHandler: (event: unknown) => void,
) {
  if (!previousHandler) {
    return nextHandler
  }

  return (event: unknown) => {
    makeEventPreventable(event)
    nextHandler(event)
    if (!isEventPrevented(event)) {
      previousHandler(event)
    }
  }
}

function isEventHandler(name: string, value: unknown): value is (event: unknown) => void {
  return /^on[A-Z]/.test(name) && typeof value === 'function'
}

export function makeEventPreventable(event: unknown) {
  if (!isSyntheticEvent(event)) {
    return
  }

  const baseUIEvent = event as BaseUIEvent
  baseUIEvent.preventBaseUIHandler = () => {
    baseUIEvent.baseUIHandlerPrevented = true
  }
}

function isEventPrevented(event: unknown) {
  return (
    isSyntheticEvent(event) &&
    (event.defaultPrevented || (event as BaseUIEvent).baseUIHandlerPrevented)
  )
}

function isSyntheticEvent(event: unknown): event is React.SyntheticEvent {
  return (
    event !== null &&
    event !== undefined &&
    typeof event === 'object' &&
    'nativeEvent' in event
  )
}
