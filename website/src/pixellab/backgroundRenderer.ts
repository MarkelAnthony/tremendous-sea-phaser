import Phaser from "phaser";
import { assetUrl } from "./templateAssetPaths";
import type { LoadedMap } from "./types";

const BACKGROUND_DEPTH = -200000;
const HORIZONTAL_PARALLAX = 0.2;

export function preloadMapBackground(scene: Phaser.Scene, mapData: LoadedMap): void {
  const background = mapData.map.background;
  if (!background) return;
  scene.load.image(`map-background-${mapData.folder}`, assetUrl("maps", mapData.folder, background.filename));
}

/** Background texels use the same camera scale as character and terrain texels. */
export function createMapBackground(scene: Phaser.Scene, mapData: LoadedMap): void {
  const background = mapData.map.background;
  if (!background) return;
  const key = `map-background-${mapData.folder}`;
  const { width: imageWidth, height: imageHeight } = background.dimensions;
  const forest = scene.add.tileSprite(0, 0, 1, 1, key, "__BASE").setScrollFactor(0).setDepth(BACKGROUND_DEPTH);
  const resize = () => {
    const { width, height } = scene.scale;
    // Fit the complete forest height; its seamless edges repeat across any width.
    // Share this zoom with foreground art so source pixels have the same scale.
    const zoom = height / imageHeight;
    scene.cameras.main.setZoom(zoom);
    // Scroll-factor zero still uses camera zoom around the viewport center.
    forest.setSize(width / zoom, height / zoom)
      .setPosition(width / 2, height / 2)
      .setTileScale(1)
      .setTilePosition((imageWidth - width / zoom) / 2, 0);
  };
  const scroll = () => {
    const camera = scene.cameras.main;
    const visibleWidth = camera.width / camera.zoom;
    const viewLeft = camera.scrollX + (camera.width - visibleWidth) / 2;
    const offset = (imageWidth - visibleWidth) / 2 + viewLeft * HORIZONTAL_PARALLAX;
    // Quantize in screen pixels, not source texels: fractional sampling makes
    // nearest-filtered edges shimmer as the camera eases between positions.
    const screenScale = camera.zoom * scene.game.canvas.width / scene.scale.width;
    forest.setTilePosition(Math.round(offset * screenScale) / screenScale, 0);
  };
  resize();
  scene.events.on("postupdate", scroll);
  scene.scale.on("resize", resize);
  scene.events.once("shutdown", () => {
    scene.scale.off("resize", resize);
    scene.events.off("postupdate", scroll);
  });
}
