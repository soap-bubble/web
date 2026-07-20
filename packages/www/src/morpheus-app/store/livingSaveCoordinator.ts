import { fetchInitial } from '@soapbubble/morpheus-client/service/gameState';
import type { Scene } from 'morpheus/casts/types';

import {
  activateLivingSaveSlot,
  createLivingSaveSlot,
  deleteLivingSaveSlot,
  importLivingSaveSlot,
  readLivingSaveEnvelope,
  readLivingSaveCatalog,
  readLivingSaveRawPayload,
  undoLivingSaveDeletion,
} from '@/morpheus-app/storage/livingSaveStorage';
import {
  parseLivingSaveFileText,
  serializeLivingSaveFile,
} from '@/morpheus-app/storage/livingSaveFiles';
import type { LivingSaveFileParseResult } from '@/morpheus-app/storage/livingSaveFiles';
import { validateLivingSaveSessionEnvelope } from '@/morpheus-app/storage/livingSaveSchema';
import {
  createLivingSaveResumePointId,
  MORPHEUS_INITIAL_SCENE_ID,
} from '@/morpheus-app/storage/livingSaveIdentity';
import {
  LIVING_SAVE_GAME_DATA_VERSION,
  LIVING_SAVE_SESSION_FORMAT,
  LIVING_SAVE_SESSION_SCHEMA_VERSION,
} from '@/morpheus-app/storage/livingSaveTypes';
import type {
  LivingSaveCatalog,
  LivingSaveResult,
  LivingSaveSessionEnvelope,
  LivingSaveSlotId,
  LivingSaveValidationResult,
} from '@/morpheus-app/storage/livingSaveTypes';
import { installLivingSaveRuntime } from './actions';
import {
  livingSaveCatalogResolved,
  livingSaveOperationCompleted,
  livingSaveOperationFailed,
  livingSaveOperationStarted,
} from './slices/livingSavesSlice';
import type { AppDispatch, RootState } from './store';

type ActivateSlotParams = {
  slotId: LivingSaveSlotId;
  expectedCatalogRevision: number;
  expectedSlotRevision: number;
};

type CreateSlotParams = {
  slotId: LivingSaveSlotId;
  envelope: LivingSaveSessionEnvelope;
  expectedCatalogRevision: number;
  activate: boolean;
};

type DeleteSlotParams = {
  slotId: LivingSaveSlotId;
  expectedCatalogRevision: number;
  expectedSlotRevision: number;
};

type ImportSlotParams = DeleteSlotParams & {
  envelope: LivingSaveSessionEnvelope;
};

export type LivingSaveCoordinatorDependencies = {
  dispatch: AppDispatch;
  getState: () => RootState;
  readCatalog: () => Promise<LivingSaveResult<LivingSaveCatalog>>;
  activateSlot: (
    params: ActivateSlotParams,
  ) => Promise<LivingSaveResult<LivingSaveCatalog>>;
  createSlot: (
    params: CreateSlotParams,
  ) => Promise<LivingSaveResult<LivingSaveCatalog>>;
  deleteSlot?: (
    params: DeleteSlotParams,
  ) => Promise<LivingSaveResult<LivingSaveCatalog>>;
  undoDeletion?: (
    params: DeleteSlotParams,
  ) => Promise<LivingSaveResult<LivingSaveCatalog>>;
  importSlot?: (
    params: ImportSlotParams,
  ) => Promise<LivingSaveResult<LivingSaveCatalog>>;
  readEnvelope?: (
    slotId: LivingSaveSlotId,
  ) => Promise<LivingSaveResult<LivingSaveSessionEnvelope>>;
  readRawPayload?: (
    slotId: LivingSaveSlotId,
  ) => Promise<LivingSaveResult<unknown>>;
  parseFileText: (text: string) => Promise<LivingSaveFileParseResult>;
  validateEnvelope: (
    envelope: LivingSaveSessionEnvelope,
  ) => Promise<LivingSaveValidationResult>;
  fetchScene: (sceneId: number) => Promise<Scene | null>;
  replaceRoute: (sceneId: number) => void;
  goToTitle: () => void;
};

export type LivingSaveCoordinatorOutcome =
  | {
      ok: true;
      kind: 'restored' | 'volatile' | 'title' | 'created' | 'managed';
    }
  | { ok: false; reason: string };

