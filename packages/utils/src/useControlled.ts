import * as React from 'react'

export interface UseControlledParameters<Value> {
  controlled: Value | undefined
  default: Value | undefined
  name: string
  state?: string
}

export function useControlled<Value>(
  parameters: UseControlledParameters<Value>,
): [Value, React.Dispatch<React.SetStateAction<Value>>] {
  const {
    controlled,
    default: defaultValue,
    name,
    state = 'value',
  } = parameters
  const { current: isControlled } = React.useRef(controlled !== undefined)
  const { current: initialDefaultValue } = React.useRef(defaultValue)
  const didWarnControlledSwitchRef = React.useRef(false)
  const didWarnDefaultChangeRef = React.useRef(false)
  const [valueState, setValueState] = React.useState(defaultValue as Value)

  const value = isControlled ? (controlled as Value) : valueState

  React.useEffect(() => {
    if (process.env.NODE_ENV === 'production') {
      return
    }

    const isNowControlled = controlled !== undefined
    if (
      isControlled === isNowControlled ||
      didWarnControlledSwitchRef.current
    ) {
      return
    }

    didWarnControlledSwitchRef.current = true
    console.error(
      [
        `Base UI: A component is changing the ${
          isControlled ? '' : 'un'
        }controlled ${state} state of ${name} to be ${
          isControlled ? 'un' : ''
        }controlled.`,
        'Elements should not switch from uncontrolled to controlled (or vice versa).',
        `Decide between using a controlled or uncontrolled ${name} element for the lifetime of the component.`,
        "The nature of the state is determined during the first render. It's considered controlled if the value is not `undefined`.",
      ].join('\n'),
    )
  }, [controlled, isControlled, name, state])

  React.useEffect(() => {
    if (
      process.env.NODE_ENV === 'production' ||
      isControlled ||
      didWarnDefaultChangeRef.current
    ) {
      return
    }

    if (
      serializeToDevModeString(initialDefaultValue) ===
      serializeToDevModeString(defaultValue)
    ) {
      return
    }

    didWarnDefaultChangeRef.current = true
    console.error(
      `Base UI: A component is changing the default ${state} state of an uncontrolled ${name} after being initialized. To suppress this warning opt to use a controlled ${name}.`,
    )
  }, [defaultValue, initialDefaultValue, isControlled, name, state])

  const setValueIfUncontrolled = React.useCallback(
    (nextValue: React.SetStateAction<Value>) => {
      if (!isControlled) {
        setValueState(nextValue)
      }
    },
    [isControlled],
  )

  return [value, setValueIfUncontrolled]
}

function serializeToDevModeString(input: unknown) {
  let nextId = 0
  const seen = new WeakMap<object, number>()

  try {
    const result = JSON.stringify(input, function replacer(key, value) {
      if (
        key === '_owner' &&
        this !== null &&
        typeof this === 'object' &&
        '$$typeof' in this
      ) {
        return undefined
      }

      if (typeof value === 'bigint') {
        return `__bigint__:${value}`
      }

      if (value !== null && typeof value === 'object') {
        const id = seen.get(value)
        if (id !== undefined) {
          return `__object__:${id}`
        }

        seen.set(value, nextId)
        nextId += 1
      }

      return value
    })

    return result ?? `__top__:${typeof input}`
  } catch {
    return '__unserializable__'
  }
}
