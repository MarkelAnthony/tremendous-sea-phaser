/** Original ink illustrations: parchment routes and restrained confectionery details. */
export function chartIcon(kind: string): string {
  const paths: Record<string,string> = {
    common:'<path d="m7 18 2-13 4-3 2 5-5 12z" fill="#c9d4cc"/><path d="m4 18 10 3M8 20l-1 6m-3 0h6" stroke="#896544"/><path d="m23 10 8 3-2 9q-2 4-7 6-5-3-6-7l1-9z" fill="#b9cda9"/><path d="m23 14-1 10m-4-6 9 1" stroke="#f7ecd3"/>',
    elite:'<path d="M5 15C0 0 27 0 23 15l-5 3v6H9v-6zM8 22h12M12 18v6m4-6v6"/><circle cx="9" cy="12" r="2"/><circle cx="19" cy="12" r="2"/>',
    boss:'<path d="m3 8 4 14h20l4-14-8 7-6-12-6 12zM7 26h20"/>',
    oasis:'<path d="M17 2c2 7 10 9 9 16-1 7-16 8-18 0-1-5 4-8 5-12 1 4 3 5 4 6 2-3 1-7 0-10z" fill="#d68358"/><path d="M17 13c5 5 6 9 0 11-6-2-5-6 0-11z" fill="#f4cf77" stroke="#b47a4c"/><path d="m6 25 22 3M7 29l21-7" stroke="#805b42" stroke-width="3"/>',
    event:'<path d="M9 8C8 0 23 0 23 8c0 6-9 6-9 12"/><circle cx="14" cy="25" r="1"/>',
    shop:'<path d="M4 12h24v14H4zM2 12l4-9h20l4 9M4 12q4 6 8 0 4 6 8 0 4 6 8 0M10 26V17h9v9"/>',
  };
  return `<svg viewBox="0 0 34 30" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[kind] || paths.event}</svg>`;
}
export function chartMarginArt(): string {
  return `<g stroke="#795c45" fill="none" stroke-width="1.1" opacity=".3"><path d="M78 155q25-22 58 0m-53 8q22-13 48 0M820 430q28-22 64 0m-59 8q22-13 49 0M99 425q24-13 45 0m-40 6q18-10 34 0"/><g transform="translate(856 122)"><circle r="40"/><circle r="33"/><path d="M0-52V52M-52 0H52M-28-28l56 56m-56 0 56-56"/><path d="m0-39-8 39 8 39 8-39z" fill="#795c45"/><text y="-59" text-anchor="middle" fill="#795c45" stroke="none" font-size="14">N</text></g></g><g opacity=".5" stroke="#997966" stroke-width="1.5"><g transform="translate(120 270) rotate(-12)"><path d="M-8 42V-25q0-21 22-21t22 21v9h-12v-9q0-9-10-9t-10 9v67z" fill="#fff4df"/><path d="m-8 29 12-8m-12-9 12-8m-12-9 12-8m-12-9 12-8m0-16 10-7m11 7-9 8" stroke="#bc6470" stroke-width="5"/></g><g transform="translate(835 320)"><path d="M-33 24Q-29-36 0-36T33 24Z" fill="#c4d8b5"/><path d="M-33 24h66M-20 5l3-3m9-17 3-3m8 25 3-3m8-20 3-3" fill="none"/><path d="m-18-21 10-5" stroke="#fff7e8" stroke-width="4"/></g></g><g stroke="#b67771" opacity=".32" fill="none"><path d="M30 26h115M30 26v60M970 26H855M970 26v60M30 564h115M30 564v-60M970 564H855M970 564v-60" stroke-width="2"/><circle cx="30" cy="26" r="6"/><circle cx="970" cy="26" r="6"/><circle cx="30" cy="564" r="6"/><circle cx="970" cy="564" r="6"/></g>`;
}
export function voyageSeaArt(): string {
  return `<svg viewBox="0 0 1000 700" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="voyage-sky" x2="0" y2="1"><stop stop-color="#203d50"/><stop offset="1" stop-color="#9bb7b4"/></linearGradient><linearGradient id="voyage-sea" x2="0" y2="1"><stop stop-color="#436d7d"/><stop offset="1" stop-color="#102d41"/></linearGradient><pattern id="voyage-wave" width="130" height="34" patternUnits="userSpaceOnUse"><path d="M8 17q20-6 43 0m27 10q17-5 40-1" stroke="#b6d6d4" opacity=".23" fill="none"/></pattern></defs><path fill="url(#voyage-sky)" d="M0 0h1000v395H0z"/><g fill="#cadad0" opacity=".15"><path d="M-100 150q160-40 300 0t300 0 300 0 300 0v15H-100z"/><path d="M200 230q100-20 220 0t280 0v10H200z"/></g><path d="M0 387q120-5 260 0t250 0 260 0 230 0v313H0z" fill="url(#voyage-sea)"/><path d="M0 390h1000" stroke="#ced9cd" opacity=".3"/><rect y="400" width="1000" height="300" fill="url(#voyage-wave)" class="sea-ocean-lines"/></svg>`;
}
export function voyageFoam(): string {
  return `<svg class="sea-voyage-foam" viewBox="0 0 700 100" preserveAspectRatio="none" aria-hidden="true"><g fill="none" stroke-linecap="round"><path d="M10 63Q210 5 420 39T654 44Q686 32 665 27" stroke="#96c7c8" stroke-width="13" opacity=".24"/><path d="M30 68Q190 35 365 49T646 44q35-16 18-23" stroke="#eff8e7" stroke-width="3" opacity=".8"/><path d="M13 83q200-20 373-16M90 35q120-20 272-4m148 35q105 4 143-7" stroke="#c5e4db" stroke-width="2" opacity=".5"/></g></svg>`;
}
