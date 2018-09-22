import uasParser from 'ua-parser-js';
import { endsWith } from 'lodash';

const userAgentString = (global.navigator && global.navigator.userAgent) || '';
const uas = uasParser(userAgentString);

export const url = config.assetHost;

export function getAssetUrl(assetPath, type) {
  const path = assetPath.replace('deck', 'Deck');
  return `${url}/${path}${type && !endsWith(assetPath, type) ? `.${type}` : ''}`.replace('#', '%23');
}

export function getPanoAnimUrl(assetPath) {
  if (uas.browser.name.indexOf('Safari') && uas.os.name === 'iOS') {
    return `/api/brokeniOSProxy/${assetPath}`;
  }
  return getAssetUrl(assetPath);
}
