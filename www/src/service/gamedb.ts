import { endsWith } from "lodash";
import { isIOS } from "../utils/isSafari";
export const url = process.env.ASSET_HOST;

enum VideoMedia {
  mp4,
  webm,
  png,
  mp3,
  ogg,
}
type VideoMediaStrings = keyof typeof VideoMedia;

export function getAssetUrl(assetPath: string, type?: VideoMediaStrings) {
  const path = assetPath.replace("deck", "Deck");
  return `${url}/${path}${
    type && !endsWith(assetPath, type) ? `.${type}` : ""
  }`.replace("#", "%23");
}

export function getPanoAnimUrl(assetPath: string) {
  if (isIOS) {
    return `/api/brokeniOSProxy/${assetPath}`;
  }
  return getAssetUrl(assetPath);
}
