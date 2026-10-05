export const MAP_FOLDER = "284a60d0-b94a-50b2-ac1d-2f869e93608a";
export const PLAYER_CHARACTER_ID = "476945d1-f351-5034-b0af-5a3e362e53ee";

export const ASSET_ROOT = "assets";

const assetVersion = (import.meta as ImportMeta & {
  env?: { VITE_PIXELLAB_BUILD_ID?: string };
}).env?.VITE_PIXELLAB_BUILD_ID?.trim();

export function assetUrl(...parts: string[]): string {
  return versionedUrl([ASSET_ROOT, ...parts].join("/"));
}

export function publicAssetUrl(...parts: string[]): string {
  return versionedUrl(parts.join("/"));
}

export function projectImageUrl(imageId: string, file = "image.png"): string {
  return assetUrl("images", imageId, file);
}

export function projectImageFrameUrl(imageId: string, frameIndex: number): string {
  return assetUrl("images", imageId, "frames", `${frameIndex}.png`);
}

function versionedUrl(path: string): string {
  return assetVersion ? `${path}?v=${encodeURIComponent(assetVersion)}` : path;
}
