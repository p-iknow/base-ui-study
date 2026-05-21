type Cleanup = false | null | undefined | (() => void)

export function mergeCleanups(...cleanups: Cleanup[]) {
  return () => {
    cleanups.forEach((cleanup) => {
      if (cleanup) {
        cleanup()
      }
    })
  }
}
