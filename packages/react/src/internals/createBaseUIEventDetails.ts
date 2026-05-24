export interface BaseUIChangeEventDetails<Reason extends string> {
  cancel: () => void
  isCanceled: boolean
  originalEvent: Event | null
  reason: Reason
}

export function createBaseUIEventDetails<Reason extends string>(
  reason: Reason,
  originalEvent: Event | null,
): BaseUIChangeEventDetails<Reason> {
  return {
    cancel() {
      this.isCanceled = true
    },
    isCanceled: false,
    originalEvent,
    reason,
  }
}
