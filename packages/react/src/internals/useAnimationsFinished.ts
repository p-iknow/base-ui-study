import { useAnimationFrame } from '@base-ui-study/utils/useAnimationFrame'
import { useStableCallback } from '@base-ui-study/utils/useStableCallback'
import * as React from 'react'

declare global {
  var BASE_UI_ANIMATIONS_DISABLED: boolean | undefined
}

export function useAnimationsFinished(
  elementOrRef: React.RefObject<HTMLElement | null> | HTMLElement | null,
  waitForStartingStyleRemoved = false,
  treatAbortedAsFinished = true,
) {
  const frame = useAnimationFrame()

  return useStableCallback(
    (callback: () => void, signal: AbortSignal | null = null) => {
      frame.cancel()

      const element =
        elementOrRef && 'current' in elementOrRef
          ? elementOrRef.current
          : elementOrRef

      if (!element) {
        return
      }

      if (
        typeof element.getAnimations !== 'function' ||
        globalThis.BASE_UI_ANIMATIONS_DISABLED
      ) {
        callback()
        return
      }

      const run = () => {
        Promise.all(
          element.getAnimations().map((animation) => animation.finished),
        )
          .then(() => {
            if (!signal?.aborted) {
              callback()
            }
          })
          .catch(() => {
            if (treatAbortedAsFinished) {
              if (!signal?.aborted) {
                callback()
              }
              return
            }

            const activeAnimations = element.getAnimations()
            if (
              !signal?.aborted &&
              activeAnimations.some(
                (animation) =>
                  animation.pending || animation.playState !== 'finished',
              )
            ) {
              run()
            }
          })
      }

      if (!waitForStartingStyleRemoved) {
        frame.request(run)
        return
      }

      if (!element.hasAttribute('data-starting-style')) {
        frame.request(run)
        return
      }

      const observer = new MutationObserver(() => {
        if (!element.hasAttribute('data-starting-style')) {
          observer.disconnect()
          run()
        }
      })

      observer.observe(element, {
        attributes: true,
        attributeFilter: ['data-starting-style'],
      })

      signal?.addEventListener('abort', () => observer.disconnect(), {
        once: true,
      })
    },
  )
}
