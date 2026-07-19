import { describe, expect, it, vi } from 'vitest';

import {
  startMediaPlayback,
  type PlayableMedia,
} from 'morpheus/casts/components/mediaPlayback';

describe('media autoplay recovery', () => {
  it('reports playback that starts successfully', async () => {
    const media: PlayableMedia = {
      play: vi.fn().mockResolvedValue(undefined),
    };

    await expect(startMediaPlayback(media)).resolves.toBe('started');
  });

  it('reports browser-policy failures as blocked without logging an error', async () => {
    const blocked = new DOMException(
      'play() failed because the user did not interact',
      'NotAllowedError',
    );
    const media: PlayableMedia = {
      play: vi.fn().mockRejectedValue(blocked),
    };
    const reportError = vi.fn();

    await expect(startMediaPlayback(media, reportError)).resolves.toBe(
      'blocked',
    );
    expect(reportError).not.toHaveBeenCalled();
  });

  it('reports unexpected playback failures and keeps them distinct from autoplay blocking', async () => {
    const failure = new Error('decoder exploded');
    const media: PlayableMedia = {
      play: vi.fn().mockRejectedValue(failure),
    };
    const reportError = vi.fn();

    await expect(startMediaPlayback(media, reportError)).resolves.toBe(
      'failed',
    );
    expect(reportError).toHaveBeenCalledWith('Video play failed:', failure);
  });
});
