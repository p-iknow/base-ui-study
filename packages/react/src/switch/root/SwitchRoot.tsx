import { useControlled } from '@base-ui-study/utils/useControlled'
import { useMergedRefs } from '@base-ui-study/utils/useMergedRefs'
import {
  visuallyHidden,
  visuallyHiddenInput,
} from '@base-ui-study/utils/visuallyHidden'
import * as React from 'react'
import {
  type BaseUIChangeEventDetails,
  createBaseUIEventDetails,
} from '../../internals/createBaseUIEventDetails'
import { REASONS } from '../../internals/reasons'
import type {
  BaseUIComponentProps,
  NativeButtonProps,
} from '../../internals/types'
import { useButton } from '../../internals/use-button'
import { useRenderElement } from '../../internals/useRenderElement'
import { mergeProps } from '../../merge-props'
import { stateAttributesMapping } from '../stateAttributesMapping'
import { SwitchRootContext } from './SwitchRootContext'

export const SwitchRoot = React.forwardRef(function SwitchRootComponent(
  componentProps: SwitchRoot.Props,
  forwardedRef: React.ForwardedRef<HTMLElement>,
) {
  const {
    checked: checkedProp,
    className: _className,
    defaultChecked = false,
    disabled = false,
    form,
    id: idProp,
    inputRef: externalInputRef,
    name,
    nativeButton = false,
    onCheckedChange,
    readOnly = false,
    render: _render,
    required = false,
    style: _style,
    uncheckedValue,
    value,
    ...elementProps
  } = componentProps

  const inputRef = React.useRef<HTMLInputElement | null>(null)
  const rootRef = React.useRef<HTMLElement | null>(null)
  const generatedId = React.useId()
  const rootId = nativeButton ? idProp : `${generatedId}-switch`
  const hiddenInputId = nativeButton ? undefined : idProp

  const [checked, setCheckedState] = useControlled<boolean>({
    controlled: checkedProp,
    default: Boolean(defaultChecked),
    name: 'Switch',
    state: 'checked',
  })

  const isControlled = checkedProp !== undefined

  React.useEffect(() => {
    if (inputRef.current) {
      inputRef.current.defaultChecked = Boolean(defaultChecked)
    }
  }, [defaultChecked])

  React.useEffect(() => {
    if (isControlled) {
      return
    }

    const input = inputRef.current
    const formElement =
      input?.form ?? (form ? document.getElementById(form) : null)

    if (!formElement) {
      return
    }

    function handleReset() {
      window.setTimeout(() => {
        if (inputRef.current) {
          setCheckedState(inputRef.current.checked)
        }
      })
    }

    formElement.addEventListener('reset', handleReset)

    return () => {
      formElement.removeEventListener('reset', handleReset)
    }
  }, [form, isControlled, setCheckedState])

  const handleInputRef = useMergedRefs(inputRef, externalInputRef)
  const { getButtonProps, buttonRef } = useButton({
    disabled,
    native: nativeButton,
  })

  const state: SwitchRootState = {
    checked,
    disabled,
    readOnly,
    required,
  }

  const rootProps: React.ComponentPropsWithRef<'span'> = {
    id: rootId,
    role: 'switch',
    'aria-checked': checked,
    'aria-readonly': readOnly || undefined,
    'aria-required': required || undefined,
    onClick(event) {
      if (readOnly || disabled) {
        return
      }

      event.preventDefault()

      const input = inputRef.current
      if (!input || input.disabled || isDisabledByFieldset(input)) {
        return
      }

      input.click()
    },
  }

  const inputProps = mergeProps<'input'>(
    {
      checked,
      disabled,
      form,
      id: hiddenInputId,
      name,
      required,
      style: name ? visuallyHiddenInput : visuallyHidden,
      tabIndex: -1,
      type: 'checkbox',
      'aria-hidden': true,
      ref: handleInputRef,
      onChange(event) {
        if (event.nativeEvent.defaultPrevented) {
          return
        }

        if (readOnly) {
          event.preventDefault()
          return
        }

        const nextChecked = event.currentTarget.checked
        const details = createBaseUIEventDetails(
          REASONS.none,
          event.nativeEvent,
        )

        onCheckedChange?.(nextChecked, details)

        if (!details.isCanceled) {
          setCheckedState(nextChecked)
        }
      },
      onFocus() {
        rootRef.current?.focus()
      },
    },
    value !== undefined ? { value } : undefined,
  ) as React.ComponentPropsWithRef<'input'>

  const buttonProps = getButtonProps(
    mergeProps<'span'>(rootProps, elementProps),
  )

  const element = useRenderElement('span', componentProps, {
    state,
    ref: [forwardedRef, rootRef, buttonRef],
    props: buttonProps,
    stateAttributesMapping,
  })

  return (
    <SwitchRootContext.Provider value={state}>
      {element}
      {!checked && name && uncheckedValue !== undefined ? (
        <input form={form} name={name} type="hidden" value={uncheckedValue} />
      ) : null}
      <input {...inputProps} suppressHydrationWarning />
    </SwitchRootContext.Provider>
  )
})

function isDisabledByFieldset(input: HTMLInputElement) {
  return input.closest('fieldset:disabled') !== null
}

export interface SwitchRootState {
  checked: boolean
  disabled: boolean
  readOnly: boolean
  required: boolean
}

export interface SwitchRootProps
  extends
    NativeButtonProps,
    Omit<BaseUIComponentProps<'span', SwitchRootState>, 'onChange'> {
  checked?: boolean
  defaultChecked?: boolean
  disabled?: boolean
  form?: string
  id?: string
  inputRef?: React.Ref<HTMLInputElement>
  name?: string
  onCheckedChange?: (
    checked: boolean,
    eventDetails: SwitchRoot.ChangeEventDetails,
  ) => void
  readOnly?: boolean
  required?: boolean
  uncheckedValue?: string
  value?: string
}

export type SwitchRootChangeEventReason = typeof REASONS.none

export type SwitchRootChangeEventDetails =
  BaseUIChangeEventDetails<SwitchRoot.ChangeEventReason>

export namespace SwitchRoot {
  export type ChangeEventDetails = SwitchRootChangeEventDetails
  export type ChangeEventReason = SwitchRootChangeEventReason
  export type Props = SwitchRootProps
  export type State = SwitchRootState
}
