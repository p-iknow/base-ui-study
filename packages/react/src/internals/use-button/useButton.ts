import { useStableCallback } from '@base-ui-study/utils/useStableCallback'
import * as React from 'react'
import { mergeProps } from '../../merge-props'
import { useEnhancedClickHandler } from '../useEnhancedClickHandler'

export interface UseButtonParameters {
  disabled?: boolean
  focusableWhenDisabled?: boolean
  native?: boolean
  tabIndex?: number
}

export interface UseButtonReturnValue {
  getButtonProps: (
    externalProps?: React.ComponentPropsWithRef<any>,
  ) => React.ComponentPropsWithRef<any>
  buttonRef: React.Ref<HTMLElement>
}

export function useButton(parameters: UseButtonParameters = {}): UseButtonReturnValue {
  const {
    disabled = false,
    focusableWhenDisabled = false,
    native: isNativeButton = true,
    tabIndex = 0,
  } = parameters

  const elementRef = React.useRef<HTMLElement | null>(null)
  const buttonRef = useStableCallback((element: HTMLElement | null) => {
    elementRef.current = element
  })

  const handleEnhancedActivation = React.useCallback(
    (event: React.MouseEvent | React.PointerEvent) => {
      if (disabled) {
        event.preventDefault()
      }
    },
    [disabled],
  )

  const enhancedClickHandlers = useEnhancedClickHandler(handleEnhancedActivation)
  const { onClick: handleEnhancedClick, onPointerDown: handleEnhancedPointerDown } =
    enhancedClickHandlers

  const getButtonProps = React.useCallback(
    (externalProps: React.ComponentPropsWithRef<any> = {}) => {
      const { onClick, onKeyDown, onKeyUp, onPointerDown, ...otherExternalProps } = externalProps
      const baseProps: React.ComponentPropsWithRef<any> = isNativeButton
        ? { type: 'button' }
        : { role: 'button' }

      if (disabled) {
        baseProps['data-disabled'] = ''

        if (isNativeButton && !focusableWhenDisabled) {
          baseProps.disabled = true
        } else {
          baseProps['aria-disabled'] = true
          baseProps.tabIndex = focusableWhenDisabled ? tabIndex : -1
        }
      } else {
        baseProps.tabIndex = tabIndex
      }

      if (!isNativeButton && !disabled) {
        baseProps.tabIndex = tabIndex
      }

      return mergeProps<'button'>(
        {
          onClick(event: React.MouseEvent) {
            if (disabled) {
              event.preventDefault()
              return
            }

            onClick?.(event)
            if (event.defaultPrevented) {
              return
            }

            handleEnhancedClick(event)
          },
          onKeyDown(event: React.KeyboardEvent) {
            if (disabled) {
              if (event.key !== 'Tab') {
                event.preventDefault()
              }
              return
            }

            onKeyDown?.(event)
            if (event.defaultPrevented) {
              return
            }

            if (!isNativeButton && event.key === 'Enter') {
              event.preventDefault()
              ;(event.currentTarget as HTMLElement).click()
            }

            if (!isNativeButton && event.key === ' ') {
              event.preventDefault()
            }
          },
          onKeyUp(event: React.KeyboardEvent) {
            if (disabled) {
              if (event.key !== 'Tab') {
                event.preventDefault()
              }
              return
            }

            onKeyUp?.(event)
            if (event.defaultPrevented) {
              return
            }

            if (!isNativeButton && event.key === ' ') {
              ;(event.currentTarget as HTMLElement).click()
            }
          },
          onPointerDown(event: React.PointerEvent) {
            if (disabled) {
              event.preventDefault()
              return
            }

            onPointerDown?.(event)
            if (!event.defaultPrevented) {
              handleEnhancedPointerDown(event)
            }
          },
        },
        baseProps,
        otherExternalProps,
      )
    },
    [
      disabled,
      focusableWhenDisabled,
      handleEnhancedClick,
      handleEnhancedPointerDown,
      isNativeButton,
      tabIndex,
    ],
  )

  return { getButtonProps, buttonRef }
}
