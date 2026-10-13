/** Readable DOM card faces and intent labels; the combat rules remain untouched. */
import Phaser from "phaser";

interface ReadableInfo { kind: "card" | "intent"; name: string; text: string; cost?: number; width: number; height: number; offsetY?: number; playable?: boolean; index?: number }
export function mountSeaReadability(game: Phaser.Game): void {
  const layer = document.createElement("div");
  layer.className = "sea-readability";
  document.getElementById("hud-root")!.appendChild(layer);
  let signature = "";
  game.events.on("poststep", () => {
    const items: {info: ReadableInfo; x: number; y: number}[] = [];
    const visit = (object: Phaser.GameObjects.GameObject, px = 0, py = 0) => {
      const node = object as Phaser.GameObjects.Container;
      if (!node.active || !node.visible) return;
      const x = px + (node.x || 0), y = py + (node.y || 0);
      const info = node.getData("readableInfo") as ReadableInfo | undefined;
      if (info) items.push({info, x, y: y + (info.offsetY || 0)});
      if (Array.isArray(node.list)) node.list.forEach(child => visit(child, x, y));
    };
    game.scene.getScenes(true)[0]?.children.list.forEach(child => visit(child));
    const rect = game.canvas.getBoundingClientRect();
    const next = JSON.stringify([items, rect.width, rect.height, rect.left, rect.top]);
    if (next === signature) return;
    signature = next;
    layer.replaceChildren();
    const sx = rect.width / 1000, sy = rect.height / 700;
    for (const {info, x, y} of items) {
      const el = document.createElement(info.kind === "card" ? "button" : "div");
      el.className = `sea-readable-${info.kind}`;
      el.style.cssText = `left:${rect.left+(x-info.width/2)*sx}px;top:${rect.top+(y-info.height/2)*sy}px;width:${info.width*sx}px;height:${info.height*sy}px;--read-scale:${sx};`;
      const title = document.createElement("strong");
      title.textContent = info.kind === "card" ? info.name : "NEXT ACTION";
      const desc = document.createElement("span");
      desc.textContent = info.text;
      el.append(title, desc);
      if (info.kind === "card") {
        const cost = document.createElement("b");
        cost.className = "sea-readable-cost";
        cost.textContent = `${info.cost} energy`;
        el.prepend(cost);
        el.setAttribute("aria-label", `${info.name}. ${info.cost} energy. ${info.text}${info.playable ? "" : ". Cannot play now"}`);
        el.title = `${info.name} — ${info.cost} energy\n${info.text}`;
        el.dataset.playable = String(info.playable);
        el.onclick = () => { if (info.playable) (window as unknown as {chooseSeaCard: (index: number) => void}).chooseSeaCard(info.index!); };
        const detail = document.createElement("div");
        detail.className = "sea-card-inspect";
        detail.textContent = `${info.name} · ${info.cost} energy\n${info.text}`;
        el.append(detail);
      } else {
        el.dataset.attack = String(/attack|damage/i.test(info.text));
        el.setAttribute("aria-label", `${info.name}: ${info.text}`);
      }
      layer.appendChild(el);
    }
  });
}
(window as unknown as Record<string, unknown>).mountSeaReadability = mountSeaReadability;
