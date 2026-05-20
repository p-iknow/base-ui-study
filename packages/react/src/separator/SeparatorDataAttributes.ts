export const SeparatorDataAttributes = {
  orientation: 'data-orientation',
} as const

export type SeparatorDataAttributes =
  (typeof SeparatorDataAttributes)[keyof typeof SeparatorDataAttributes]
