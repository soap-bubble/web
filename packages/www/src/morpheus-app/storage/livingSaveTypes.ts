export const LIVING_SAVE_SLOT_IDS = ['slot-1', 'slot-2', 'slot-3'] as const;

export type LivingSaveSlotId = (typeof LIVING_SAVE_SLOT_IDS)[number];

export const LIVING_SAVE_CATALOG_FORMAT = 'morpheus-living-save-catalog';
export const LIVING_SAVE_CATALOG_SCHEMA_VERSION = 1;
export const LIVING_SAVE_SESSION_FORMAT = 'morpheus-living-save-session';
export const LIVING_SAVE_SESSION_SCHEMA_VERSION = 1;
export const LIVING_SAVE_GAME_DATA_VERSION = 1;
export const LIVING_SAVE_UNDO_WINDOW_MS = 10_000;

export type LivingSaveRotation = {
  yaw3600: number;
  pitch: number;
};

export type LivingSaveSessionEnvelope = {
  format: typeof LIVING_SAVE_SESSION_FORMAT;
  schemaVersion: typeof LIVING_SAVE_SESSION_SCHEMA_VERSION;
  gameDataVersion: number;
  resumePointId: string;
  savedAt: number;
  gamestateValues: Record<number, number>;
  activeSceneId: number;
  returnSceneId: number | null;
  rotation: LivingSaveRotation;
};

export type LivingSaveSlot =
  | {
      kind: 'empty';
      slotId: LivingSaveSlotId;
      revision: number;
    }
  | {
      kind: 'occupied';
      slotId: LivingSaveSlotId;
      revision: number;
      envelope: LivingSaveSessionEnvelope;
    }
  | {
      kind: 'unloadable';
      slotId: LivingSaveSlotId;
      revision: number;
      reason: LivingSaveUnloadableReason;
    };

export type LivingSaveUnloadableReason =
  | 'invalid-data'
  | 'unsupported-version'
  | 'incomplete-gamestate'
  | 'invalid-gamestate'
  | 'unavailable-scene';

export type LivingSaveTombstoneSummary = {
  slotId: LivingSaveSlotId;
  deletedAt: number;
  expiresAt: number;
  wasActive: boolean;
};

export type LivingSaveCatalog = {
  format: typeof LIVING_SAVE_CATALOG_FORMAT;
  schemaVersion: typeof LIVING_SAVE_CATALOG_SCHEMA_VERSION;
  revision: number;
  activeSlotId: LivingSaveSlotId | null;
  slots: Record<LivingSaveSlotId, LivingSaveSlot>;
  tombstones: Partial<Record<LivingSaveSlotId, LivingSaveTombstoneSummary>>;
};

export type LivingSaveFailureCode =
  | 'conflict'
  | 'unavailable-storage'
  | 'invalid-data'
  | 'occupied-target'
  | 'empty-target'
  | 'undo-expired'
  | 'undo-unavailable';

export type LivingSaveResult<T> =
  | { ok: true; value: T }
  | { ok: false; code: LivingSaveFailureCode; reason?: string };

export type LivingSaveValidationResult =
  | { ok: true; envelope: LivingSaveSessionEnvelope }
  | {
      ok: false;
      code: LivingSaveUnloadableReason;
      reason: string;
    };

export type LivingSaveValidationContext = {
  supportedGameDataVersions: readonly number[];
  expectedGamestateBounds: Record<
    number,
    {
      minimum: number;
      maximum: number;
    }
  >;
  isSceneAvailable: (sceneId: number) => Promise<boolean>;
};

export type RawLivingSaveSlotRecord = {
  revision: number;
  payload: unknown | null;
};

export type RawLivingSaveTombstone = {
  slot: RawLivingSaveSlotRecord;
  deletedAt: number;
  expiresAt: number;
  wasActive: boolean;
};

export type RawLivingSaveCatalog = {
  format: typeof LIVING_SAVE_CATALOG_FORMAT;
  schemaVersion: typeof LIVING_SAVE_CATALOG_SCHEMA_VERSION;
  revision: number;
  activeSlotId: LivingSaveSlotId | null;
  slots: Record<LivingSaveSlotId, RawLivingSaveSlotRecord>;
  tombstones: Partial<Record<LivingSaveSlotId, RawLivingSaveTombstone>>;
};
