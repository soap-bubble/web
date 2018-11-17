import { endsWith } from 'lodash';
import { isIOS } from 'utils/isSafari';
export const url = config.assetHost;

export function getAssetUrl(assetPath, type) {
  const path = assetPath.replace('deck', 'Deck');
  return `${url}/${path}${type && !endsWith(assetPath, type) ? `.${type}` : ''}`.replace('#', '%23');
}

export function getPanoAnimUrl(assetPath) {
  if (isIOS) {
    return `/api/brokeniOSProxy/${assetPath}`;
  }
  return getAssetUrl(assetPath);
}
