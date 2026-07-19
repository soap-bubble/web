import { describe, expect, it } from 'vitest';

import {
  calculateControlledFrameIndex,
  countOccupiedAtlasFrames,
} from '../../../../morpheus/client/js/morpheus/casts/hooks/useRenderables/transforms';

describe('controlled movie frame selection', () => {
  it('ignores transparent padding at the end of an extracted atlas', () => {
    const pixels = new Uint8ClampedArray(5 * 4);
    pixels[3] = 255;
    pixels[7] = 255;
    pixels[11] = 255;

    expect(countOccupiedAtlasFrames(pixels, 5)).toBe(3);
  });

  it('falls back to the full atlas when occupancy cannot be detected', () => {
    expect(countOccupiedAtlasFrames(new Uint8ClampedArray(5 * 4), 5)).toBe(5);
  });

  it('maps cannon X values within each physical Y row', () => {
    const frameFor = (value: number) =>
      calculateControlledFrameIndex({
        value,
        maxValue: 63,
        frames: 1,
        frameCount: 240,
        direction: 0,
        logicalGridWidth: 8,
      });

    expect(frameFor(0)).toBe(0);
    expect(frameFor(7)).toBe(29);
    expect(frameFor(8)).toBe(30);
    expect(frameFor(63)).toBe(239);
  });

  it('keeps X fixed when the composite value advances to the next Y row', () => {
    const frameFor = (value: number) =>
      calculateControlledFrameIndex({
        value,
        maxValue: 63,
        frames: 1,
        frameCount: 240,
        direction: 0,
        logicalGridWidth: 8,
      });

    expect(frameFor(3)).toBe(12);
    expect(frameFor(11)).toBe(42);
  });

  it('spreads the launch lever states over its full extracted movie', () => {
    expect(
      calculateControlledFrameIndex({
        value: 8,
        maxValue: 20,
        frames: 1,
        frameCount: 33,
        direction: 0,
      }),
    ).toBe(13);
    expect(
      calculateControlledFrameIndex({
        value: 20,
        maxValue: 20,
        frames: 1,
        frameCount: 33,
        direction: 0,
      }),
    ).toBe(32);
  });

  it('keeps unrelated square-count gamestates on linear frame sampling', () => {
    expect(
      calculateControlledFrameIndex({
        value: 1,
        maxValue: 3,
        frames: 1,
        frameCount: 12,
        direction: 0,
      }),
    ).toBe(4);
  });

  it('preserves direct frame indexing when the atlas already matches gamestate', () => {
    expect(
      calculateControlledFrameIndex({
        value: 8,
        maxValue: 63,
        frames: 1,
        frameCount: 64,
        direction: 0,
        logicalGridWidth: 8,
      }),
    ).toBe(8);
  });
});
