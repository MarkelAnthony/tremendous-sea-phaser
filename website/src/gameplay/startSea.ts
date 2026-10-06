import Phaser from "phaser";
import "./SeaCaptainArt";
import "./SeaBranchBurn";
import "./SeaBranchSpecial";

/** Keep the handoff's renderer-agnostic rules untouched and load in their original order. */
export async function startSea(): Promise<void> {
  const globals = window as unknown as Record<string, unknown>;
  globals.Phaser = Phaser;
  document.body.classList.add("sea-game");
  for (const name of ["data", "engine", "ui", "phaser-scene"]) {
    if (name === "phaser-scene") document.getElementById("app")!.replaceChildren();
    await new Promise<void>((resolve, reject) => {
      const script = document.createElement("script");
      // Public files are copied as-is; use the deployment-relative root.
      script.src = new URL(`legacy/${name}.js?v=${Date.now()}`, document.baseURI).href;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Could not load ${name}`));
      document.head.appendChild(script);
    });
  }
}

/** Accessible DOM hit targets follow the original canvas layout at every viewport size. */
export function mountSeaControls(game: Phaser.Game): void {
  const root = document.getElementById("hud-root")!;
  let signature = "";
  const refresh = () => {
    const scene = game.scene.getScenes(true)[0];
    const canvas = game.canvas.getBoundingClientRect();
    if (!scene || !canvas.width) return;
    const controls: { object: Phaser.GameObjects.GameObject; x: number; y: number; w: number; h: number; label: string }[] = [];
    const visit = (object: Phaser.GameObjects.GameObject, parentX = 0, parentY = 0) => {
      const item = object as Phaser.GameObjects.Container;
      if (item.visible === false || !item.active) return;
      const x = parentX + (item.x || 0), y = parentY + (item.y || 0);
      if (item.input?.enabled) {
        const siblings = item.parentContainer?.list || [];
        const text = siblings.filter((s) => s instanceof Phaser.GameObjects.Text).map((s) => (s as Phaser.GameObjects.Text).text).join(" · ");
        controls.push({ object, x, y, w: item.width || 110, h: item.height || 150, label: text || "Select target" });
      }
      if (Array.isArray(item.list)) item.list.forEach((child) => visit(child, x, y));
    };
    scene.children.list.forEach((child) => visit(child));
    const next = JSON.stringify(controls.map((c) => [c.x,c.y,c.w,c.h,c.label])) + canvas.width + canvas.height;
    if (signature === next && root.childElementCount === controls.length) return;
    signature = next;
    root.replaceChildren();
    controls.forEach((control) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "sea-control";
      button.setAttribute("aria-label", control.label);
      button.title = control.label;
      button.style.cssText = `position:absolute;left:${canvas.left+(control.x-control.w/2)*canvas.width/1000}px;top:${canvas.top+(control.y-control.h/2)*canvas.height/700}px;width:${control.w*canvas.width/1000}px;height:${control.h*canvas.height/700}px;pointer-events:auto;background:transparent;border:0;color:transparent;cursor:pointer;`;
      button.textContent = control.label;
      button.onclick = () => { control.object.emit("pointerdown"); signature = ""; };
      button.onmouseenter = () => control.object.emit("pointerover");
      button.onmouseleave = () => control.object.active && control.object.emit("pointerout");
      root.appendChild(button);
    });
  };
  game.events.on("poststep", refresh);
}
(window as unknown as Record<string, unknown>).mountSeaControls = mountSeaControls;
