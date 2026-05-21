import * as React from 'react'
import type { BaseUIComponentProps } from '../internals/types'
import { getStateAttributesProps } from '../internals/getStateAttributesProps'

export const Input = React.forwardRef(function InputComponent(
  componentProps: Input.Props,
  forwardedRef: React.ForwardedRef<HTMLInputElement>,
) {
  const {
    className,
    disabled = false,
    invalid = false,
    required = false,
    style,
    ...elementProps
  } = componentProps

  const state: Input.State = {
    disabled,
    invalid,
  }

  return (
    <input
      {...elementProps}
      {...getStateAttributesProps(state)}
      ref={forwardedRef}
      aria-invalid={invalid ? true : undefined}
      className={resolveValue(className, state)}
      disabled={disabled}
      required={required}
      style={resolveValue(style, state)}
    />
  )
})

export interface InputProps extends Omit<
  BaseUIComponentProps<'input', InputState>,
  'render'
> {
  invalid?: boolean
}

export interface InputState {
  disabled: boolean
  invalid: boolean
}

export namespace Input {
  export type Props = InputProps
  export type State = InputState
}

function resolveValue<Value, State>(
  value: Value | ((state: State) => Value | undefined) | undefined,
  state: State,
) {
  if (typeof value === 'function') {
    return (value as (state: State) => Value | undefined)(state)
  }

  return value
}
