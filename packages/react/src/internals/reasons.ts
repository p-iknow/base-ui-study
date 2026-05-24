export const REASONS = {
  none: 'none',
} as const

export interface BaseUIEventReasons {
  none: typeof REASONS.none
}
