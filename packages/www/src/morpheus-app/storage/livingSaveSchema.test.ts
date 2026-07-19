import { describe, expect, it } from 'vitest';

import {
  parseLivingSaveSessionEnvelope,
  validateLivingSaveSessionEnvelope,
} from './livingSaveSchema';
import type { LivingSaveSessionEnvelope } from './livingSaveTypes';

const createEnvelope = (
  resumePointId = 'resume-point-1',
): LivingSaveSessionEnvelope => ({
  format: 'morpheus-living-save-session',
  schemaVersion: 1,
  gameDataVersion: 1,
  resumePointId,
  savedAt: 1_700_000_000_000,
  gamestateValues: { 100: 2, 101: 4 },
  activeSceneId: 2000,
  returnSceneId: null,
  rotation: { yaw3600: 1200, pitch: -25 },
});

describe('living-save session schema', () => {
  it('accepts a complete portable envelope', () => {
    const parsed = parseLivingSaveSessionEnvelope(createEnvelope());

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data).toEqual(createEnvelope());
    }
  });

  it('rejects presentation-only rotation outside the supported bounds', () => {
    const envelope = createEnvelope();
    envelope.rotation.yaw3600 = 3601;

    expect(parseLivingSaveSessionEnvelope(envelope).success).toBe(false);
  });

  it('uses the load gate for game data, complete gamestate, and scenes', async () => {
    const result = await validateLivingSaveSessionEnvelope(createEnvelope(), {
      supportedGameDataVersions: [1],
      expectedGamestateBounds: {
        100: { minimum: 0, maximum: 3 },
        101: { minimum: 0, maximum: 4 },
      },
      isSceneAvailable: async (sceneId) => sceneId === 2000,
    });

    expect(result).toEqual({ ok: true, envelope: createEnvelope() });
  });

  it('rejects incomplete gamestate and unavailable return scenes', async () => {
    const incomplete = createEnvelope();
    delete incomplete.gamestateValues[101];

    expect(
      await validateLivingSaveSessionEnvelope(incomplete, {
        supportedGameDataVersions: [1],
        expectedGamestateBounds: {
          100: { minimum: 0, maximum: 3 },
          101: { minimum: 0, maximum: 4 },
        },
        isSceneAvailable: async () => true,
      }),
    ).toMatchObject({ ok: false, code: 'incomplete-gamestate' });

    const missingReturn = createEnvelope();
    missingReturn.returnSceneId = 1050;
    expect(
      await validateLivingSaveSessionEnvelope(missingReturn, {
        supportedGameDataVersions: [1],
        expectedGamestateBounds: {
          100: { minimum: 0, maximum: 3 },
          101: { minimum: 0, maximum: 4 },
        },
        isSceneAvailable: async (sceneId) => sceneId === 2000,
      }),
    ).toMatchObject({ ok: false, code: 'unavailable-scene' });
  });
});
