import { isElementDisabled } from '@base-ui-study/utils/isElementDisabled'
import * as React from 'react'

export type InteractionType = 'mouse' | 'touch' | 'pen' | 'keyboard' | ''

export function useEnhancedClickHandler(
  handler: (
    event: React.MouseEvent | React.PointerEvent,
    interactionType: InteractionType,
  ) => void,
) {
  const lastPointerTypeRef = React.useRef<InteractionType>('')

  const onPointerDown = React.useCallback(
    (event: React.PointerEvent) => {
      if (isElementDisabled(event.currentTarget as HTMLElement)) {
        event.preventDefault()
        return
      }

      lastPointerTypeRef.current = event.pointerType as InteractionType
      handler(event, lastPointerTypeRef.current)
    },
    [handler],
  )

  const onClick = React.useCallback(
    (event: React.MouseEvent | React.PointerEvent) => {
      if (isElementDisabled(event.currentTarget as HTMLElement)) {
        event.preventDefault()
        return
      }

      if (event.detail === 0) {
        handler(event, 'keyboard')
      } else if ('pointerType' in event) {
        handler(event, event.pointerType as InteractionType)
      } else {
        handler(event, lastPointerTypeRef.current)
      }

      lastPointerTypeRef.current = ''
    },
    [handler],
  )

  return { onClick, onPointerDown }
}
