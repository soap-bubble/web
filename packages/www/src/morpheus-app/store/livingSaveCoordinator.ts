import { fetchInitial } from '@soapbubble/morpheus-client/service/gameState';
import type { Scene } from 'morpheus/casts/types';

import {
  activateLivingSaveSlot,
  createLivingSaveSlot,
  readLivingSaveCatalog,
} from '@/morpheus-app/storage/livingSaveStorage';
import { validateLivingSaveSessionEnvelope } from '@/morpheus-app/storage/livingSaveSchema';
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
  validateEnvelope: (
    envelope: LivingSaveSessionEnvelope,
  ) => Promise<LivingSaveValidationResult>;
  fetchScene: (sceneId: number) => Promise<Scene | null>;
  replaceRoute: (sceneId: number) => void;
  goToTitle: () => void;
};

export type LivingSaveCoordinatorOutcome =
  | { ok: true; kind: 'restored' | 'volatile' | 'title' | 'created' }
  | { ok: false; reason: string }
  | { ok: false; reason: 'stale-operation' };

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
};

function createOperationId(kind: string, sequence: number): string {
  return `${kind}-${sequence}`;
}

function createResumePointId(): string {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }
  return `resume-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function createGenesisLivingSaveEnvelope(): LivingSaveSessionEnvelope {
  return {
    format: LIVING_SAVE_SESSION_FORMAT,
    schemaVersion: LIVING_SAVE_SESSION_SCHEMA_VERSION,
    gameDataVersion: LIVING_SAVE_GAME_DATA_VERSION,
    resumePointId: createResumePointId(),
    savedAt: Date.now(),
    gamestateValues: Object.fromEntries(
      fetchInitial().map((gamestate) => [gamestate.stateId, gamestate.value]),
    ),
    activeSceneId: 2000,
    returnSceneId: null,
    rotation: { yaw3600: 0, pitch: 0 },
  };
}

export function createLivingSaveCoordinator(
  dependencies: LivingSaveCoordinatorDependencies,
): LivingSaveCoordinator {
  let operationSequence = 0;
  let currentOperationId: string | null = null;

  const isCurrent = (operationId: string) => currentOperationId === operationId;

  const startOperation = (kind: 'bootstrap' | 'restore' | 'switch'): string => {
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
  ): boolean => {
    if (!isCurrent(operationId)) return false;
    dependencies.dispatch(livingSaveCatalogResolved({ catalog, operationId }));
    return true;
  };

  const installEnvelope = async (params: {
    operationId: string;
    catalog: LivingSaveCatalog;
    slotId: LivingSaveSlotId | null;
    envelope: LivingSaveSessionEnvelope;
    saveHealth: 'saved' | 'volatile';
    navigate: boolean;
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
  ): Promise<LivingSaveCatalog | LivingSaveCoordinatorOutcome> => {
    const catalogResult = await dependencies.readCatalog();
    if (!isCurrent(operationId)) {
      return { ok: false, reason: 'stale-operation' };
    }
    if (!catalogResult.ok) {
      return fail(operationId, catalogResult.code);
    }
    resolveCatalog(operationId, catalogResult.value);
    return catalogResult.value;
  };

  const restoreSlot = async (
    slotId: LivingSaveSlotId,
  ): Promise<LivingSaveCoordinatorOutcome> => {
    const operationId = startOperation('restore');
    const catalogOrOutcome = await readCatalogForOperation(operationId);
    if ('ok' in catalogOrOutcome) return catalogOrOutcome;
    const catalog = catalogOrOutcome;
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
    const catalogOrOutcome = await readCatalogForOperation(operationId);
    if ('ok' in catalogOrOutcome) return catalogOrOutcome;
    const catalog = catalogOrOutcome;

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
    return { ok: true, kind: 'title' };
  };

  const createNewSlot: LivingSaveCoordinator['createNewSlot'] = async (
    slotId,
  ) => {
    const operationId = startOperation('restore');
    const catalogOrOutcome = await readCatalogForOperation(operationId);
    if ('ok' in catalogOrOutcome) return catalogOrOutcome;
    const catalog = catalogOrOutcome;
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
    });
    return installed.ok ? { ok: true, kind: 'created' } : installed;
  };

  return { bootstrap, restoreSlot, createNewSlot };
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
      { minimum: gamestate.minValue, maximum: gamestate.maxValue },
    ]),
  );
  return createLivingSaveCoordinator({
    ...params,
    readCatalog: readLivingSaveCatalog,
    activateSlot: activateLivingSaveSlot,
    createSlot: createLivingSaveSlot,
    validateEnvelope: (envelope) =>
      validateLivingSaveSessionEnvelope(envelope, {
        supportedGameDataVersions: [LIVING_SAVE_GAME_DATA_VERSION],
        expectedGamestateBounds,
        isSceneAvailable: async (sceneId) =>
          (await params.fetchScene(sceneId)) !== null,
      }),
  });
}
