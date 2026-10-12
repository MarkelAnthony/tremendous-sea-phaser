import Phaser from "phaser";
import { drawShipDeck } from "./SeaShipDeck";
import { assetUrl } from "../pixellab/templateAssetPaths";

/** Captain-specific ship scenery. Act scenery is deliberately left for a later pass. */
export function drawCaptainShip(scene: Phaser.Scene, root: Phaser.GameObjects.Container, captain: string): void {
  drawShipDeck(scene, root, captain);

}

export function preloadCaptainShips(scene: Phaser.Scene): void {
  scene.load.image("branch-ship", new URL("art/branch-ship.png", document.baseURI).href);
  scene.load.image("kindleroot-deck", assetUrl("images", "3fd01aa3-ba6b-5567-a564-5b0cb564bfe6", "image.png"));
}
(window as unknown as Record<string, unknown>).shipPreview = () => {
  const game = (window as unknown as { game?: Phaser.Game }).game;
  const scene = game?.scene.getScenes(true)[0] as (Phaser.Scene & { uiRoot?: Phaser.GameObjects.Container }) | undefined;
  return { captain: scene?.uiRoot?.getData("shipCaptain"), theme: scene?.uiRoot?.getData("shipTheme"), loaded: scene?.textures.exists("branch-ship"), deckLoaded: scene?.textures.exists("kindleroot-deck"), deckArt: scene?.uiRoot?.getData("deckArt"), combatSurface: scene?.uiRoot?.getData("combatSurface") };
};
