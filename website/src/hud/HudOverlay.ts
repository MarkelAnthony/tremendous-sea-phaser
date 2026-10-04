export class HudOverlay {
  private text = "";
  private readonly element: HTMLDivElement;

  constructor() {
    const root = document.getElementById("hud-root");
    if (!root) {
      throw new Error("Missing #hud-root");
    }

    this.element = document.createElement("div");
    this.element.className = "hud-panel";
    root.appendChild(this.element);
  }

  setText(lines: string[]): void {
    const text = lines.join("\n");
    if (text === this.text) return;
    this.text = text;
    this.element.replaceChildren(
      ...lines.map((line) => {
        const div = document.createElement("div");
        div.textContent = line;
        return div;
      }),
    );
  }

  destroy(): void {
    this.element.remove();
  }
}
