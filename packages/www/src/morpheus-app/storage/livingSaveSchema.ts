import { z } from 'zod';

import {
  LIVING_SAVE_GAME_DATA_VERSION,
  LIVING_SAVE_SESSION_FORMAT,
  LIVING_SAVE_SESSION_SCHEMA_VERSION,
} from './livingSaveTypes';
import type {
  LivingSaveSessionEnvelope,
  LivingSaveValidationContext,
  LivingSaveValidationResult,
} from './livingSaveTypes';

const integerRecordSchema = z.record(z.string(), z.number().int()).superRefine(
  (values, context) => {
    for (const key of Object.keys(values)) {
      if (!/^(0|[1-9]\d*)$/.test(key)) {
        context.addIssue({
          code: 'custom',
          message: `Invalid gamestate ID ${key}`,
        });
      }
    }
  },
);

const MAX_JAVASCRIPT_DATE_MS = 8_640_000_000_000_000;

const envelopeVersionSchema = z
  .object({
    format: z.literal(LIVING_SAVE_SESSION_FORMAT),
    schemaVersion: z.number().int().positive(),
  })
  .passthrough();

const envelopeSchema = z
  .object({
    format: z.literal(LIVING_SAVE_SESSION_FORMAT),
    schemaVersion: z.number().int().positive(),
    gameDataVersion: z.number().int().positive(),
    resumePointId: z.string().min(1).max(200),
    savedAt: z
      .number()
      .int()
      .nonnegative()
      .finite()
      .max(MAX_JAVASCRIPT_DATE_MS),
    gamestateValues: integerRecordSchema,
    activeSceneId: z.number().int().positive(),
    returnSceneId: z.number().int().positive().nullable(),
    rotation: z.object({
      yaw3600: z.number().finite().min(0).lt(3600),
      pitch: z.number().finite().min(-250).max(250),
    }),
  })
  .strict();

export type LivingSaveParseResult =
  | { success: true; data: LivingSaveSessionEnvelope }
  | { success: false; issues: readonly string[] };

export function parseLivingSaveSessionEnvelope(
  value: unknown,
): LivingSaveParseResult {
  const version = envelopeVersionSchema.safeParse(value);
  if (
    version.success &&
    version.data.schemaVersion !== LIVING_SAVE_SESSION_SCHEMA_VERSION
  ) {
    return {
      success: false,
      issues: [
        `Unsupported session schema version ${version.data.schemaVersion}`,
      ],
    };
  }

  const parsed = envelopeSchema.safeParse(value);
  if (!parsed.success) {
    return {
      success: false,
      issues: parsed.error.issues.map((issue) => issue.message),
    };
  }
  const gamestateValues: Record<number, number> = {};
  for (const [key, gamestateValue] of Object.entries(
    parsed.data.gamestateValues,
  )) {
    gamestateValues[Number(key)] = gamestateValue;
  }

  return {
    success: true,
    data: {
      ...parsed.data,
      schemaVersion: LIVING_SAVE_SESSION_SCHEMA_VERSION,
      gamestateValues,
    },
  };
}

export async function validateLivingSaveSessionEnvelope(
  value: unknown,
  context: LivingSaveValidationContext,
): Promise<LivingSaveValidationResult> {
  const parsed = parseLivingSaveSessionEnvelope(value);
  if (!parsed.success) {
    const unsupported = parsed.issues.some((issue) =>
      issue.startsWith('Unsupported session schema version'),
    );
    return {
      ok: false,
      code: unsupported ? 'unsupported-version' : 'invalid-data',
      reason: parsed.issues[0] ?? 'The save data is malformed.',
    };
  }

  const envelope = parsed.data;
  if (
    !context.supportedGameDataVersions.includes(envelope.gameDataVersion) ||
    envelope.gameDataVersion !== LIVING_SAVE_GAME_DATA_VERSION
  ) {
    return {
      ok: false,
      code: 'unsupported-version',
      reason: `Unsupported game-data version ${envelope.gameDataVersion}`,
    };
  }

  const expectedIds = Object.keys(context.expectedGamestateBounds).map(Number);
  const actualIds = Object.keys(envelope.gamestateValues).map(Number);
  if (
    expectedIds.length !== actualIds.length ||
    expectedIds.some(
      (stateId) => !Object.hasOwn(envelope.gamestateValues, stateId),
    )
  ) {
    return {
      ok: false,
      code: 'incomplete-gamestate',
      reason: 'The save does not contain the complete game state.',
    };
  }

  for (const stateId of expectedIds) {
    const valueAtState = envelope.gamestateValues[stateId];
    const bounds = context.expectedGamestateBounds[stateId];
    if (
      !Number.isInteger(valueAtState) ||
      valueAtState < bounds.minimum ||
      valueAtState > bounds.maximum
    ) {
      return {
        ok: false,
        code: 'invalid-gamestate',
        reason: `Gamestate ${stateId} is outside its authored bounds.`,
      };
    }
  }

  const referencedSceneIds = [
    envelope.activeSceneId,
    ...(envelope.returnSceneId === null ? [] : [envelope.returnSceneId]),
  ];
  for (const sceneId of referencedSceneIds) {
    if (!(await context.isSceneAvailable(sceneId))) {
      return {
        ok: false,
        code: 'unavailable-scene',
        reason: `Scene ${sceneId} is unavailable.`,
      };
    }
  }

  return { ok: true, envelope };
}
