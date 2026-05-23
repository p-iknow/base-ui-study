import * as React from 'react'
import type { ImageLoadingStatus } from './AvatarRoot'

export interface AvatarRootContextValue {
  imageLoadingStatus: ImageLoadingStatus
  setImageLoadingStatus: React.Dispatch<
    React.SetStateAction<ImageLoadingStatus>
  >
}

export const AvatarRootContext =
  React.createContext<AvatarRootContextValue | null>(null)

export function useAvatarRootContext() {
  const context = React.useContext(AvatarRootContext)

  if (context === null) {
    throw new Error(
      'Base UI Study: Avatar parts must be placed inside <Avatar.Root>.',
    )
  }

  return context
}
