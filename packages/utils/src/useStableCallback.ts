import * as React from 'react'
import { useIsoLayoutEffect } from './useIsoLayoutEffect'

type Callback = (...args: never[]) => unknown

export function useStableCallback<T extends Callback>(callback: T | undefined): T {
  const callbackRef = React.useRef(callback)

  useIsoLayoutEffect(() => {
    callbackRef.current = callback
  })

  return React.useMemo(
    () =>
      ((...args: Parameters<T>) => {
        return callbackRef.current?.(...args)
      }) as T,
    [],
  )
}
