import * as React from 'react'
import { composeRefs } from './composeRefs.js'
import { mergeProps } from './mergeProps.js'

export type StateResolver<TState, TValue> = TValue | ((state: TState) => TValue)

export type RenderProp<TState> =
  | React.ReactElement<Record<string, unknown>>
  | ((props: {
      state: TState
      props: Record<string, unknown>
      ref: React.RefCallback<HTMLElement>
    }) => React.ReactElement | null)

export interface BaseComponentProps<TState> {
  className?: StateResolver<TState, string | undefined>
  render?: RenderProp<TState>
  style?: StateResolver<TState, React.CSSProperties | undefined>
}

interface UseRenderElementOptions<TState> {
  props: Array<object | undefined>
  ref: Array<React.Ref<HTMLElement> | undefined>
  state: TState
}

export function useRenderElement<TState>(
  tagName: keyof React.JSX.IntrinsicElements,
  componentProps: BaseComponentProps<TState>,
  options: UseRenderElementOptions<TState>,
) {
  const { className, render, style } = componentProps
  const stateProps = {
    className: resolveStateValue(className, options.state),
    style: resolveStateValue(style, options.state),
  }
  const props = mergeProps(...options.props, stateProps)
  const ref = composeRefs(...options.ref)

  if (typeof render === 'function') {
    return render({ state: options.state, props, ref })
  }

  if (React.isValidElement(render)) {
    return React.cloneElement(render, {
      ...mergeProps(render.props, props),
      ref: composeRefs(getElementRef(render), ref),
    })
  }

  return React.createElement(tagName, { ...props, ref })
}

function resolveStateValue<TState, TValue>(
  value: StateResolver<TState, TValue> | undefined,
  state: TState,
) {
  return typeof value === 'function' ? (value as (state: TState) => TValue)(state) : value
}

function getElementRef(element: React.ReactElement) {
  return (element.props as { ref?: React.Ref<HTMLElement> }).ref
}
