import * as React from 'react'

/**
 * Extracts the `ref` from a React element.
 */
export function getReactElementRef(element: unknown): React.Ref<unknown> | null {
  if (!React.isValidElement(element)) {
    return null
  }

  const reactElement = element as React.ReactElement & { ref?: React.Ref<unknown> | undefined }
  const propsWithRef = reactElement.props as { ref?: React.Ref<unknown> | undefined } | undefined

  return propsWithRef?.ref ?? reactElement.ref ?? null
}
