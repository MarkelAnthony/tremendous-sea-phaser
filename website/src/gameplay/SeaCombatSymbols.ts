export interface CombatSymbol { icon: string; label: string }
const effects: [RegExp, string, string][] = [
  [/harden/i, "◆", "Harden"], [/block|armored/i, "🛡", "Block / armor"],
  [/bleed/i, "🩸", "Bleed"], [/fire|enflame|burn/i, "🔥", "Fire"],
  [/tire/i, "🌀", "Tire"], [/daze/i, "✦", "Daze"], [/rattl/i, "〰", "Rattled"],
  [/muted|mute/i, "🔇", "Muted"], [/corrosion/i, "☠", "Corrosion"],
  [/undertow/i, "🌊", "Undertow"], [/stun/i, "💫", "Stun"],
  [/lock.*energy/i, "🔒", "Energy lock"], [/drain|energyDrain/i, "⌛", "Energy drain"],
  [/heal/i, "♥", "Healing"], [/steal.*rubee/i, "💰", "Steal Rubees"],
  [/devour.*card|seize.*card|scrambl|curs/i, "🃏", "Card disruption"],
  [/silence|noAttack|noHeal|noBlock/i, "🚫", "Silence / action restriction"],
  [/summon|schoolmate/i, "♟", "Support"], [/wrath|becomes|huge dmg/i, "👑", "Special attack"]
];
export function intentSymbols(text: string): CombatSymbol[] {
  const symbols: CombatSymbol[] = [];
  const attack = /attack|strike|[1-9]\d* dmg|huge dmg/i.test(text);
  if (attack) {
    const amount = text.match(/(?:attack\s+|strike:\s*)(\d+(?:\+\d+)?)/i)?.[1] || text.match(/(\d+) dmg/i)?.[1] || "";
    const repeat = text.match(/x\d+/i)?.[0] || "";
    symbols.push({icon: `⚔ ${amount}${repeat ? ` ${repeat}` : ""}`.trim(), label: "Attack"});
  }
  effects.forEach(([pattern, icon, label]) => { if (pattern.test(text)) symbols.push({icon, label}); });
  if (!symbols.length) symbols.push({icon: "✧", label: "Special action"});
  return symbols;
}
export function statusSymbols(status: Record<string, number | boolean> = {}, armored = false): CombatSymbol[] {
  const descriptions: Record<string, string> = {
    harden: "Harden — strengthens the enemy's defenses.", enflame: "Enflame — burning damage over time.",
    bleed: "Bleed — bleeding damage over time.", tire: "Tire — attacks are weakened.",
    daze: "Daze — disrupts actions.", rattled: "Rattled — cards cost more energy.",
    muted: "Muted — restricts abilities.", corrosion: "Corrosion — erodes defenses.",
    undertow: "Undertow — a tidal status effect.", noAttack: "Cannot attack.", noHeal: "Cannot heal.",
    noBlock: "Cannot gain Block.", energyDrain: "Energy drain — less energy next turn."
  };
  const result = Object.entries(status).filter(([, value]) => !!value).map(([key, value]) => ({
    icon: `${/^no/.test(key) ? "🚫" : effects.find(([pattern]) => pattern.test(key))?.[1] || "✧"}${typeof value === "number" ? ` ${value}` : ""}`,
    label: `${descriptions[key] || key}${typeof value === "number" ? ` (${value})` : ""}`
  }));
  if (armored) result.push({icon: "🛡", label: "Armored — protected by armor."});
  return result;
}
