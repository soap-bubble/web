import uasParser from 'user-agent-parser';

const userAgentString = navigator && navigator.userAgent || '';
const uas = uasParser(userAgentString);

export const url = process.env.NODE_ENV === 'production' ?
  'https://s3-us-west-2.amazonaws.com/soapbubble-morpheus-dev/'
  : '';

export function getPanoAnimUrl(assetPath) {
  if (uas.browser.name.indexOf('Safari') && uas.os.name === 'iOS') {
    return `/api/brokeniOSProxy/${assetPath}`;
  }
  return getAssetUrl(assetPath);
}

export function getAssetUrl(assetPath) {
  return `${url}${assetPath}`;
}
