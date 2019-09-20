"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lodash_1 = require("lodash");
const isSafari_1 = require("utils/isSafari");
exports.url = config.assetHost;
var VideoMedia;
(function (VideoMedia) {
    VideoMedia[VideoMedia["mp4"] = 0] = "mp4";
    VideoMedia[VideoMedia["webm"] = 1] = "webm";
})(VideoMedia || (VideoMedia = {}));
function getAssetUrl(assetPath, type) {
    const path = assetPath.replace('deck', 'Deck');
    return `${exports.url}/${path}${type && !lodash_1.endsWith(assetPath, type) ? `.${type}` : ''}`.replace('#', '%23');
}
exports.getAssetUrl = getAssetUrl;
function getPanoAnimUrl(assetPath) {
    if (isSafari_1.isIOS) {
        return `/api/brokeniOSProxy/${assetPath}`;
    }
    return getAssetUrl(assetPath);
}
exports.getPanoAnimUrl = getPanoAnimUrl;
//# sourceMappingURL=gamedb.js.map