
export const url = process.env.NODE_ENV === 'production' ?
  'https://s3-us-west-2.amazonaws.com/soapbubble-morpheus-dev/'
  : '';

export function getAssetUrl(assetPath) {
  return `${url}${assetPath}`;
}
