import { endsWith } from 'lodash'

let baseUrl = ''

const normalizeBase = (value: string) => value.trim().replace(/\/+$/, '')

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
  baseUrl = normalizeBase(url)
}

export function getAssetUrl(assetPath: string, type?: VideoMediaStrings) {
  const path = assetPath.replace('deck', 'Deck')
  return `${baseUrl}/${path}${
    type && !endsWith(assetPath, type) ? `.${type}` : ''
  }`.replaceAll('#', '%23')
}

export function getPanoAnimUrl(assetPath: string) {
  return getAssetUrl(assetPath)
}
