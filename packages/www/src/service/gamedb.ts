import {
  getAssetUrl,
  getPanoAnimUrl,
  setBaseUrl,
} from '@soapbubble/morpheus-client/service/gamedb';

const normalizeBase = (value: string) => value.trim().replace(/\/+$/, '');
const configuredOrigin =
  process.env.NEXT_PUBLIC_MORPHEUS_GAMEDB_ORIGIN ||
  process.env.MORPHEUS_GAMEDB_ORIGIN ||
  '';
export const gameDbOrigin = normalizeBase(configuredOrigin);

setBaseUrl(gameDbOrigin);

export { getAssetUrl, getPanoAnimUrl };
