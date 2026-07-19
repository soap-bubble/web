import { describe, expect, it } from 'vitest';

import {
  authoredPanoramaAngleToRendererYaw,
  panoramaUvToAuthoredPosition,
  rendererYawToAuthoredPanoramaAngle,
} from 'morpheus/scene/panoramaCoordinates';

describe('panorama coordinate conversion', () => {
  it('round-trips authored angles through the renderer overflow', () => {
    expect(authoredPanoramaAngleToRendererYaw(3428)).toBe(3300);
    expect(rendererYawToAuthoredPanoramaAngle(3300)).toBe(3428);
  });

  it('maps the viewport center to the authored centerline', () => {
    expect(
      panoramaUvToAuthoredPosition({
        uvX: 0.5,
        uvY: 0.5,
        rendererYaw: 3300,
      }),
    ).toEqual({ top: 0, left: 3428 });
  });

  it('maps raycast UVs continuously around the authored centerline', () => {
    const left = panoramaUvToAuthoredPosition({
      uvX: 0.6,
      uvY: 0.75,
      rendererYaw: 3300,
    });
    const right = panoramaUvToAuthoredPosition({
      uvX: 0.4,
      uvY: 0.25,
      rendererYaw: 3300,
    });

    expect(left.left).toBeCloseTo(3323);
    expect(left.top).toBe(-128);
    expect(right.left).toBeCloseTo(3533);
    expect(right.top).toBe(128);
  });

  it('wraps pointer coordinates across the panorama seam', () => {
    expect(
      panoramaUvToAuthoredPosition({
        uvX: 0.4,
        uvY: 0.5,
        rendererYaw: 3522,
      }).left,
    ).toBeCloseTo(155);
  });

  it('maps the visible scene 2034 valve into its authored hotspot', () => {
    const valvePosition = panoramaUvToAuthoredPosition({
      uvX: 0.5187687364,
      uvY: 0.3581229279,
      rendererYaw: 3300,
    });

    expect(valvePosition.left).toBeGreaterThanOrEqual(3339);
    expect(valvePosition.left).toBeLessThanOrEqual(3517);
    expect(valvePosition.top).toBeGreaterThanOrEqual(-112);
    expect(valvePosition.top).toBeLessThanOrEqual(193);
  });
});
