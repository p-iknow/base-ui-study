export const ButtonDataAttributes = {
  disabled: 'data-disabled',
} as const

export type ButtonDataAttributes =
  (typeof ButtonDataAttributes)[keyof typeof ButtonDataAttributes]
