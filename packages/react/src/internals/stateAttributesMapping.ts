import type { StateAttributesMapping } from './getStateAttributesProps'
import type { TransitionStatus } from './useTransitionStatus'

export const TransitionStatusDataAttributes = {
  startingStyle: 'data-starting-style',
  endingStyle: 'data-ending-style',
} as const

export type TransitionStatusDataAttributes =
  (typeof TransitionStatusDataAttributes)[keyof typeof TransitionStatusDataAttributes]

const STARTING_STYLE = { [TransitionStatusDataAttributes.startingStyle]: '' }
const ENDING_STYLE = { [TransitionStatusDataAttributes.endingStyle]: '' }

export const transitionStatusMapping = {
  transitionStatus(value): Record<string, string> | null {
    if (value === 'starting') {
      return STARTING_STYLE
    }

    if (value === 'ending') {
      return ENDING_STYLE
    }

    return null
  },
} satisfies StateAttributesMapping<{ transitionStatus: TransitionStatus }>
