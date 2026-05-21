export const InputDataAttributes = {
  disabled: 'data-disabled',
  invalid: 'data-invalid',
} as const

export type InputDataAttributes = (typeof InputDataAttributes)[keyof typeof InputDataAttributes]
