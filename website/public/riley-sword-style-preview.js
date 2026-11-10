// Preview-only palette correction. Never imported by the game's runtime.
// Keep the approved sword silhouette, dimensions, alpha and shading regions.
export function matchSwordPalette(image, stance) {
  const palettes = {
    regular: { outline:[5,4,4], shadow:[179,103,39], mid:[241,185,69], light:[245,197,94], grip:[68,30,36], gripMid:[117,62,45], gripLight:[151,88,47] },
    fist: { outline:[4,4,4], shadow:[182,114,49], mid:[243,178,72], light:[233,239,246], grip:[70,32,41], gripMid:[130,71,55], gripLight:[157,93,51] },
  };
  const p=palettes[stance];
  const colors = new Map([
    ['0,0,0',p.outline], ['2,5,2',p.outline],
    ['226,161,0',p.shadow], ['250,198,9',p.mid], ['255,248,171',p.light],
    ['65,21,22',p.grip], ['105,43,31',p.gripMid], ['137,73,40',p.gripLight],
  ]);
  const canvas=document.createElement('canvas');
  canvas.width=image.width;canvas.height=image.height;
  const context=canvas.getContext('2d');
  context.drawImage(image,0,0);
  const pixels=context.getImageData(0,0,canvas.width,canvas.height);
  for(let i=0;i<pixels.data.length;i+=4){
    if(!pixels.data[i+3])continue;
    const rgb=colors.get(`${pixels.data[i]},${pixels.data[i+1]},${pixels.data[i+2]}`);
    if(rgb)pixels.data.set(rgb,i);
  }
  context.putImageData(pixels,0,0);
  return canvas;
}
