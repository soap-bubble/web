import { afterEach, describe, expect, it, vi } from 'vitest';

async function loadGameDb(origin?: string) {
  vi.resetModules();
  if (origin === undefined) {
    vi.unstubAllEnvs();
  } else {
    vi.stubEnv('NEXT_PUBLIC_MORPHEUS_GAMEDB_ORIGIN', origin);
  }
  return import('./gamedb');
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('GameDB URL resolution', () => {
  it('uses one GameDB path segment at a configured public origin', async () => {
    const { getAssetUrl } = await loadGameDb('https://media.example.com/');

    expect(getAssetUrl('GameDB/Deck1/introMOV.webm')).toBe(
      'https://media.example.com/GameDB/Deck1/introMOV.webm',
    );
  });

  it('preserves same-origin paths when no public origin is configured', async () => {
    const { getAssetUrl } = await loadGameDb();

    expect(getAssetUrl('GameDB/OAsounds/claireSRMSC', 'ogg')).toBe(
      '/GameDB/OAsounds/claireSRMSC.ogg',
    );
  });

  it('encodes authored hash characters in direct panorama-animation URLs', async () => {
    const { getPanoAnimUrl } = await loadGameDb('https://media.example.com');

    expect(getPanoAnimUrl('GameDB/Deck1/door#1ANI')).toBe(
      'https://media.example.com/GameDB/Deck1/door%231ANI',
    );
  });

  it('normalizes the engine public origin and keeps panorama animation direct', async () => {
    const { getAssetUrl, getPanoAnimUrl, setBaseUrl } = await import(
      '@soapbubble/morpheus-client/service/gamedb'
    );

    setBaseUrl('https://media.example.com/');

    expect(getAssetUrl('GameDB/Deck1/introMOV.webm')).toBe(
      'https://media.example.com/GameDB/Deck1/introMOV.webm',
    );
    expect(getPanoAnimUrl('GameDB/Deck1/door#1ANI')).toBe(
      'https://media.example.com/GameDB/Deck1/door%231ANI',
    );
    setBaseUrl('');
  });
});
