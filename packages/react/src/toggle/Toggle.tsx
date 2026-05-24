import { useControlled } from '@base-ui-study/utils/useControlled'
import { useIsoLayoutEffect } from '@base-ui-study/utils/useIsoLayoutEffect'
import * as React from 'react'
import { mergeProps } from '../merge-props'
import { CompositeItem } from '../internals/composite/CompositeItem'
import {
  type BaseUIChangeEventDetails,
  createBaseUIEventDetails,
} from '../internals/createBaseUIEventDetails'
import { REASONS } from '../internals/reasons'
import type {
  BaseUIComponentProps,
  NativeButtonProps,
} from '../internals/types'
import { useButton } from '../internals/use-button'
import { useRenderElement } from '../internals/useRenderElement'
import { useToggleGroupContext } from '../toggle-group/ToggleGroupContext'

export const Toggle = React.forwardRef(function ToggleComponent<
  Value extends string,
>(
  componentProps: Toggle.Props<Value>,
  forwardedRef: React.ForwardedRef<HTMLButtonElement>,
) {
  const {
    className: _className,
    defaultPressed: defaultPressedProp = false,
    disabled: disabledProp = false,
    form: _form,
    nativeButton = true,
    onPressedChange,
    pressed: pressedProp,
    render: _render,
    style: _style,
    type: _type,
    value,
    ...elementProps
  } = componentProps

  const groupContext = useToggleGroupContext<Value>()
  const groupValue = groupContext?.value ?? []
  const disabled = Boolean(disabledProp || groupContext?.disabled)
  const groupPressed =
    groupContext && value !== undefined ? groupValue.includes(value) : undefined

  useIsoLayoutEffect(() => {
    if (
      process.env.NODE_ENV === 'production' ||
      !groupContext ||
      value !== undefined ||
      !groupContext.isValueInitialized
    ) {
      return
    }

    console.error(
      [
        'Base UI: A `<Toggle>` component rendered in a `<ToggleGroup>` has no explicit `value` prop.',
        'This will cause issues between the ToggleGroup and Toggle values.',
        'Provide the `<Toggle>` with a `value` prop matching the `<ToggleGroup>` values prop type.',
      ].join('\n'),
    )
  }, [groupContext, value])

  const [pressed, setPressedState] = useControlled<boolean>({
    controlled: groupContext ? groupPressed : pressedProp,
    default: groupContext ? undefined : defaultPressedProp,
    name: 'Toggle',
    state: 'pressed',
  })

  const { getButtonProps, buttonRef } = useButton({
    disabled,
    native: nativeButton,
  })

  const state: ToggleState = { disabled, pressed }
  const internalProps: React.ComponentPropsWithoutRef<'button'> = {
    'aria-pressed': pressed,
    onClick(event) {
      const nextPressed = !pressed
      const details = createBaseUIEventDetails(REASONS.none, event.nativeEvent)

      if (groupContext && value !== undefined) {
        groupContext.setGroupValue(value, nextPressed, details)
      }

      onPressedChange?.(nextPressed, details)

      if (!details.isCanceled) {
        setPressedState(nextPressed)
      }
    },
  }
  const buttonProps = getButtonProps(
    mergeProps<'button'>(internalProps, elementProps),
  )
  const refs = [buttonRef, forwardedRef]

  if (groupContext) {
    return (
      <CompositeItem
        className={componentProps.className}
        props={[buttonProps]}
        refs={refs}
        render={componentProps.render}
        state={state}
        style={componentProps.style}
        tag="button"
      />
    )
  }

  return useRenderElement('button', componentProps, {
    state,
    ref: refs,
    props: buttonProps,
  })
}) as {
  <Value extends string>(
    props: Toggle.Props<Value> & React.RefAttributes<HTMLButtonElement>,
  ): React.JSX.Element
}

export interface ToggleState {
  disabled: boolean
  pressed: boolean
}

export interface ToggleProps<Value extends string>
  extends NativeButtonProps, BaseUIComponentProps<'button', ToggleState> {
  defaultPressed?: boolean
  disabled?: boolean
  onPressedChange?: (
    pressed: boolean,
    eventDetails: Toggle.ChangeEventDetails,
  ) => void
  pressed?: boolean
  value?: Value
}

export type ToggleChangeEventReason = typeof REASONS.none

export type ToggleChangeEventDetails =
  BaseUIChangeEventDetails<Toggle.ChangeEventReason>

export namespace Toggle {
  export type ChangeEventDetails = ToggleChangeEventDetails
  export type ChangeEventReason = ToggleChangeEventReason
  export type Props<TValue extends string = string> = ToggleProps<TValue>
  export type State = ToggleState
}
