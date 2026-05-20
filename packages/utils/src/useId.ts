'use client'
import * as React from 'react'

/**
 *
 * @example <div id={useId()} />
 * @param idOverride
 * @returns {string}
 */
export function useId(idOverride?: string, prefix?: string): string {
  const reactId = React.useId()
  return idOverride ?? (prefix ? `${prefix}-${reactId}` : reactId)
}
