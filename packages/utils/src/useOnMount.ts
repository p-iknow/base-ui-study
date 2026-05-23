import * as React from 'react'

const EMPTY = [] as unknown[]

export function useOnMount(effect: React.EffectCallback) {
  React.useEffect(effect, EMPTY)
}
