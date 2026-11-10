// Preview-only palette correction. Never imported by the game's runtime.
// Keep the approved sword silhouette, dimensions and alpha; refine only interior shading.
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
  // Both previews share the same 12x46 source. Keep its outline and grip intact.
  // A clean upper-left bevel replaces the source's uneven dark vertical bands.
  const warmLight=stance==='fist'?[250,224,163]:[250,220,145];
  const glint=stance==='fist'?[255,242,208]:[255,237,185];
  function paint(x,y,rgb){const i=(y*canvas.width+x)*4;if(pixels.data[i+3])pixels.data.set(rgb,i)}
  if(canvas.width===12&&canvas.height===46){
    for(let y=5;y<=31;y++){
      paint(4,y,warmLight);
      paint(5,y,p.mid);
      paint(6,y,p.mid);
      paint(7,y,p.shadow);
    }
    // A small specular cluster, not another sparkle or external glow.
    for(let y=7;y<=9;y++)paint(4,y,glint);
    paint(5,5,warmLight);
    paint(5,4,p.mid);
    // Gold guard: lit upper lip, mid-tone face and a recessed lower edge.
    for(let x=1;x<=10;x++)paint(x,33,x<=3?warmLight:x<=7?p.mid:p.shadow);
    for(let x=1;x<=10;x++)paint(x,34,p.shadow);
    paint(4,32,warmLight);paint(5,32,p.mid);paint(6,32,p.mid);paint(7,32,p.shadow);
    paint(5,43,warmLight);paint(6,43,p.shadow);
  }
  context.putImageData(pixels,0,0);
  return canvas;
}
