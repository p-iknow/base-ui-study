import { AnimationFrame } from '@base-ui-study/utils/useAnimationFrame'
import { useIsoLayoutEffect } from '@base-ui-study/utils/useIsoLayoutEffect'
import * as React from 'react'

export type TransitionStatus = 'starting' | 'ending' | 'idle' | undefined

export function useTransitionStatus(open: boolean) {
  const [mounted, setMounted] = React.useState(open)
  const [transitionStatus, setTransitionStatus] =
    React.useState<TransitionStatus>(undefined)

  // 새 `open` 값이 반영되는 commit 전에 mount/unmount transition 상태를
  // 보정해야 하므로 render 중에 갱신한다. render-phase update loop를
  // 피하려면 각 분기가 다음 render에서 반드시 수렴해야 한다.
  if (open && !mounted) {
    setMounted(true)
    setTransitionStatus('starting')
  }

  if (!open && mounted && transitionStatus !== 'ending') {
    setTransitionStatus('ending')
  }

  if (!open && !mounted && transitionStatus === 'ending') {
    setTransitionStatus(undefined)
  }

  useIsoLayoutEffect(() => {
    if (!open) {
      return undefined
    }

    const frame = AnimationFrame.request(() => {
      setTransitionStatus(undefined)
    })

    return () => {
      AnimationFrame.cancel(frame)
    }
  }, [open])

  return {
    mounted,
    setMounted,
    transitionStatus,
  }
}
