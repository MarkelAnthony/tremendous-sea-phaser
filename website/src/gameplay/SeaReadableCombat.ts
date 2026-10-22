/** Readable DOM card faces and intent labels; the combat rules remain untouched. */
import Phaser from "phaser";
import { intentSymbols, statusSymbols } from "./SeaCombatSymbols";
import "./SeaReadableChoices.css";
import "./SeaCandyCards.css";
import "./SeaJewelCards.css";
import "./SeaAmethystCards.css";
import { createRibbonTitle, fitRibbonTitles } from "./SeaRibbonTitle";

interface ReadableInfo { kind: "card" | "choice" | "intent" | "enemy"; name: string; text: string; cost?: number; width: number; height: number; offsetY?: number; playable?: boolean; index?: number; rarity?: string; status?: Record<string, number | boolean>; armored?: boolean }
export function mountSeaReadability(game: Phaser.Game): void {
  const layer = document.createElement("div");
  layer.className = "sea-readability";
  layer.style.setProperty("--jewel-card-art", `url("${new URL("art/approved-ribbon-card.svg", document.baseURI).href}")`);
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
    const handItems = items.filter(item => item.info.kind === "card");
    if (handItems.length) {
      const usableWidth = Math.min(Math.max(1, Math.min(window.innerWidth - 12, rect.left + 800 * sx) - Math.max(12, rect.left + 20 * sx)), 1120);
      // Keep a five-card footprint even as cards are played; never grow into the action.
      const handSlots = Math.max(5, handItems.length);
      const cardHeight = Math.min(220, (usableWidth - 8 * (handSlots - 1)) / handSlots) * (328 / 224);
      const trayTop = Math.max(440, 700 - (cardHeight + 6 * sy) / sy - 12);
      const scene = game.scene.getScenes(true)[0];
      const adjustTray = (object: Phaser.GameObjects.GameObject) => {
        if (object.getData("compactHandTray")) {
          const tray = object as Phaser.GameObjects.Graphics;
          tray.clear().fillGradientStyle(0x302016, 0x3d291b, 0x100e0c, 0x211a15, 1).fillRect(0, trayTop, 1000, 700 - trayTop);
          for (let y = trayTop + 26; y < 700; y += 35) tray.lineStyle(1, 0xb18043, .18).lineBetween(0, y, 1000, y);
          for (let i = 0; i < 144; i++) tray.lineStyle(3, i % 2 ? 0x907044 : 0xc4a372, .9).lineBetween(i * 7, trayTop, i * 7 + 6, trayTop + 7);
        }
        const container = object as Phaser.GameObjects.Container;
        if (Array.isArray(container.list)) container.list.forEach(adjustTray);
      };
      scene?.children.list.forEach(adjustTray);
    }
    for (const {info, x, y, choose} of items) {
      const el = document.createElement(info.kind === "card" || info.kind === "choice" ? "button" : "div");
      el.className = `sea-readable-${info.kind}`;
      const hand = items.filter(item => item.info.kind === "card");
      const isHand = info.kind === "card";
      const gap = 8;
      // Match the canvas's reserved End Turn gutter, including focus/hover outlines.
      // Both the visible faces and their click targets must stay left of the button.
      const handLeft = Math.max(12, rect.left + 20 * sx);
      const handRight = Math.min(window.innerWidth - 12, rect.left + 800 * sx);
      const handWidth = Math.min(Math.max(1, handRight - handLeft), 1120);
      const handSlots = Math.max(5, hand.length);
      const width = isHand ? Math.min(220, (handWidth - gap * (handSlots - 1)) / handSlots) : info.width * sx;
      const height = isHand || info.kind === "choice" ? width * (328 / 224) : info.height * sy;
      // Anchor the compact hand to the game, not to empty space below a fitted canvas.
      const top = isHand ? rect.bottom - height - 6 * sy : info.kind === "choice" ? rect.top + y * sy - height / 2 : rect.top+(y-info.height/2)*sy;
      const handIndex = hand.findIndex(item => item.info === info);
      const totalWidth = hand.length * width + (hand.length - 1) * gap;
      const left = isHand ? handLeft + (handWidth - totalWidth) / 2 + handIndex * (width + gap) : rect.left+(x-info.width/2)*sx;
      el.style.cssText = `left:${left}px;top:${top}px;width:${width}px;height:${height}px;--read-scale:${Math.min(sx, 1.2)};--card-width:${width}px;`;
      if (info.kind === "choice") {
        const cost = document.createElement("b");
        cost.className = "sea-choice-cost";
        cost.textContent = String(info.cost ?? 0);
        cost.setAttribute("aria-label", `${info.cost ?? 0} energy`);
        cost.title = `${info.cost ?? 0} energy · ${info.rarity}`;
        const title = createRibbonTitle(info.name);
        const desc = document.createElement("span");
        desc.className = "sea-choice-description";
        desc.textContent = info.text;
        const action = document.createElement("small");
        action.textContent = "Add to deck";
        el.append(cost, title, desc, action);
        el.setAttribute("aria-label", `Choose ${info.name}. ${info.cost} energy. ${info.text}`);
        el.dataset.rarity = String(info.rarity || "").toLowerCase();
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
          let hoverTimer: ReturnType<typeof setTimeout> | undefined;
          const cancelHover = () => { clearTimeout(hoverTimer); el.removeAttribute("data-inspected"); };
          const beginHover = () => {
            cancelHover();
            hoverTimer = setTimeout(() => {
              if (el.isConnected && (el.matches(":hover") || document.activeElement === el)) el.dataset.inspected = "true";
            }, 3000);
          };
          el.onmouseenter = beginHover;
          el.onmouseleave = cancelHover;
          el.onfocus = beginHover;
          el.onblur = cancelHover;
        }
        el.setAttribute("aria-label", detail.textContent || info.name);
        el.append(detail);
        layer.append(el);
        continue;
      }
      const title = createRibbonTitle(info.name);
      const desc = document.createElement("span");
      desc.textContent = info.text;
      el.append(title, desc);
      if (info.kind === "card") {
        const cost = document.createElement("b");
        cost.className = "sea-readable-cost";
        cost.textContent = String(info.cost ?? 0);
        cost.setAttribute("aria-label", `${info.cost ?? 0} energy`);
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
    // Fit live lettering inside the approved blank ribbon and lilac rules panel.
    // Never stretch the frame or introduce a scrolling text box.
    fitRibbonTitles(layer);
    layer.querySelectorAll<HTMLElement>(".sea-readable-card > span, .sea-choice-description").forEach(text => {
      let size = parseFloat(getComputedStyle(text).fontSize);
      while ((text.scrollHeight > text.clientHeight + 1 || text.scrollWidth > text.clientWidth + 1) && size > 9) {
        size -= 0.5;
        text.style.setProperty("font-size", `${size}px`, "important");
      }
    });
    // A shared baseline and height keep the hand looking like a coherent card row.
    const faces = [...layer.querySelectorAll<HTMLElement>(".sea-readable-card")];
    const rowHeight = Math.max(0, ...faces.map(face => face.offsetHeight));
    faces.forEach(face => {
      face.style.height = `${rowHeight}px`;
      face.style.top = `${Math.max(8, rect.bottom - rowHeight - 6 * sy)}px`;
    });
  });
}
(window as unknown as Record<string, unknown>).mountSeaReadability = mountSeaReadability;
