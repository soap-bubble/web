import {
  LIVING_SAVE_CATALOG_FORMAT,
  LIVING_SAVE_CATALOG_SCHEMA_VERSION,
  LIVING_SAVE_SESSION_FORMAT,
  LIVING_SAVE_SESSION_SCHEMA_VERSION,
} from '@/morpheus-app/storage/livingSaveTypes';
import type {
  LivingSaveCatalog,
  LivingSaveSessionEnvelope,
  LivingSaveSlotId,
} from '@/morpheus-app/storage/livingSaveTypes';

export function createLivingSaveEnvelopeFixture(
  overrides: Partial<LivingSaveSessionEnvelope> = {},
): LivingSaveSessionEnvelope {
  return {
    format: LIVING_SAVE_SESSION_FORMAT,
    schemaVersion: LIVING_SAVE_SESSION_SCHEMA_VERSION,
    gameDataVersion: 1,
    resumePointId: 'resume-1',
    savedAt: 1_700_000_000_000,
    gamestateValues: {},
    activeSceneId: 2000,
    returnSceneId: null,
    rotation: { yaw3600: 1200, pitch: -20 },
    ...overrides,
  };
}

export function createEmptyLivingSaveCatalogFixture(): LivingSaveCatalog {
  return {
    format: LIVING_SAVE_CATALOG_FORMAT,
    schemaVersion: LIVING_SAVE_CATALOG_SCHEMA_VERSION,
    revision: 0,
    activeSlotId: null,
    slots: {
      'slot-1': { kind: 'empty', slotId: 'slot-1', revision: 0 },
      'slot-2': { kind: 'empty', slotId: 'slot-2', revision: 0 },
      'slot-3': { kind: 'empty', slotId: 'slot-3', revision: 0 },
    },
    tombstones: {},
  };
}

export function occupyLivingSaveSlot(
  catalog: LivingSaveCatalog,
  slotId: LivingSaveSlotId,
  envelope: LivingSaveSessionEnvelope,
): LivingSaveCatalog {
  return {
    ...catalog,
    revision: catalog.revision + 1,
    activeSlotId: slotId,
    slots: {
      ...catalog.slots,
      [slotId]: {
        kind: 'occupied',
        slotId,
        revision: catalog.slots[slotId].revision + 1,
        envelope,
      },
    },
  };
}
