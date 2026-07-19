import { describe, expect, it } from 'vitest';

import {
  MAX_LIVING_SAVE_FILE_BYTES,
  parseLivingSaveFileText,
  serializeLivingSaveFile,
} from './livingSaveFiles';
import {
  LIVING_SAVE_SESSION_FORMAT,
  LIVING_SAVE_SESSION_SCHEMA_VERSION,
} from './livingSaveTypes';
import type {
  LivingSaveSessionEnvelope,
  LivingSaveValidationContext,
} from './livingSaveTypes';

const envelope = (): LivingSaveSessionEnvelope => ({
  format: LIVING_SAVE_SESSION_FORMAT,
  schemaVersion: LIVING_SAVE_SESSION_SCHEMA_VERSION,
  gameDataVersion: 1,
  resumePointId: 'portable-1',
  savedAt: 1_700_000_000_000,
  gamestateValues: { 100: 2, 101: 4 },
  activeSceneId: 2000,
  returnSceneId: null,
  rotation: { yaw3600: 1200, pitch: -25 },
});

const validation: LivingSaveValidationContext = {
  supportedGameDataVersions: [1],
  expectedGamestateBounds: {
    100: { minimum: 0, maximum: 3 },
    101: { minimum: 0, maximum: 4 },
  },
  isSceneAvailable: async (sceneId) => sceneId === 2000,
};

describe('living-save files', () => {
  it('round-trips the same supported portable envelope', async () => {
    const text = serializeLivingSaveFile(envelope());

    await expect(parseLivingSaveFileText(text, validation)).resolves.toEqual({
      ok: true,
      envelope: envelope(),
    });
  });

  it('rejects malformed, unsupported, and oversized files without data', async () => {
    await expect(
      parseLivingSaveFileText('{nope', validation),
    ).resolves.toMatchObject({ ok: false, code: 'malformed' });

    const unsupported = envelope();
    unsupported.gameDataVersion = 99;
    await expect(
      parseLivingSaveFileText(JSON.stringify(unsupported), validation),
    ).resolves.toMatchObject({ ok: false, code: 'unsupported-version' });

    await expect(
      parseLivingSaveFileText(
        'x'.repeat(MAX_LIVING_SAVE_FILE_BYTES + 1),
        validation,
      ),
    ).resolves.toMatchObject({ ok: false, code: 'oversized' });
  });
});
