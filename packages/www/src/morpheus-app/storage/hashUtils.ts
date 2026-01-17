import type { GamestateDelta } from './types';

const encoder = new TextEncoder();

type CanonicalDelta = Array<[number, number]>;

function canonicalizeDelta(delta: GamestateDelta): CanonicalDelta {
  return Object.keys(delta)
    .map((key) => Number(key))
    .sort((a, b) => a - b)
    .map((key) => [key, delta[key]]);
}

export async function hashString(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(value));
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

export async function computeEntryId(
  parentId: string | null,
  delta: GamestateDelta,
): Promise<string> {
  const canonical = JSON.stringify({
    parentId,
    delta: canonicalizeDelta(delta),
  });
  return hashString(canonical);
}
