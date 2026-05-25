export const SwitchRootDataAttributes = {
  checked: 'data-checked',
  disabled: 'data-disabled',
  readOnly: 'data-readonly',
  required: 'data-required',
  unchecked: 'data-unchecked',
} as const

export type SwitchRootDataAttributes =
  (typeof SwitchRootDataAttributes)[keyof typeof SwitchRootDataAttributes]
