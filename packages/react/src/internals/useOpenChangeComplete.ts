import { useStableCallback } from '@base-ui-study/utils/useStableCallback'
import * as React from 'react'
import { useAnimationsFinished } from './useAnimationsFinished'

export function useOpenChangeComplete(
  parameters: UseOpenChangeCompleteParameters,
) {
  const { enabled = true, open, ref, onComplete: onCompleteParam } = parameters
  const onComplete = useStableCallback(onCompleteParam)
  const runOnceAnimationsFinish = useAnimationsFinished(ref, open, false)

  React.useEffect(() => {
    if (!enabled) {
      return undefined
    }

    const abortController = new AbortController()
    runOnceAnimationsFinish(onComplete, abortController.signal)

    return () => {
      abortController.abort()
    }
  }, [enabled, open, onComplete, runOnceAnimationsFinish])
}

export interface UseOpenChangeCompleteParameters {
  enabled?: boolean
  open?: boolean
  ref: React.RefObject<HTMLElement | null>
  onComplete: () => void
}
