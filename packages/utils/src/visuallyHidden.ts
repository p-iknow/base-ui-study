import type * as React from 'react'

export const visuallyHidden: React.CSSProperties = {
  border: 0,
  clip: 'rect(0 0 0 0)',
  height: 1,
  margin: -1,
  overflow: 'hidden',
  padding: 0,
  position: 'absolute',
  whiteSpace: 'nowrap',
  width: 1,
}

export const visuallyHiddenInput: React.CSSProperties = {
  ...visuallyHidden,
  left: 0,
  opacity: 0,
}
