import { describe, expect, it, vi } from 'vitest';

import {
  waitForVideoFrames,
  type VideoFrameSource,
} from 'morpheus/casts/components/videoPresentation';

function frameCallbackVideo() {
  let callback: VideoFrameRequestCallback | undefined;
  const cancelVideoFrameCallback = vi.fn();
  const video: VideoFrameSource = {
    requestVideoFrameCallback: vi.fn((nextCallback) => {
      callback = nextCallback;
      return 17;
    }),
    cancelVideoFrameCallback,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  };

  return {
    video,
    cancelVideoFrameCallback,
    presentFrame() {
      const currentCallback = callback;
      callback = undefined;
      currentCallback?.(0, {
        expectedDisplayTime: 0,
        height: 200,
        mediaTime: 0,
        presentationTime: 0,
        presentedFrames: 1,
        processingDuration: 0,
        width: 320,
      });
    },
  };
}

describe('video presentation readiness', () => {
  it('does not report readiness until the browser presents a decoded frame', () => {
    const { video, presentFrame } = frameCallbackVideo();
    const onPresented = vi.fn();

    waitForVideoFrames(video, 2, onPresented);
    expect(onPresented).not.toHaveBeenCalled();

    presentFrame();
    expect(onPresented).not.toHaveBeenCalled();

    presentFrame();
    expect(onPresented).toHaveBeenCalledOnce();
  });

  it('cancels an obsolete pending frame callback', () => {
    const { video, cancelVideoFrameCallback, presentFrame } =
      frameCallbackVideo();
    const onPresented = vi.fn();

    const cancel = waitForVideoFrames(video, 2, onPresented);
    cancel();
    presentFrame();

    expect(cancelVideoFrameCallback).toHaveBeenCalledWith(17);
    expect(onPresented).not.toHaveBeenCalled();
  });

  it('falls back to the first playback time update', () => {
    let timeUpdateListener: EventListenerOrEventListenerObject | undefined;
    const video: VideoFrameSource = {
      addEventListener: vi.fn((type, listener) => {
        if (type === 'timeupdate') timeUpdateListener = listener;
      }),
      removeEventListener: vi.fn(),
    };
    const onPresented = vi.fn();

    waitForVideoFrames(video, 2, onPresented);
    expect(onPresented).not.toHaveBeenCalled();

    if (typeof timeUpdateListener === 'function') {
      timeUpdateListener(new Event('timeupdate'));
    }
    expect(onPresented).toHaveBeenCalledOnce();
  });
});
