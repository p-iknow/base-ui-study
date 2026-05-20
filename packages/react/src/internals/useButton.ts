import * as React from 'react'

interface UseButtonOptions {
  disabled: boolean
  focusableWhenDisabled: boolean
  native: boolean
}

type ButtonInteractionProps = React.HTMLAttributes<HTMLElement> & {
  'data-disabled'?: ''
  disabled?: boolean
  type?: 'button'
}

export function useButton(options: UseButtonOptions) {
  const buttonRef = React.useRef<HTMLElement | null>(null)
  const { disabled, focusableWhenDisabled, native } = options
  const trulyDisabled = disabled && native && !focusableWhenDisabled

  function preventDisabledInteraction(event: React.SyntheticEvent) {
    if (!trulyDisabled && disabled) {
      event.preventDefault()
      event.stopPropagation()
    }
  }

  return {
    buttonRef,
    getButtonProps(): ButtonInteractionProps {
      return {
        'aria-disabled': disabled && !trulyDisabled ? true : undefined,
        'data-disabled': disabled ? '' : undefined,
        disabled: trulyDisabled ? true : undefined,
        onClick: preventDisabledInteraction,
        onKeyDown: preventDisabledInteraction,
        role: native ? undefined : 'button',
        tabIndex: native ? undefined : 0,
        type: native ? 'button' : undefined,
      }
    },
  }
}
