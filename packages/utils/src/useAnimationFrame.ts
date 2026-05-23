import { useOnMount } from './useOnMount'
import { useRefWithInit } from './useRefWithInit'

type AnimationFrameId = number

const callbacks: Array<FrameRequestCallback | null> = []
let callbacksCount = 0
let isScheduled = false
let nextId = 1
let startId = 1

function tick(timestamp: number) {
  isScheduled = false

  const currentCallbacks = callbacks.splice(0)
  const currentCallbacksCount = callbacksCount
  callbacksCount = 0
  startId = nextId

  if (currentCallbacksCount > 0) {
    currentCallbacks.forEach((callback) => callback?.(timestamp))
  }
}

function requestFrame(callback: FrameRequestCallback) {
  const id = nextId
  nextId += 1
  callbacks.push(callback)
  callbacksCount += 1

  if (!isScheduled) {
    requestAnimationFrame(tick)
    isScheduled = true
  }

  return id
}

function cancelFrame(id: AnimationFrameId) {
  const index = id - startId

  if (index >= 0 && index < callbacks.length && callbacks[index] !== null) {
    callbacks[index] = null
    callbacksCount -= 1
  }
}

export class AnimationFrame {
  static create() {
    return new AnimationFrame()
  }

  static request(callback: FrameRequestCallback) {
    return requestFrame(callback)
  }

  static cancel(id: AnimationFrameId) {
    cancelFrame(id)
  }

  currentId: AnimationFrameId | null = null

  request(callback: () => void) {
    this.cancel()
    this.currentId = requestFrame(() => {
      this.currentId = null
      callback()
    })
  }

  cancel = () => {
    if (this.currentId !== null) {
      cancelFrame(this.currentId)
      this.currentId = null
    }
  }

  disposeEffect = () => {
    return this.cancel
  }
}

export function useAnimationFrame() {
  const frame = useRefWithInit(AnimationFrame.create).current
  useOnMount(frame.disposeEffect)
  return frame
}
