'use client'

import * as React from 'react'
import type { BaseComponentProps } from '../internals/useRenderElement.js'
import { useButton } from '../internals/useButton.js'
import { useRenderElement } from '../internals/useRenderElement.js'

/**
 * A study clone of Base UI's Button.
 *
 * Reference source:
 * /Users/youngchang/dev/references/base-ui/packages/react/src/button/Button.tsx
 */
export const Button = React.forwardRef(function Button(
  componentProps: ButtonProps,
  forwardedRef: React.ForwardedRef<HTMLElement>,
) {
  const {
    className,
    disabled = false,
    focusableWhenDisabled = false,
    nativeButton = true,
    render,
    style,
    ...elementProps
  } = componentProps

  const { getButtonProps, buttonRef } = useButton({
    disabled,
    focusableWhenDisabled,
    native: nativeButton,
  })

  const state: ButtonState = {
    disabled,
  }

  return useRenderElement(
    'button',
    { className, render, style },
    {
      state,
      ref: [forwardedRef, buttonRef],
      props: [elementProps, getButtonProps()],
    },
  )
})

export interface ButtonState {
  /**
   * Whether the button should ignore user interaction.
   */
  disabled: boolean
}

export interface ButtonProps
  extends
    Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'style'>,
    BaseComponentProps<ButtonState> {
  /**
   * Whether the button should be focusable when disabled.
   *
   * When true, the clone uses aria-disabled instead of the native disabled attribute.
   */
  focusableWhenDisabled?: boolean
  /**
   * Whether to render native button semantics.
   */
  nativeButton?: boolean
}

export namespace Button {
  export type State = ButtonState
  export type Props = ButtonProps
}
