import Phaser from "phaser";
import { BootScene } from "./scenes/BootScene";
import { GameScene } from "./scenes/GameScene";
import "./styles.css";
import { startSea } from "./gameplay/startSea";

// Global error handler: surfaces ALL runtime errors visibly on-screen
// so the agent's smoke test (screenshot + console check) always catches them.
// Also exposes window.gameErrors API for programmatic error retrieval.
interface GameError { message: string; isWarning: boolean }
const collectedErrors: GameError[] = [];
(window as unknown as Record<string, unknown>).gameErrors = {
  getErrors: () => collectedErrors,
};

function showFatalError(message: string): void {
  console.error("[GAME_ERROR]", message);
  collectedErrors.push({ message, isWarning: false });
  let overlay = document.getElementById("error-overlay");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "error-overlay";
    overlay.style.cssText =
      "position:fixed;inset:0;background:rgba(0,0,0,0.85);color:#ff4444;" +
      "font:14px/1.6 monospace;padding:24px;z-index:99999;overflow:auto;white-space:pre-wrap;";
    document.body.appendChild(overlay);
  }
  overlay.textContent += message + "\n\n";
}

window.onerror = (_event, source, line, col, error) => {
  const location = source ? `${source}:${line}:${col}` : "unknown";
  showFatalError(`Uncaught error at ${location}\n${error?.stack ?? error ?? "unknown"}`);
};

window.onunhandledrejection = (event: PromiseRejectionEvent) => {
  const reason = event.reason;
  const message = reason instanceof Error ? reason.stack ?? reason.message : String(reason);
  showFatalError(`Unhandled promise rejection\n${message}`);
};

function startPlatformer(): void {
const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: "app",
  backgroundColor: "#111111",
  pixelArt: true,
  scale: {
    mode: Phaser.Scale.RESIZE,
    width: "100%",
    height: "100%",
  },
  scene: [BootScene, GameScene],
};

const game = new Phaser.Game(config);

// A canvas is opaque to automated playtesting. agent-browser and Playwright can
// press keys and take screenshots, but cannot answer "did that hit land?" or even
// "where is the player?" So expose the state programmatically.
(window as unknown as Record<string, unknown>).game = game;
(window as unknown as Record<string, unknown>).playtest = () => {
  const scene = game.scene.getScenes(true)[0] as Phaser.Scene | undefined;
  if (!scene) return { scene: null, errors: collectedErrors.length };
  const camera = scene.cameras?.main;
  const world = scene.physics?.world as Phaser.Physics.Arcade.World | undefined;
  const bodies: Phaser.Physics.Arcade.Body[] = world
    ? (Array.from(world.bodies) as Phaser.Physics.Arcade.Body[])
    : [];
  return {
    scene: scene.scene.key,
    fps: Math.round(game.loop.actualFps),
    objects: scene.children?.list?.length ?? 0,
    bodies: bodies.map((body) => {
      const owner = body.gameObject as Phaser.GameObjects.Sprite | undefined;
      return {
        x: Math.round(body.x),
        y: Math.round(body.y),
        name: owner?.name || owner?.texture?.key || "?",
      };
    }),
    camera: camera
      ? { x: Math.round(camera.scrollX), y: Math.round(camera.scrollY) }
      : null,
    errors: collectedErrors.length,
  };
};
}

if (new URLSearchParams(location.search).get("mode") === "platformer") startPlatformer();
else void startSea();
