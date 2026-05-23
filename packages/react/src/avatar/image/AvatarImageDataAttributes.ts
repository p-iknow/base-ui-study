import { TransitionStatusDataAttributes } from '../../internals/stateAttributesMapping'

export const AvatarImageDataAttributes = {
  startingStyle: TransitionStatusDataAttributes.startingStyle,
  endingStyle: TransitionStatusDataAttributes.endingStyle,
} as const

export type AvatarImageDataAttributes =
  (typeof AvatarImageDataAttributes)[keyof typeof AvatarImageDataAttributes]
