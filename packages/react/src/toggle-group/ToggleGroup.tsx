import { useControlled } from '@base-ui-study/utils/useControlled'
import { useStableCallback } from '@base-ui-study/utils/useStableCallback'
import * as React from 'react'
import { CompositeRoot } from '../internals/composite/CompositeRoot'
import type { BaseUIChangeEventDetails } from '../internals/createBaseUIEventDetails'
import type { StateAttributesMapping } from '../internals/getStateAttributesProps'
import { REASONS } from '../internals/reasons'
import type { BaseUIComponentProps, Orientation } from '../internals/types'
import { ToggleGroupContext } from './ToggleGroupContext'
import { ToggleGroupDataAttributes } from './ToggleGroupDataAttributes'

const stateAttributesMapping = {
  multiple(value) {
    return value ? { [ToggleGroupDataAttributes.multiple]: '' } : null
  },
} satisfies StateAttributesMapping<ToggleGroupState>

export const ToggleGroup = React.forwardRef(function ToggleGroupComponent<
  Value extends string,
>(
  componentProps: ToggleGroup.Props<Value>,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const {
    className: _className,
    defaultValue: defaultValueProp,
    disabled = false,
    loopFocus = true,
    multiple = false,
    onValueChange,
    orientation = 'horizontal',
    render: _render,
    style: _style,
    value: valueProp,
    ...elementProps
  } = componentProps

  const isValueInitialized =
    valueProp !== undefined || defaultValueProp !== undefined
  const [groupValue, setValueState] = useControlled<readonly Value[]>({
    controlled: valueProp,
    default: valueProp === undefined ? (defaultValueProp ?? []) : undefined,
    name: 'ToggleGroup',
    state: 'value',
  })

  const setGroupValue = useStableCallback(
    (
      newValue: Value,
      nextPressed: boolean,
      eventDetails: BaseUIChangeEventDetails<typeof REASONS.none>,
    ) => {
      let nextGroupValue: Value[]

      if (multiple) {
        nextGroupValue = groupValue.slice() as Value[]
        const index = nextGroupValue.indexOf(newValue)

        if (nextPressed && index === -1) {
          nextGroupValue.push(newValue)
        } else if (!nextPressed && index !== -1) {
          nextGroupValue.splice(index, 1)
        }
      } else {
        nextGroupValue = nextPressed ? [newValue] : []
      }

      onValueChange?.(nextGroupValue, eventDetails)

      if (!eventDetails.isCanceled) {
        setValueState(nextGroupValue)
      }
    },
  )

  const state: ToggleGroupState = { disabled, multiple, orientation }
  const contextValue = React.useMemo<ToggleGroupContext<Value>>(
    () => ({
      disabled,
      isValueInitialized,
      orientation,
      setGroupValue,
      value: groupValue,
    }),
    [disabled, groupValue, isValueInitialized, orientation, setGroupValue],
  )

  return (
    <ToggleGroupContext.Provider value={contextValue}>
      <CompositeRoot
        className={componentProps.className}
        loopFocus={loopFocus}
        orientation={orientation}
        props={[{ role: 'group' }, elementProps]}
        refs={[forwardedRef]}
        render={componentProps.render}
        state={state}
        stateAttributesMapping={stateAttributesMapping}
        style={componentProps.style}
      />
    </ToggleGroupContext.Provider>
  )
}) as {
  <Value extends string>(
    props: ToggleGroup.Props<Value> & React.RefAttributes<HTMLDivElement>,
  ): React.JSX.Element
}

export interface ToggleGroupState {
  disabled: boolean
  multiple: boolean
  orientation: Orientation
}

export interface ToggleGroupProps<
  Value extends string,
> extends BaseUIComponentProps<'div', ToggleGroupState> {
  defaultValue?: readonly Value[]
  disabled?: boolean
  loopFocus?: boolean
  multiple?: boolean
  onValueChange?: (
    groupValue: Value[],
    eventDetails: ToggleGroup.ChangeEventDetails,
  ) => void
  orientation?: Orientation
  value?: readonly Value[]
}

export type ToggleGroupChangeEventReason = typeof REASONS.none

export type ToggleGroupChangeEventDetails =
  BaseUIChangeEventDetails<ToggleGroup.ChangeEventReason>

export namespace ToggleGroup {
  export type ChangeEventDetails = ToggleGroupChangeEventDetails
  export type ChangeEventReason = ToggleGroupChangeEventReason
  export type Props<Value extends string = string> = ToggleGroupProps<Value>
  export type State = ToggleGroupState
}
