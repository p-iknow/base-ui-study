import { useMergedRefs } from '@base-ui-study/utils/useMergedRefs'
import * as React from 'react'
import { mergeClassNames, mergeProps } from '../merge-props/mergeProps'
import { getStateAttributesProps, type StateAttributesMapping } from './getStateAttributesProps'
import type { BaseUIComponentProps } from './types'

type IntrinsicTagName = keyof React.JSX.IntrinsicElements

type RenderFunctionProps<TagName extends IntrinsicTagName> = React.JSX.IntrinsicElements[TagName]

export type UseRenderElementParameters<
  State extends object,
  RenderedElementType extends Element,
  TagName extends IntrinsicTagName,
> = {
  props?: RenderFunctionProps<TagName> | Array<RenderFunctionProps<TagName> | undefined>
  ref?: React.Ref<RenderedElementType> | Array<React.Ref<RenderedElementType> | undefined>
  state?: State
  stateAttributesMapping?: StateAttributesMapping<State>
}

export function useRenderElement<
  State extends object,
  RenderedElementType extends Element,
  TagName extends IntrinsicTagName,
>(
  element: TagName,
  componentProps: BaseUIComponentProps<TagName, State>,
  params: UseRenderElementParameters<State, RenderedElementType, TagName> = {},
) {
  const { className: classNameProp, render, style: styleProp } = componentProps
  const state = params.state ?? ({} as State)
  const renderElementRef = React.isValidElement(render) ? getReactElementRef(render) : undefined
  const refs = Array.isArray(params.ref) ? params.ref : [params.ref]
  const mergedRef = useMergedRefs(
    refs[0],
    refs[1] ?? renderElementRef,
    refs[1] ? renderElementRef : undefined,
    refs[2],
  )

  const resolvedProps = Array.isArray(params.props)
    ? mergeProps<TagName>(
        ...(params.props as Array<React.ComponentPropsWithoutRef<TagName> | undefined>),
      )
    : mergeProps<TagName>(params.props as React.ComponentPropsWithoutRef<TagName> | undefined)

  const outProps = {
    ...getStateAttributesProps(state, params.stateAttributesMapping),
    ...resolvedProps,
  } as React.HTMLAttributes<HTMLElement> & React.RefAttributes<RenderedElementType>

  const className = resolveValue(classNameProp, state)
  if (className !== undefined) {
    outProps.className = mergeClassNames(outProps.className, className)
  }

  const style = resolveValue(styleProp, state)
  if (style !== undefined) {
    outProps.style = {
      ...outProps.style,
      ...style,
    }
  }

  outProps.ref = mergedRef

  if (typeof render === 'function') {
    return render(outProps, state)
  }

  if (React.isValidElement(render)) {
    const clonedProps = mergeProps(outProps, render.props as React.HTMLAttributes<HTMLElement>)
    clonedProps.ref = mergedRef
    return React.cloneElement(render, clonedProps)
  }

  return React.createElement(element, outProps)
}

function resolveValue<Value, State>(
  value: Value | ((state: State) => Value | undefined) | undefined,
  state: State,
) {
  if (typeof value === 'function') {
    return (value as (state: State) => Value | undefined)(state)
  }

  return value
}

function getReactElementRef<T>(element: React.ReactElement): React.Ref<T> | undefined {
  return (element.props as { ref?: React.Ref<T> }).ref
}
