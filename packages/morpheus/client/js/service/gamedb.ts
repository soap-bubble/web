import { endsWith } from 'lodash'
import { isIOS } from '../utils/isSafari'

let baseUrl = ''

enum VideoMedia {
  mp4,
  webm,
  png,
  mp3,
  ogg,
  aac,
}
type VideoMediaStrings = keyof typeof VideoMedia

export function setBaseUrl(url: string) {
  baseUrl = url
}

export function getAssetUrl(assetPath: string, type?: VideoMediaStrings) {
  const path = assetPath.replace('deck', 'Deck')
  return `${baseUrl}/${path}${
    type && !endsWith(assetPath, type) ? `.${type}` : ''
  }`.replace('#', '%23')
}

export function getPanoAnimUrl(assetPath: string) {
  if (isIOS) {
    return `/api/brokeniOSProxy/${assetPath}`
  }
  return getAssetUrl(assetPath)
}
