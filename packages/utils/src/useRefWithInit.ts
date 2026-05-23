import * as React from 'react'

const UNINITIALIZED = {}

export function useRefWithInit<T>(init: () => T): React.RefObject<T>
export function useRefWithInit<T, U>(
  init: (arg: U) => T,
  initArg: U,
): React.RefObject<T>
export function useRefWithInit(
  init: (arg?: unknown) => unknown,
  initArg?: unknown,
) {
  const ref = React.useRef(UNINITIALIZED as never)

  if (ref.current === UNINITIALIZED) {
    ref.current = init(initArg) as never
  }

  return ref
}
