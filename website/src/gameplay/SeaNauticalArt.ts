import Phaser from "phaser";

/** Hand-inked silhouettes, deliberately shared by the deck and its chart table. */
export function nauticalIllustration(g: Phaser.GameObjects.Graphics, cx: number, cy: number, scale: number, kind: string, ink: number, alpha = 0.85): void {
  const line = (x1: number,y1: number,x2: number,y2: number) => g.lineBetween(cx+x1*scale,cy+y1*scale,cx+x2*scale,cy+y2*scale);
  const circle = (x: number,y: number,r: number) => g.strokeCircle(cx+x*scale,cy+y*scale,r*scale);
  const tri = (a: number,b: number,c: number,d: number,e: number,f: number) => g.fillTriangle(cx+a*scale,cy+b*scale,cx+c*scale,cy+d*scale,cx+e*scale,cy+f*scale);
  g.lineStyle(Math.max(1,scale*1.2),ink,alpha); g.fillStyle(ink,alpha);
  if (kind === "anchor") {
    circle(0,-22,5); line(0,-17,0,22); line(-13,-8,13,-8);
    g.beginPath(); g.moveTo(cx-23*scale,cy+7*scale); g.lineTo(cx-18*scale,cy+20*scale); g.lineTo(cx,cy+27*scale); g.lineTo(cx+18*scale,cy+20*scale); g.lineTo(cx+23*scale,cy+7*scale); g.strokePath();
    tri(-24,5,-24,16,-15,10);tri(24,5,24,16,15,10);
  } else if (kind === "compass") {
    circle(0,0,25); circle(0,0,29);
    for(let i=0;i<8;i++){ const a=i*Math.PI/4; const r=i%2?18:32; tri(Math.sin(a)*r,-Math.cos(a)*r,Math.sin(a+0.6)*7,-Math.cos(a+0.6)*7,0,0); line(0,0,Math.sin(a)*r,-Math.cos(a)*r); }
    circle(0,0,3);
  } else if (kind === "phoenix") {
    tri(0,-20,-7,11,7,11);tri(-3,-3,-30,-24,-20,10);tri(3,-3,30,-24,20,10);
    for(let i=0;i<4;i++){line(-7,5,-29+i*5,-19+i*7);line(7,5,29-i*5,-19+i*7);line(0,8,(i-1.5)*7,29-i%2*8);}
    circle(0,-17,4);
  } else if (kind === "sabres") {
    for(const sign of [-1,1]){line(-22*sign,24,23*sign,-24);line(-18*sign,26,26*sign,-21);line(-22*sign,10,-6*sign,24);circle(-24*sign,29,3);}
  } else if (kind === "kraken") {
    circle(0,-8,12);circle(-4,-10,2);circle(4,-10,2);
    for(let i=0;i<6;i++){const x=(i-2.5)*6;g.beginPath();g.moveTo(cx+x*scale,cy);for(let j=1;j<=12;j++)g.lineTo(cx+(x+Math.sin(j*0.5+i)*7)*scale,cy+j*2*scale);g.strokePath();}
  } else {
    line(0,-30,0,15);line(-20,-21,21,-21);tri(-2,-27,-2,8,-25,8);tri(3,-20,3,5,24,5);
    line(-32,13,29,13);line(-32,13,-20,24);line(-20,24,18,24);line(18,24,29,13);
    for(let j=0;j<3;j++){for(let i=0;i<7;i++)line(-34+i*10,29+j*5,-29+i*10,27+j*5);}
  }
  // Fine engraving strokes tie the icons to an antique deck rather than flat UI badges.
  g.lineStyle(1,ink,alpha*0.3);
  for(let i=0;i<7;i++)line(-25+i*8,36,-21+i*8,33);
}

export function cardIllustrationKind(name: string, type: string): string {
  if (/phoenix|heal|rebirth/i.test(name)) return "phoenix";
  if (/punch|kick|strike|slash|cleave|attack/i.test(name+" "+type)) return "sabres";
  if (/block|guard|anchor|defen/i.test(name+" "+type)) return "anchor";
  if (/arcane|curse|burn|flame|fire/i.test(name+" "+type)) return "kraken";
  if (/draw|discover|course|skill/i.test(name+" "+type)) return "compass";
  return "ship";
}
