import { useMergedRefs } from '@base-ui-study/utils/useMergedRefs'
import * as React from 'react'
import type { StateAttributesMapping } from '../getStateAttributesProps'
import type { BaseUIComponentProps } from '../types'
import { useRenderElement } from '../useRenderElement'
import { CompositeContext } from './CompositeContext'

export interface CompositeItemProps<
  TagName extends keyof React.JSX.IntrinsicElements,
  State extends object,
  ElementType extends HTMLElement,
> {
  className?: BaseUIComponentProps<TagName, State>['className']
  props?: Array<React.JSX.IntrinsicElements[TagName] | undefined>
  refs?: Array<React.Ref<ElementType> | undefined>
  render?: BaseUIComponentProps<TagName, State>['render']
  state: State
  stateAttributesMapping?: StateAttributesMapping<State>
  style?: BaseUIComponentProps<TagName, State>['style']
  tag: TagName
}

export function CompositeItem<
  TagName extends keyof React.JSX.IntrinsicElements,
  State extends object,
  ElementType extends HTMLElement,
>(componentProps: CompositeItemProps<TagName, State, ElementType>) {
  const { props, refs, state, stateAttributesMapping, tag } = componentProps
  const context = React.useContext(CompositeContext)
  const itemRef = React.useRef<ElementType | null>(null)
  const mergedRef = useMergedRefs<ElementType>(
    (element) => {
      itemRef.current = element
    },
    refs?.[0],
    refs?.[1],
    refs?.[2],
  )

  React.useEffect(() => {
    const element = itemRef.current
    if (!context || !element) {
      return undefined
    }

    return context.registerItem(element)
  }, [context])

  return useRenderElement(
    tag,
    componentProps as unknown as BaseUIComponentProps<TagName, State>,
    {
      state,
      ref: mergedRef,
      props,
      stateAttributesMapping,
    },
  )
}
