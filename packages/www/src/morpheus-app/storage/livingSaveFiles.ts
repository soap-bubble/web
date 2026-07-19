import { validateLivingSaveSessionEnvelope } from './livingSaveSchema';
import type {
  LivingSaveSessionEnvelope,
  LivingSaveUnloadableReason,
  LivingSaveValidationContext,
} from './livingSaveTypes';

export const MAX_LIVING_SAVE_FILE_BYTES = 2 * 1024 * 1024;

export type LivingSaveFileParseResult =
  | {
      ok: true;
      envelope: LivingSaveSessionEnvelope;
    }
  | {
      ok: false;
      code: 'malformed' | 'oversized' | LivingSaveUnloadableReason;
      reason: string;
    };

export function serializeLivingSaveFile(
  envelope: LivingSaveSessionEnvelope,
): string {
  return `${JSON.stringify(envelope, null, 2)}\n`;
}

export async function parseLivingSaveFileText(
  text: string,
  validationContext: LivingSaveValidationContext,
): Promise<LivingSaveFileParseResult> {
  if (new TextEncoder().encode(text).byteLength > MAX_LIVING_SAVE_FILE_BYTES) {
    return {
      ok: false,
      code: 'oversized',
      reason: 'The save file is too large.',
    };
  }

  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    return {
      ok: false,
      code: 'malformed',
      reason: 'The save file is not valid JSON.',
    };
  }

  const result = await validateLivingSaveSessionEnvelope(
    value,
    validationContext,
  );
  if (!result.ok) {
    return result;
  }

  return {
    ok: true,
    envelope: result.envelope,
  };
}
