/** Readable DOM card faces and intent labels; the combat rules remain untouched. */
import Phaser from "phaser";
import { intentSymbols, statusSymbols } from "./SeaCombatSymbols";
import "./SeaReadableChoices.css";

interface ReadableInfo { kind: "card" | "choice" | "intent" | "enemy"; name: string; text: string; cost?: number; width: number; height: number; offsetY?: number; playable?: boolean; index?: number; rarity?: string; status?: Record<string, number | boolean>; armored?: boolean }
export function mountSeaReadability(game: Phaser.Game): void {
  const layer = document.createElement("div");
  layer.className = "sea-readability";
  document.getElementById("hud-root")!.appendChild(layer);
  let signature = "";
  game.events.on("poststep", () => {
    const items: {info: ReadableInfo; x: number; y: number; choose?: () => void}[] = [];
    const visit = (object: Phaser.GameObjects.GameObject, px = 0, py = 0) => {
      const node = object as Phaser.GameObjects.Container;
      if (!node.active || !node.visible) return;
      const x = px + (node.x || 0), y = py + (node.y || 0);
      const info = node.getData("readableInfo") as ReadableInfo | undefined;
      if (info) items.push({info, x, y: y + (info.offsetY || 0), choose: node.getData("readableChoose") as (() => void) | undefined});
      const enemy = node.getData("enemyHoverInfo") as ReadableInfo | undefined;
      if (enemy) items.push({info: {...enemy, kind: "enemy"}, x, y});
      if (Array.isArray(node.list)) node.list.forEach(child => visit(child, x, y));
    };
    game.scene.getScenes(true)[0]?.children.list.forEach(child => visit(child));
    const rect = game.canvas.getBoundingClientRect();
    const next = JSON.stringify([items, rect.width, rect.height, rect.left, rect.top]);
    if (next === signature) return;
    signature = next;
    layer.replaceChildren();
    const sx = rect.width / 1000, sy = rect.height / 700;
    for (const {info, x, y, choose} of items) {
      const el = document.createElement(info.kind === "card" || info.kind === "choice" ? "button" : "div");
      el.className = `sea-readable-${info.kind}`;
      const height = info.kind === "card" ? Math.max(165, info.height * sy) : info.height * sy;
      const top = info.kind === "card" ? Math.min(rect.top+(y-info.height/2)*sy, window.innerHeight-height-8) : rect.top+(y-info.height/2)*sy;
      el.style.cssText = `left:${rect.left+(x-info.width/2)*sx}px;top:${top}px;width:${info.width*sx}px;height:${height}px;--read-scale:${sx};`;
      if (info.kind === "choice") {
        const cost = document.createElement("b");
        cost.className = "sea-choice-cost";
        cost.textContent = `${info.cost} energy · ${info.rarity}`;
        const title = document.createElement("strong");
        title.textContent = info.name;
        const desc = document.createElement("span");
        desc.className = "sea-choice-description";
        desc.textContent = info.text;
        const action = document.createElement("small");
        action.textContent = "Add to deck";
        el.append(cost, title, desc, action);
        el.setAttribute("aria-label", `Choose ${info.name}. ${info.cost} energy. ${info.text}`);
        el.onclick = () => choose?.();
        layer.append(el);
        continue;
      }
      if (info.kind !== "card") {
        el.tabIndex = 0;
        const detail = document.createElement("div");
        detail.className = "sea-symbol-tooltip";
        detail.setAttribute("role", "tooltip");
        if (info.kind === "intent") {
          const intents = intentSymbols(info.text);
          const statuses = statusSymbols(info.status, info.armored);
          const symbols = document.createElement("span");
          symbols.className = "sea-intent-symbols";
          symbols.textContent = intents.map(s => s.icon).join("  ");
          el.append(symbols);
          if (statuses.length) {
            const row = document.createElement("span");
            row.className = "sea-status-symbols";
            row.textContent = statuses.map(s => s.icon).join("  ");
            el.append(row);
          }
          detail.textContent = `${info.name} · Next action\n${intents.map(s => `${s.icon}: ${s.label}`).join("\n")}\n${info.text}${statuses.length ? `\n\nActive statuses\n${statuses.map(s => `${s.icon}: ${s.label}`).join("\n")}` : ""}`;
          el.dataset.attack = String(intents.some(s => s.label === "Attack"));
        } else {
          detail.textContent = `${info.name}\n${info.text}`;
          el.onclick = () => (window as unknown as {chooseSeaTarget: (index: number) => void}).chooseSeaTarget(info.index!);
        }
        el.setAttribute("aria-label", detail.textContent || info.name);
        el.append(detail);
        layer.append(el);
        continue;
      }
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
        detail.style.bottom = `${window.innerHeight - top + 10}px`; 
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