export type LivingSaveCoordinator = {
  bootstrap: (params: {
    routeSceneId: number | null;
    mcpSessionName: string | null;
  }) => Promise<LivingSaveCoordinatorOutcome>;
  restoreSlot: (
    slotId: LivingSaveSlotId,
  ) => Promise<LivingSaveCoordinatorOutcome>;
  createNewSlot: (
    slotId: LivingSaveSlotId,
  ) => Promise<LivingSaveCoordinatorOutcome>;
  deleteSlot: (
    slotId: LivingSaveSlotId,
  ) => Promise<LivingSaveCoordinatorOutcome>;
  undoDelete: (
    slotId: LivingSaveSlotId,
  ) => Promise<LivingSaveCoordinatorOutcome>;
  importFileText: (
    slotId: LivingSaveSlotId,
    text: string,
  ) => Promise<LivingSaveCoordinatorOutcome>;
  readExportFile: (
    slotId: LivingSaveSlotId,
  ) => Promise<LivingSaveResult<{ contents: string; suffix: string }>>;
};

function createOperationId(kind: string, sequence: number): string {
  return `${kind}-${sequence}`;
}

export function createGenesisLivingSaveEnvelope(): LivingSaveSessionEnvelope {
  return {
    format: LIVING_SAVE_SESSION_FORMAT,
    schemaVersion: LIVING_SAVE_SESSION_SCHEMA_VERSION,
    gameDataVersion: LIVING_SAVE_GAME_DATA_VERSION,
    resumePointId: createLivingSaveResumePointId(),
    savedAt: Date.now(),
    gamestateValues: Object.fromEntries(
      fetchInitial().map((gamestate) => [gamestate.stateId, gamestate.value]),
    ),
    activeSceneId: MORPHEUS_INITIAL_SCENE_ID,
    returnSceneId: null,
    rotation: { yaw3600: 1500, pitch: 0 },
  };
}

