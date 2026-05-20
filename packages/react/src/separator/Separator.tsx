import * as React from 'react'
import type { BaseUIComponentProps, Orientation } from '../internals/types'
import { useRenderElement } from '../internals/useRenderElement'

export const Separator = React.forwardRef(function SeparatorComponent(
  componentProps: Separator.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const {
    className: _className,
    orientation = 'horizontal',
    render: _render,
    style: _style,
    ...elementProps
  } = componentProps
  const state: Separator.State = { orientation }

  return useRenderElement('div', componentProps, {
    state,
    ref: forwardedRef,
    props: [
      {
        role: 'separator',
        'aria-orientation': orientation,
      },
      elementProps,
    ],
  })
})

export interface SeparatorProps
  extends BaseUIComponentProps<'div', SeparatorState> {
  orientation?: Orientation
}

export interface SeparatorState {
  orientation: Orientation
}

export namespace Separator {
  export type Props = SeparatorProps
  export type State = SeparatorState
}
