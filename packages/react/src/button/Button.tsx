import * as React from 'react'
import type {
  BaseUIComponentProps,
  NativeButtonProps,
} from '../internals/types'
import { useButton } from '../internals/use-button'
import { useRenderElement } from '../internals/useRenderElement'

export const Button = React.forwardRef(function ButtonComponent(
  componentProps: Button.Props,
  forwardedRef: React.ForwardedRef<HTMLElement>,
) {
  const {
    className: _className,
    disabled = false,
    focusableWhenDisabled = false,
    nativeButton = true,
    render: _render,
    style: _style,
    ...elementProps
  } = componentProps

  const { getButtonProps, buttonRef } = useButton({
    disabled,
    focusableWhenDisabled,
    native: nativeButton,
  })

  const state: Button.State = { disabled }

  return useRenderElement('button', componentProps, {
    state,
    ref: [forwardedRef, buttonRef],
    props: getButtonProps(elementProps),
  })
})

export interface ButtonProps
  extends NativeButtonProps, BaseUIComponentProps<'button', ButtonState> {
  disabled?: boolean
  focusableWhenDisabled?: boolean
}

export interface ButtonState {
  disabled: boolean
}

export namespace Button {
  export type Props = ButtonProps
  export type State = ButtonState
}