export function createLivingSaveCoordinator(
  dependencies: LivingSaveCoordinatorDependencies,
): LivingSaveCoordinator {
  let operationSequence = 0;
  let currentOperationId: string | null = null;

  const isCurrent = (operationId: string) => currentOperationId === operationId;

  const startOperation = (
    kind: 'bootstrap' | 'restore' | 'manage',
  ): string => {
    operationSequence += 1;
    const operationId = createOperationId(kind, operationSequence);
    currentOperationId = operationId;
    dependencies.dispatch(livingSaveOperationStarted({ operationId, kind }));
    return operationId;
  };

  const fail = (
    operationId: string,
    reason: string,
    slot?: {
      slotId: LivingSaveSlotId;
      unloadableReason: Exclude<
        LivingSaveValidationResult,
        { ok: true }
      >['code'];
    },
  ): LivingSaveCoordinatorOutcome => {
    if (!isCurrent(operationId)) {
      return { ok: false, reason: 'stale-operation' };
    }
    dependencies.dispatch(
      livingSaveOperationFailed({ operationId, reason, ...slot }),
    );
    currentOperationId = null;
    return { ok: false, reason };
  };

  const resolveCatalog = (
    operationId: string,
    catalog: LivingSaveCatalog,
  ): void => {
    if (!isCurrent(operationId)) return;
    dependencies.dispatch(livingSaveCatalogResolved({ catalog, operationId }));
  };

  const installEnvelope = async (params: {
    operationId: string;
    catalog: LivingSaveCatalog;
    slotId: LivingSaveSlotId | null;
    envelope: LivingSaveSessionEnvelope;
    saveHealth: 'saved' | 'volatile';
    navigate: boolean;
    skipSceneEntryActions: boolean;
  }): Promise<LivingSaveCoordinatorOutcome> => {
    const validation = await dependencies.validateEnvelope(params.envelope);
    if (!isCurrent(params.operationId)) {
      return { ok: false, reason: 'stale-operation' };
    }
    if (!validation.ok) {
      return fail(
        params.operationId,
        validation.code,
        params.slotId === null
          ? undefined
          : {
              slotId: params.slotId,
              unloadableReason: validation.code,
            },
      );
    }

    let activeScene: Scene | null;
    let returnScene: Scene | null = null;
    try {
      [activeScene, returnScene] = await Promise.all([
        dependencies.fetchScene(validation.envelope.activeSceneId),
        validation.envelope.returnSceneId === null
          ? Promise.resolve(null)
          : dependencies.fetchScene(validation.envelope.returnSceneId),
      ]);
    } catch {
      return fail(
        params.operationId,
        'unavailable-scene',
        params.slotId === null
          ? undefined
          : {
              slotId: params.slotId,
              unloadableReason: 'unavailable-scene',
            },
      );
    }
    if (!isCurrent(params.operationId)) {
      return { ok: false, reason: 'stale-operation' };
    }
    if (
      activeScene === null ||
      (validation.envelope.returnSceneId !== null && returnScene === null)
    ) {
      return fail(
        params.operationId,
        'unavailable-scene',
        params.slotId === null
          ? undefined
          : {
              slotId: params.slotId,
              unloadableReason: 'unavailable-scene',
            },
      );
    }

    dependencies.dispatch(
      installLivingSaveRuntime({
        operationId: params.operationId,
        catalog: params.catalog,
        slotId: params.slotId,
        envelope: validation.envelope,
        activeScene,
        returnScene,
        saveHealth: params.saveHealth,
        skipSceneEntryActions: params.skipSceneEntryActions,
      }),
    );
    currentOperationId = null;
    if (params.navigate) {
      dependencies.replaceRoute(validation.envelope.activeSceneId);
    }
    return {
      ok: true,
      kind: params.slotId === null ? 'volatile' : 'restored',
    };
  };

  const readCatalogForOperation = async (
    operationId: string,
  ): Promise<
    | { status: 'ready'; catalog: LivingSaveCatalog }
    | { status: 'failed'; outcome: LivingSaveCoordinatorOutcome }
  > => {
    const catalogResult = await dependencies.readCatalog();
    if (!isCurrent(operationId)) {
      return {
        status: 'failed',
        outcome: { ok: false, reason: 'stale-operation' },
      };
    }
    if (!catalogResult.ok) {
      return {
        status: 'failed',
        outcome: fail(operationId, catalogResult.code),
      };
    }
    resolveCatalog(operationId, catalogResult.value);
    return { status: 'ready', catalog: catalogResult.value };
  };

  const restoreSlot = async (
    slotId: LivingSaveSlotId,
  ): Promise<LivingSaveCoordinatorOutcome> => {
    const operationId = startOperation('restore');
    const catalogResult = await readCatalogForOperation(operationId);
    if (catalogResult.status === 'failed') return catalogResult.outcome;
    const catalog = catalogResult.catalog;
    const slot = catalog.slots[slotId];
    if (slot.kind !== 'occupied') {
      return fail(
        operationId,
        slot.kind === 'unloadable' ? slot.reason : 'empty-target',
      );
    }

    const validation = await dependencies.validateEnvelope(slot.envelope);
    if (!isCurrent(operationId)) {
      return { ok: false, reason: 'stale-operation' };
    }
    if (!validation.ok) {
      return fail(operationId, validation.code, {
        slotId,
        unloadableReason: validation.code,
      });
    }
    let activeScene: Scene | null;
    let returnScene: Scene | null = null;
    try {
      [activeScene, returnScene] = await Promise.all([
        dependencies.fetchScene(validation.envelope.activeSceneId),
        validation.envelope.returnSceneId === null
          ? Promise.resolve(null)
          : dependencies.fetchScene(validation.envelope.returnSceneId),
      ]);
    } catch {
      return fail(operationId, 'unavailable-scene', {
        slotId,
        unloadableReason: 'unavailable-scene',
      });
    }
    if (
      !isCurrent(operationId) ||
      activeScene === null ||
      (validation.envelope.returnSceneId !== null && returnScene === null)
    ) {
      return isCurrent(operationId)
        ? fail(operationId, 'unavailable-scene', {
            slotId,
            unloadableReason: 'unavailable-scene',
          })
        : { ok: false, reason: 'stale-operation' };
    }

    const activation = await dependencies.activateSlot({
      slotId,
      expectedCatalogRevision: catalog.revision,
      expectedSlotRevision: slot.revision,
    });
    if (!isCurrent(operationId)) {
      return { ok: false, reason: 'stale-operation' };
    }
    if (!activation.ok) {
      return fail(operationId, activation.code);
    }

    dependencies.dispatch(
      installLivingSaveRuntime({
        operationId,
        catalog: activation.value,
        slotId,
        envelope: validation.envelope,
        activeScene,
        returnScene,
        saveHealth: 'saved',
        skipSceneEntryActions: true,
      }),
    );
    currentOperationId = null;
    dependencies.replaceRoute(validation.envelope.activeSceneId);
    return { ok: true, kind: 'restored' };
  };

  const bootstrap: LivingSaveCoordinator['bootstrap'] = async ({
    routeSceneId,
    mcpSessionName,
  }) => {
    const operationId = startOperation('bootstrap');
    const catalogResult = await readCatalogForOperation(operationId);
    if (catalogResult.status === 'failed') return catalogResult.outcome;
    const catalog = catalogResult.catalog;

    if (routeSceneId === null) {
      dependencies.dispatch(
        livingSaveOperationCompleted({
          operationId,
          saveHealth: catalog.activeSlotId === null ? 'idle' : 'saved',
        }),
      );
      currentOperationId = null;
      return { ok: true, kind: 'title' };
    }

    if (catalog.activeSlotId !== null) {
      const slot = catalog.slots[catalog.activeSlotId];
      if (slot.kind !== 'occupied') {
        dependencies.goToTitle();
        return fail(
          operationId,
          slot.kind === 'unloadable' ? slot.reason : 'empty-target',
        );
      }
      return installEnvelope({
        operationId,
        catalog,
        slotId: catalog.activeSlotId,
        envelope: slot.envelope,
        saveHealth: 'saved',
        navigate: routeSceneId !== slot.envelope.activeSceneId,
        skipSceneEntryActions: true,
      });
    }

    if (routeSceneId !== null && mcpSessionName) {
      const envelope = {
        ...createGenesisLivingSaveEnvelope(),
        activeSceneId: routeSceneId,
      };
      return installEnvelope({
        operationId,
        catalog,
        slotId: null,
        envelope,
        saveHealth: 'volatile',
        navigate: false,
        skipSceneEntryActions: false,
      });
    }

    dependencies.dispatch(
      livingSaveOperationCompleted({
        operationId,
        saveHealth: 'idle',
      }),
    );
    currentOperationId = null;
    if (routeSceneId !== null) dependencies.goToTitle();
    return { ok: true, kind: 'managed' };
  };

  const createNewSlot: LivingSaveCoordinator['createNewSlot'] = async (
    slotId,
  ) => {
    const operationId = startOperation('restore');
    const catalogResult = await readCatalogForOperation(operationId);
    if (catalogResult.status === 'failed') return catalogResult.outcome;
    const catalog = catalogResult.catalog;
    if (catalog.slots[slotId].kind !== 'empty') {
      return fail(operationId, 'occupied-target');
    }
    const envelope = createGenesisLivingSaveEnvelope();
    const created = await dependencies.createSlot({
      slotId,
      envelope,
      expectedCatalogRevision: catalog.revision,
      activate: true,
    });
    if (!isCurrent(operationId)) {
      return { ok: false, reason: 'stale-operation' };
    }
    if (!created.ok) return fail(operationId, created.code);
    const installed = await installEnvelope({
      operationId,
      catalog: created.value,
      slotId,
      envelope,
      saveHealth: 'saved',
      navigate: false,
      skipSceneEntryActions: false,
    });
    return installed.ok ? { ok: true, kind: 'created' } : installed;
  };

  const runCatalogManagement = async (
    slotId: LivingSaveSlotId,
    mutation:
      | NonNullable<LivingSaveCoordinatorDependencies['deleteSlot']>
      | NonNullable<LivingSaveCoordinatorDependencies['undoDeletion']>,
    saveHealthAfter: (
      catalogBefore: LivingSaveCatalog,
    ) => 'saved' | 'saving' | 'volatile' | 'idle' | 'save-unavailable',
  ): Promise<LivingSaveCoordinatorOutcome> => {
    const operationId = startOperation('manage');
    const catalogResult = await readCatalogForOperation(operationId);
    if (catalogResult.status === 'failed') return catalogResult.outcome;
    const catalog = catalogResult.catalog;
    const slot = catalog.slots[slotId];
    const result = await mutation({
      slotId,
      expectedCatalogRevision: catalog.revision,
      expectedSlotRevision: slot.revision,
    });
    if (!isCurrent(operationId)) {
      return { ok: false, reason: 'stale-operation' };
    }
    if (!result.ok) return fail(operationId, result.code);

    resolveCatalog(operationId, result.value);
    dependencies.dispatch(
      livingSaveOperationCompleted({
        operationId,
        saveHealth: saveHealthAfter(catalog),
      }),
    );
    currentOperationId = null;
    return { ok: true, kind: 'managed' };
  };

  const deleteSlot: LivingSaveCoordinator['deleteSlot'] = async (slotId) => {
    if (!dependencies.deleteSlot) {
      return { ok: false, reason: 'unavailable-storage' };
    }
    return runCatalogManagement(
      slotId,
      dependencies.deleteSlot,
      (before) =>
        before.activeSlotId === slotId
          ? 'volatile'
          : dependencies.getState().livingSaves.saveHealth,
    );
  };

  const undoDelete: LivingSaveCoordinator['undoDelete'] = async (slotId) => {
    if (!dependencies.undoDeletion) {
      return { ok: false, reason: 'unavailable-storage' };
    }
    return runCatalogManagement(
      slotId,
      dependencies.undoDeletion,
      () => dependencies.getState().livingSaves.saveHealth,
    );
  };

  const importFileText: LivingSaveCoordinator['importFileText'] = async (
    slotId,
    text,
  ) => {
    if (!dependencies.importSlot) {
      return { ok: false, reason: 'unavailable-storage' };
    }
    const operationId = startOperation('manage');
    const catalogResult = await readCatalogForOperation(operationId);
    if (catalogResult.status === 'failed') return catalogResult.outcome;
    const catalog = catalogResult.catalog;
    const slot = catalog.slots[slotId];
    if (slot.kind !== 'empty') {
      return fail(operationId, 'occupied-target');
    }

    const fileResult = await dependencies.parseFileText(text);
    if (!isCurrent(operationId)) {
      return { ok: false, reason: 'stale-operation' };
    }
    if (!fileResult.ok) {
      return fail(operationId, fileResult.code);
    }

    const result = await dependencies.importSlot({
      slotId,
      envelope: fileResult.envelope,
      expectedCatalogRevision: catalog.revision,
      expectedSlotRevision: slot.revision,
    });
    if (!isCurrent(operationId)) {
      return { ok: false, reason: 'stale-operation' };
    }
    if (!result.ok) return fail(operationId, result.code);
    resolveCatalog(operationId, result.value);
    dependencies.dispatch(
      livingSaveOperationCompleted({
        operationId,
        saveHealth: dependencies.getState().livingSaves.saveHealth,
      }),
    );
    currentOperationId = null;
    return { ok: true, kind: 'title' };
  };

  const readExportFile: LivingSaveCoordinator['readExportFile'] = async (
    slotId,
  ) => {
    if (!dependencies.readEnvelope || !dependencies.readRawPayload) {
      return { ok: false, code: 'unavailable-storage' };
    }

    const envelopeResult = await dependencies.readEnvelope(slotId);
    if (envelopeResult.ok) {
      return {
        ok: true,
        value: {
          contents: serializeLivingSaveFile(envelopeResult.value),
          suffix: envelopeResult.value.resumePointId,
        },
      };
    }
    if (envelopeResult.code !== 'invalid-data') {
      return envelopeResult;
    }

    const rawResult = await dependencies.readRawPayload(slotId);
    if (!rawResult.ok) {
      return rawResult;
    }
    let serialized: string | undefined;
    try {
      serialized = JSON.stringify(rawResult.value, null, 2);
    } catch {
      return {
        ok: false,
        code: 'invalid-data',
        reason: 'The unavailable save could not be exported.',
      };
    }
    if (serialized === undefined) {
      return {
        ok: false,
        code: 'invalid-data',
        reason: 'The unavailable save could not be serialized.',
      };
    }
    return {
      ok: true,
      value: {
        contents: `${serialized}\n`,
        suffix: 'unavailable',
      },
    };
  };

  return {
    bootstrap,
    restoreSlot,
    createNewSlot,
    deleteSlot,
    undoDelete,
    importFileText,
    readExportFile,
  };
}

