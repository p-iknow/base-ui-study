import * as React from 'react'
import type { StateAttributesMapping } from '../getStateAttributesProps'
import type { BaseUIComponentProps, Orientation } from '../types'
import { useRenderElement } from '../useRenderElement'
import { CompositeContext } from './CompositeContext'

export interface CompositeRootProps<State extends object> {
  className?: BaseUIComponentProps<'div', State>['className']
  loopFocus?: boolean
  orientation?: Orientation
  props?: Array<React.ComponentPropsWithoutRef<'div'> | undefined>
  refs?: Array<React.Ref<HTMLDivElement> | undefined>
  render?: BaseUIComponentProps<'div', State>['render']
  state: State
  stateAttributesMapping?: StateAttributesMapping<State>
  style?: BaseUIComponentProps<'div', State>['style']
}

export function CompositeRoot<State extends object>(
  componentProps: CompositeRootProps<State>,
) {
  const {
    loopFocus = true,
    orientation = 'horizontal',
    props,
    refs,
    state,
    stateAttributesMapping,
  } = componentProps
  const itemsRef = React.useRef<HTMLElement[]>([])

  const registerItem = React.useCallback((element: HTMLElement) => {
    itemsRef.current.push(element)
    itemsRef.current.sort((a, b) => {
      const position = a.compareDocumentPosition(b)
      return position & Node.DOCUMENT_POSITION_PRECEDING ? 1 : -1
    })

    return () => {
      itemsRef.current = itemsRef.current.filter((item) => item !== element)
    }
  }, [])

  const moveFocus = React.useCallback(
    (
      currentTarget: HTMLElement,
      direction: 'first' | 'last' | 'next' | 'prev',
    ) => {
      const enabledItems = itemsRef.current.filter(
        (item) =>
          !item.hasAttribute('disabled') &&
          item.getAttribute('aria-disabled') !== 'true',
      )

      if (enabledItems.length === 0) {
        return
      }

      const currentIndex = enabledItems.indexOf(currentTarget)
      let nextIndex = currentIndex

      if (direction === 'first') {
        nextIndex = 0
      } else if (direction === 'last') {
        nextIndex = enabledItems.length - 1
      } else {
        const step = direction === 'next' ? 1 : -1
        nextIndex = currentIndex + step

        if (nextIndex < 0 || nextIndex >= enabledItems.length) {
          if (!loopFocus) {
            return
          }
          nextIndex = (nextIndex + enabledItems.length) % enabledItems.length
        }
      }

      enabledItems[nextIndex]?.focus()
    },
    [loopFocus],
  )

  const rootProps: React.ComponentPropsWithoutRef<'div'> = {
    onKeyDown(event) {
      const target = event.target
      if (!(target instanceof HTMLElement)) {
        return
      }

      const nextKey = orientation === 'horizontal' ? 'ArrowRight' : 'ArrowDown'
      const previousKey = orientation === 'horizontal' ? 'ArrowLeft' : 'ArrowUp'

      if (event.key === nextKey) {
        event.preventDefault()
        moveFocus(target, 'next')
      } else if (event.key === previousKey) {
        event.preventDefault()
        moveFocus(target, 'prev')
      } else if (event.key === 'Home') {
        event.preventDefault()
        moveFocus(target, 'first')
      } else if (event.key === 'End') {
        event.preventDefault()
        moveFocus(target, 'last')
      }
    },
  }

  const contextValue = React.useMemo(
    () => ({ loopFocus, orientation, registerItem }),
    [loopFocus, orientation, registerItem],
  )

  const element = useRenderElement('div', componentProps, {
    state,
    ref: refs,
    props: [rootProps, ...(props ?? [])],
    stateAttributesMapping,
  })

  return (
    <CompositeContext.Provider value={contextValue}>
      {element}
    </CompositeContext.Provider>
  )
}
