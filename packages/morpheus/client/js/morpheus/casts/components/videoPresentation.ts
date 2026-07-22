export type CancelVideoFrameWait = () => void

export interface VideoFrameSource {
  requestVideoFrameCallback?: (callback: VideoFrameRequestCallback) => number
  cancelVideoFrameCallback?: (callbackId: number) => void
  addEventListener: (
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions
  ) => void
  removeEventListener: (
    type: string,
    listener: EventListenerOrEventListenerObject
  ) => void
}

/**
 * Wait until the browser has submitted decoded video frames for presentation.
 * Media readiness events only describe buffering and can fire before drawImage()
 * has a usable playback frame.
 */
export function waitForVideoFrames(
  video: VideoFrameSource,
  frameCount: number,
  onPresented: () => void
): CancelVideoFrameWait {
  let active = true

  const finish = () => {
    if (!active) return
    active = false
    onPresented()
  }

  if (typeof video.requestVideoFrameCallback === 'function') {
    let remainingFrames = Math.max(1, frameCount)
    let callbackId: number | undefined
    const handleFrame = () => {
      if (!active) return
      remainingFrames -= 1
      if (remainingFrames === 0) {
        finish()
      } else {
        callbackId = video.requestVideoFrameCallback?.(handleFrame)
      }
    }
    callbackId = video.requestVideoFrameCallback(handleFrame)
    return () => {
      if (!active) return
      active = false
      if (callbackId !== undefined) {
        video.cancelVideoFrameCallback?.(callbackId)
      }
    }
  }

  const handleTimeUpdate = () => finish()
  video.addEventListener('timeupdate', handleTimeUpdate, { once: true })

  return () => {
    if (!active) return
    active = false
    video.removeEventListener('timeupdate', handleTimeUpdate)
  }
}