export function createBrowserLivingSaveCoordinator(params: {
  dispatch: AppDispatch;
  getState: () => RootState;
  fetchScene: (sceneId: number) => Promise<Scene | null>;
  replaceRoute: (sceneId: number) => void;
  goToTitle: () => void;
}): LivingSaveCoordinator {
  const initialGamestates = fetchInitial();
  const expectedGamestateBounds = Object.fromEntries(
    initialGamestates.map((gamestate) => [
      gamestate.stateId,
      {
        minimum: Math.min(gamestate.minValue, gamestate.value),
        maximum: Math.max(gamestate.maxValue, gamestate.value),
      },
    ]),
  );
  const validationContext = {
    supportedGameDataVersions: [LIVING_SAVE_GAME_DATA_VERSION],
    expectedGamestateBounds,
    isSceneAvailable: async (sceneId: number) =>
      (await params.fetchScene(sceneId)) !== null,
  };
  return createLivingSaveCoordinator({
    ...params,
    readCatalog: readLivingSaveCatalog,
    activateSlot: activateLivingSaveSlot,
    createSlot: createLivingSaveSlot,
    deleteSlot: deleteLivingSaveSlot,
    undoDeletion: undoLivingSaveDeletion,
    importSlot: importLivingSaveSlot,
    readEnvelope: readLivingSaveEnvelope,
    readRawPayload: readLivingSaveRawPayload,
    parseFileText: (text) =>
      parseLivingSaveFileText(text, validationContext),
    validateEnvelope: (envelope) =>
      validateLivingSaveSessionEnvelope(envelope, validationContext),
  });
}
