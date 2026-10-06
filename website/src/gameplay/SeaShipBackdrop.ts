import Phaser from "phaser";

/** Captain-specific ship scenery. Act scenery is deliberately left for a later pass. */
export function drawCaptainShip(scene: Phaser.Scene, root: Phaser.GameObjects.Container, captain: string): void {
  root.setData("shipCaptain", captain);
  if (captain === "Branch" && scene.textures.exists("branch-ship")) {
    const image = scene.add.image(500, 247, "branch-ship").setDisplaySize(1000, 494);
    root.add(image);
    root.setData("shipTheme", "Living timber · jewel-colored ornamental trees");
    return;
  }
  const g = scene.add.graphics();
  const riley = captain === "Riley";
  const timber = riley ? 0x263e55 : 0x4d3025;
  const metal = riley ? 0xa4d4db : 0xe4b557;
  g.fillGradientStyle(0x559cae, 0x95cad0, 0x193c58, 0x236680, 1);
  g.fillRect(0, 0, 1000, 494);
  // Distinct silhouette: Riley's blade-edged frigate, Broderick's brass gunship.
  g.fillStyle(timber); g.fillPoints([new Phaser.Math.Vector2(0,337),new Phaser.Math.Vector2(1000,337),new Phaser.Math.Vector2(902,480),new Phaser.Math.Vector2(128,480)], true);
  g.fillStyle(riley ? 0x667f8c : 0x936548); g.fillRect(0, 302, 1000, 43);
  for (let y=348;y<478;y+=22) {g.lineStyle(2,0x111923,0.5);g.lineBetween(65,y,940,y);}
  for (const x of [84, 908]) {
    g.fillStyle(timber);g.fillRect(x-11,30,22,274);
    g.lineStyle(3,metal,0.8);g.lineBetween(x,38,x+(x<500?160:-160),305);
    g.fillStyle(riley ? 0xd8e9dc : 0xeac486,0.95);
    g.fillTriangle(x+14,55,x+14,215,x+(x<500?170:-170),215);
    g.lineStyle(3,metal);g.lineBetween(x-28,215,x+(x<500?180:-180),215);
  }
  g.lineStyle(6,metal);g.lineBetween(0,302,1000,302);
  for(let x=15;x<1000;x+=47){g.lineStyle(4,timber);g.lineBetween(x,275,x,301);}
  g.lineStyle(5,metal);g.lineBetween(0,275,1000,275);
  for(let x=190;x<850;x+=128){
    g.fillStyle(0x102232);g.fillCircle(x,397,20);g.lineStyle(4,metal);g.strokeCircle(x,397,22);
    if(!riley){g.fillStyle(0x171b21);g.fillRoundedRect(x-29,312,62,18,5);g.fillStyle(metal);g.fillCircle(x+29,321,10);}
    else {g.lineStyle(3,metal);g.lineBetween(x-27,439,x+27,361);g.lineBetween(x+27,439,x-27,361);}
  }
  for(let y=480;y<494;y+=6){g.lineStyle(2,0x82dce0,0.5);for(let x=0;x<1000;x+=80)g.lineBetween(x,y,x+40,y-3);}
  root.add(g);
  root.setData("shipTheme", riley ? "Silver sabre frigate" : "Brass cannon gunship");
}

export function preloadCaptainShips(scene: Phaser.Scene): void {
  scene.load.image("branch-ship", new URL("art/branch-ship.png", document.baseURI).href);
}
(window as unknown as Record<string, unknown>).shipPreview = () => {
  const game = (window as unknown as { game?: Phaser.Game }).game;
  const scene = game?.scene.getScenes(true)[0] as (Phaser.Scene & { uiRoot?: Phaser.GameObjects.Container }) | undefined;
  return { captain: scene?.uiRoot?.getData("shipCaptain"), theme: scene?.uiRoot?.getData("shipTheme"), loaded: scene?.textures.exists("branch-ship") };
};
