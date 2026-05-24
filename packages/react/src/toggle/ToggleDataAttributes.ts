export const ToggleDataAttributes = {
  pressed: 'data-pressed',
} as const

export type ToggleDataAttributes =
  (typeof ToggleDataAttributes)[keyof typeof ToggleDataAttributes]
