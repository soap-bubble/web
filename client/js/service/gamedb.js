import uasParser from 'user-agent-parser';
import { endsWith } from 'lodash';

const userAgentString = (global.navigator && global.navigator.userAgent) || '';
const uas = uasParser(userAgentString);

export const url = process.env.NODE_ENV === 'production' ?
  'https://s3-us-west-2.amazonaws.com/soapbubble-morpheus-dev/'
  : '';

export function getAssetUrl(assetPath, type) {
  const path = assetPath.replace('deck', 'Deck');
  return `${url}${path}${type && !endsWith(assetPath, type) ? `.${type}` : ''}`;
}

export function getPanoAnimUrl(assetPath) {
  if (uas.browser.name.indexOf('Safari') && uas.os.name === 'iOS') {
    return `/api/brokeniOSProxy/${assetPath}`;
  }
  return getAssetUrl(assetPath);
}
