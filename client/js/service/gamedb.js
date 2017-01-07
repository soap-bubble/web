import  {
  gameDbUrl,
} from 'config';

export function getAssetUrl(assetPath) {
  return `${gameDbUrl}/${assetPath}`;
}

export function lint() {}
