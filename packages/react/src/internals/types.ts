import type * as React from 'react'

export type Orientation = 'horizontal' | 'vertical'

export type ComponentRenderFn<Props, State> = (props: Props, state: State) => React.ReactElement

export type BaseUIEvent<T extends React.SyntheticEvent = React.SyntheticEvent> = T & {
  baseUIHandlerPrevented?: boolean
  preventBaseUIHandler: () => void
}

export type BaseUIComponentProps<ElementType extends React.ElementType, State> = Omit<
  React.ComponentPropsWithoutRef<ElementType>,
  'className' | 'style' | 'render'
> & {
  className?: string | ((state: State) => string | undefined)
  render?: React.ReactElement | ComponentRenderFn<React.HTMLAttributes<HTMLElement>, State>
  style?: React.CSSProperties | ((state: State) => React.CSSProperties | undefined)
}

export interface NativeButtonProps {
  nativeButton?: boolean
}
