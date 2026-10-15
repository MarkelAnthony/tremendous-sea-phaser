import { assetUrl } from "../pixellab/templateAssetPaths";
import "./SeaVoyageChart.css";
import "./SeaVoyageRefinements.css";

interface SeaNode { id: string; floor: number; lane: number; kind: string; connectsTo: string[] }
interface SeaState {
  act: number; captainKey: string; cap: { name: string }; player: { hp: number; maxHp: number };
  rubees: number; deck: { all: unknown[] }; mapFloors: SeaNode[][]; revealedChartAct?: number;
  visitedNodeIds: Set<string>; pendingMapChoice: boolean; revealedChartNodes?: string[];
}
const labels: Record<string, string> = {common:"Fight", elite:"Elite Fight", boss:"Boss Fight", oasis:"Oasis", event:"Mystery", shop:"Emporium"};
const icons: Record<string, string> = {common:"⚔", elite:"☠", boss:"♛", oasis:"♧", event:"?", shop:"⚓"};
// This path is filled from the completed Object receipt, never from its job ID.
let shipArt = assetUrl("objects", "7007be3e-78ee-4820-8c8e-aa11a26e9bc4", "base", "rotations", "unknown.png");
// Display-only cleanup: keep the synced original untouched, replace pendant gold
// with small colored bulbs rather than spending another generation.
const exterior = new Image();
exterior.onload = () => {
  const canvas = document.createElement("canvas"); canvas.width = 256; canvas.height = 256;
  const ctx = canvas.getContext("2d")!; ctx.drawImage(exterior, 0, 0);
  const pixels = ctx.getImageData(0, 0, 256, 256);
  for (const [x,y,w,h] of [[8,88,14,42],[14,138,16,40],[124,108,14,34]]) {
    for (let py=y;py<y+h;py++) for(let px=x;px<x+w;px++) {
      const i=(py*256+px)*4, r=pixels.data[i], g=pixels.data[i+1], b=pixels.data[i+2];
      if(r>115 && g>80 && b<g*.75 && r>g*1.08) pixels.data[i+3]=0;
    }
  }
  ctx.putImageData(pixels,0,0);
  [[30,66,"#df6e79"],[57,55,"#9edeb4"],[82,61,"#89cde5"],[104,51,"#c099e1"],[119,72,"#de7377"]].forEach(([x,y,color])=>{ctx.fillStyle=String(color);ctx.fillRect(Number(x),Number(y),2,2);});
  shipArt=canvas.toDataURL();
};
exterior.src=shipArt;
let layer: HTMLDivElement | undefined;
let sailing = false;
let activeState: SeaState | undefined;
let arrivalTimer: ReturnType<typeof setTimeout> | undefined;
function root(): HTMLDivElement {
  if (!layer) { layer = document.createElement("div"); layer.className = "sea-chart-screen"; document.getElementById("hud-root")!.append(layer); }
  const canvas = document.querySelector("canvas")?.getBoundingClientRect();
  if (canvas) layer.style.cssText = `left:${canvas.left}px;top:${canvas.top}px;width:${canvas.width}px;height:${canvas.height}px;`;
  return layer;
}
const escape = (s: string) => s.replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]!));
function islands(): string {
  return Array.from({length:11}, (_, i) => {
    const x = 65 + (i * 173) % 850, y = 70 + (i * 107) % 430;
    return `<g transform="translate(${x} ${y})" opacity=".55"><path d="M-33 8 Q-48-12-20-19 Q-12-40 7-25 Q32-29 35-5 Q55 15 19 24 Q-22 31-33 8Z" fill="#c4b184" stroke="#ddcda4" stroke-width="2"/><path d="M-27 5 Q-30-12-12-15 Q4-27 22-12 L30 5 Q0 19-27 5" fill="#4b7763"/><path d="M-13 2l8-19 8 19z M3 7l9-22 9 22z" fill="#244c42"/></g>`;
  }).join("");
}
function sail(destination: SeaNode, choose: (id: string) => void): void {
  if (sailing || !activeState?.pendingMapChoice) return;
  sailing = true;
  const target = root();
  target.innerHTML = `<div class="sea-voyage"><div class="sea-voyage-title"><small>THE KINDLEROOT · UNDER WAY</small><h2>Sailing to ${escape(labels[destination.kind] || destination.kind)}</h2><p>Ocean of Tears · Act ${activeState.act}</p></div><div class="sea-voyage-horizon"><svg viewBox="0 0 1200 200" preserveAspectRatio="none"><path d="M0 200V160L80 137 140 156 220 90 275 120 320 73 380 138 460 155 590 95 650 126 710 62 780 130 850 150 950 95 1010 138 1090 118 1200 161V200Z" fill="#345f59"/><path d="M175 150l30-70 30 70 M280 151l36-91 36 91 M630 160l35-85 35 85 M745 155l28-67 28 67" fill="#244d47"/></svg></div><div class="sea-voyage-water"></div><div class="sea-voyage-ship"><div class="sea-voyage-wake"></div><img src="${shipArt}" alt="Kindleroot: living tree ship with a leaf sail"/></div><div class="sea-voyage-caption">A living home, carried by the wind.<br><span>Arriving in a moment…</span></div></div>`;
  arrivalTimer = setTimeout(() => {
    sailing = false;
    target.hidden = true;
    choose(destination.id);
  }, 2600);
}
function draw(state: SeaState, current: SeaNode | null, choose: (id: string) => void): void {
  if (sailing) return;
  activeState = state;
  const target = root(); target.hidden = false;
  const nodes = state.mapFloors.flat();
  const reachable = new Set(state.pendingMapChoice ? current?.connectsTo || [] : []);
  const revealed = new Set(state.revealedChartAct === state.act ? state.revealedChartNodes || [] : []);
  state.revealedChartAct = state.act;
  state.visitedNodeIds.forEach(id => revealed.add(id));
  reachable.forEach(id => revealed.add(id));
  state.revealedChartNodes = [...revealed];
  const cols = Math.ceil(state.mapFloors.length / 3);
  const positions = new Map(nodes.map(node => {
    const band = Math.floor(node.floor / cols), col = node.floor % cols;
    const laneCount = state.mapFloors[node.floor].length;
    return [node.id, {x:105 + (band % 2 ? cols - 1 - col : col) * (790 / Math.max(1, cols - 1)), y:115 + band * 175 + (node.lane - (laneCount - 1) / 2) * 55}];
  }));
  let routes = "";
  nodes.forEach(node => node.connectsTo.forEach(id => {
    const a = positions.get(node.id), b = positions.get(id); if (!a || !b) return;
    const available = current?.id === node.id && reachable.has(id);
    const visited = state.visitedNodeIds.has(node.id) && state.visitedNodeIds.has(id);
    routes += `<path d="M${a.x} ${a.y} C${a.x} ${(a.y+b.y)/2},${b.x} ${(a.y+b.y)/2},${b.x} ${b.y}" fill="none" stroke="${available ? "#ffe3a1" : visited ? "#acd6b2" : "#89aaa1"}" stroke-width="${available ? 3 : 1.3}" opacity="${available || visited ? 1 : .35}" ${visited ? "" : 'stroke-dasharray="4 5"'}/>`;
  }));
  target.innerHTML = `<div class="sea-chart-header"><small>THE TREMENDOUS SEA · ACT ${state.act}</small><h2>${state.act===1 ? "Ocean of Tears" : state.act===2 ? "Candied Ocean" : "The Eternal Dark"}</h2><p>${escape(state.cap.name)} · ♥ ${state.player.hp}/${state.player.maxHp} · ${state.rubees} Rubees · ${state.deck.all.length} cards</p></div><div class="sea-chart-body"><svg viewBox="0 0 1000 590" preserveAspectRatio="none" aria-hidden="true"><defs><pattern id="chart-ripples" width="70" height="35" patternUnits="userSpaceOnUse"><path d="M5 22q12-7 24 0t24 0" fill="none" stroke="#96b8a8" opacity=".12"/></pattern></defs><rect width="1000" height="590" fill="#204b50"/><rect width="1000" height="590" fill="url(#chart-ripples)"/>${islands()}${routes}<g transform="translate(895 500)" stroke="#cbbb92" fill="none" opacity=".6"><circle r="36"/><circle r="28"/><path d="M0-45V45M-45 0H45M-25-25L25 25M25-25L-25 25"/><path d="M0-35l-7 35 7 35 7-35z" fill="#cbbb92"/><text y="-50" text-anchor="middle" fill="#e2d5ac" stroke="none" font-size="14">N</text></g></svg></div><div class="sea-chart-footer"><b>${state.pendingMapChoice ? "Choose your next port" : "Your journey"}</b><span>Lit ports are within reach · Distant dots remain unknown</span><div>⚔ Fight &nbsp; ☠ Elite &nbsp; ♧ Oasis &nbsp; ? Mystery &nbsp; ⚓ Shop &nbsp; ♛ Boss</div></div>`;
  const body = target.querySelector<HTMLDivElement>(".sea-chart-body")!;
  nodes.forEach(node => {
    const p = positions.get(node.id)!; const known = revealed.has(node.id), visited = state.visitedNodeIds.has(node.id), here = node.id === current?.id;
    const el = document.createElement("button"); el.type = "button";
    el.className = `sea-chart-node${reachable.has(node.id) ? " reachable" : ""}${visited ? " visited" : ""}${here ? " current" : ""}`;
    el.style.cssText = `left:${p.x/10}%;top:${p.y/5.9}%;`;
    el.disabled = !reachable.has(node.id);
    el.dataset.nodeId = node.id; el.dataset.revealed = String(known);
    el.setAttribute("aria-label", known ? `${here ? "Current port: " : visited ? "Visited: " : "Sail to "}${labels[node.kind] || node.kind}, stage ${node.floor+1}` : `Uncharted port, stage ${node.floor+1}`);
    el.innerHTML = `<span class="sea-chart-dot">${known ? icons[node.kind] || "•" : ""}</span>${reachable.has(node.id) ? `<span class="sea-chart-label">${labels[node.kind]}</span>` : ""}${here ? `<span class="sea-chart-here">Kindleroot ⚓</span>` : ""}`;
    el.onclick = () => sail(node, choose);
    body.append(el);
  });
}
const globals = window as unknown as Record<string, unknown>;
globals.drawSeaChart = draw;
globals.hideSeaChart = () => { if (!sailing && layer) layer.hidden = true; };
globals.voyageState = () => ({sailing, durationMs:2600, chartVisible:!!layer && !layer.hidden, current:layer?.querySelector(".current")?.getAttribute("data-node-id"), nodes:layer?.querySelectorAll(".sea-chart-node").length || 0, revealed:layer?.querySelectorAll('[data-revealed="true"]').length || 0, reachable:[...layer?.querySelectorAll<HTMLButtonElement>(".reachable") || []].map(el => el.dataset.nodeId), shipArt});
globals.sailToNode = (id: string) => layer?.querySelector<HTMLButtonElement>(`[data-node-id="${CSS.escape(id)}"]:not(:disabled)`)?.click();
window.addEventListener("pagehide", () => clearTimeout(arrivalTimer));
