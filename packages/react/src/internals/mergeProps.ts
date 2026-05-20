import * as React from 'react'

type AnyProps = Record<string, unknown>

export function mergeProps(...propSets: Array<object | undefined>) {
  const merged: AnyProps = {}

  for (const propSet of propSets) {
    if (!propSet) {
      continue
    }

    const props = propSet as AnyProps

    for (const key of Object.keys(props)) {
      const nextValue = props[key]
      const previousValue = merged[key]

      if (
        /^on[A-Z]/.test(key) &&
        typeof previousValue === 'function' &&
        typeof nextValue === 'function'
      ) {
        merged[key] = (event: React.SyntheticEvent) => {
          previousValue(event)

          if (!event.defaultPrevented) {
            nextValue(event)
          }
        }
      } else if (key === 'className' && previousValue && nextValue) {
        merged[key] = `${previousValue} ${nextValue}`
      } else if (key === 'style' && previousValue && nextValue) {
        merged[key] = { ...previousValue, ...nextValue }
      } else if (nextValue !== undefined) {
        merged[key] = nextValue
      }
    }
  }

  return merged
}
