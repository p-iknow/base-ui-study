import { useOnMount } from './useOnMount'
import { useRefWithInit } from './useRefWithInit'

type TimeoutId = ReturnType<typeof setTimeout>

export class Timeout {
  static create() {
    return new Timeout()
  }

  currentId: TimeoutId | null = null

  start(delay: number, callback: () => void) {
    this.clear()
    this.currentId = setTimeout(() => {
      this.currentId = null
      callback()
    }, delay)
  }

  clear = () => {
    if (this.currentId !== null) {
      clearTimeout(this.currentId)
      this.currentId = null
    }
  }

  disposeEffect = () => {
    return this.clear
  }
}

export function useTimeout() {
  const timeout = useRefWithInit(Timeout.create).current
  useOnMount(timeout.disposeEffect)
  return timeout
}
