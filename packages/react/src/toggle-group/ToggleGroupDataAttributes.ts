export const ToggleGroupDataAttributes = {
  disabled: 'data-disabled',
  multiple: 'data-multiple',
  orientation: 'data-orientation',
} as const

export type ToggleGroupDataAttributes =
  (typeof ToggleGroupDataAttributes)[keyof typeof ToggleGroupDataAttributes]
