const SVG_NS = "http://www.w3.org/2000/svg";
let nextRibbonId = 0;

/** One vector baseline shared by hand and reward cards; no panel covers the art. */
export function createRibbonTitle(name: string): HTMLElement {
  const title = document.createElement("strong");
  title.className = "sea-ribbon-title";
  title.setAttribute("aria-label", name);
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("viewBox", "0 0 260 380");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("preserveAspectRatio", "none");
  const defs = document.createElementNS(SVG_NS, "defs");
  const path = document.createElementNS(SVG_NS, "path");
  const id = `sea-ribbon-${nextRibbonId++}`;
  path.id = id;
  path.setAttribute("d", "M48 49 Q130 38 212 49");
  defs.append(path);
  const text = document.createElementNS(SVG_NS, "text");
  text.setAttribute("text-anchor", "middle");
  text.setAttribute("font-size", "23");
  text.setAttribute("font-family", "Georgia, serif");
  text.setAttribute("font-weight", "700");
  const curved = document.createElementNS(SVG_NS, "textPath");
  curved.setAttribute("href", `#${id}`);
  curved.setAttribute("startOffset", "50%");
  curved.textContent = name;
  text.append(curved);
  svg.append(defs, text);
  title.append(svg);
  return title;
}

/** Measure real glyph advances, rather than guessing from the title's length. */
export function fitRibbonTitles(root: HTMLElement): void {
  root.querySelectorAll<SVGTextElement>(".sea-ribbon-title text").forEach(text => {
    text.setAttribute("font-size", "23");
    const naturalWidth = text.getComputedTextLength();
    const size = Math.min(23, 23 * 144 / Math.max(1, naturalWidth));
    text.setAttribute("font-size", String(size));
  });
}
