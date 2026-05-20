import * as React from 'react'

type InputRef<T> = React.Ref<T> | null | undefined

export function useMergedRefs<T>(
  a: InputRef<T>,
  b: InputRef<T>,
  c?: InputRef<T>,
  d?: InputRef<T>,
): React.RefCallback<T> | null {
  return React.useMemo(() => {
    if (
      (a === null || a === undefined) &&
      (b === null || b === undefined) &&
      (c === null || c === undefined) &&
      (d === null || d === undefined)
    ) {
      return null
    }

    return (instance: T | null) => {
      setRef(a, instance)
      setRef(b, instance)
      setRef(c, instance)
      setRef(d, instance)
    }
  }, [a, b, c, d])
}

function setRef<T>(ref: InputRef<T>, instance: T | null) {
  if (ref === null || ref === undefined) {
    return
  }

  if (typeof ref === 'function') {
    ref(instance)
    return
  }

  ref.current = instance
}
