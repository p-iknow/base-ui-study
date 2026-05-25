import * as React from 'react'
import type { BaseUIComponentProps } from '../../internals/types'
import { useRenderElement } from '../../internals/useRenderElement'
import type { SwitchRootState } from '../root/SwitchRoot'
import { useSwitchRootContext } from '../root/SwitchRootContext'
import { stateAttributesMapping } from '../stateAttributesMapping'

export const SwitchThumb = React.forwardRef(function SwitchThumbComponent(
  componentProps: SwitchThumb.Props,
  forwardedRef: React.ForwardedRef<HTMLSpanElement>,
) {
  const {
    className: _className,
    render: _render,
    style: _style,
    ...elementProps
  } = componentProps
  const state = useSwitchRootContext()

  return useRenderElement('span', componentProps, {
    state,
    ref: forwardedRef,
    props: elementProps,
    stateAttributesMapping,
  })
})

export interface SwitchThumbProps extends BaseUIComponentProps<
  'span',
  SwitchThumbState
> {}

export interface SwitchThumbState extends SwitchRootState {}

export namespace SwitchThumb {
  export type Props = SwitchThumbProps
  export type State = SwitchThumbState
}
