export const SwitchThumbDataAttributes = {
  checked: 'data-checked',
  disabled: 'data-disabled',
  readOnly: 'data-readonly',
  required: 'data-required',
  unchecked: 'data-unchecked',
} as const

export type SwitchThumbDataAttributes =
  (typeof SwitchThumbDataAttributes)[keyof typeof SwitchThumbDataAttributes]
