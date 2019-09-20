export declare const url: string;
declare enum VideoMedia {
    mp4 = 0,
    webm = 1
}
declare type VideoMediaStrings = keyof VideoMedia;
export declare function getAssetUrl(assetPath: string, type?: VideoMediaStrings): string;
export declare function getPanoAnimUrl(assetPath: string): string;
export {};
