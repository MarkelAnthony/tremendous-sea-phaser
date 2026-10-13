// Effects only: saved poses, pose order, and attack timing are untouched.
(() => {
  const layers = new Map();
  const anchors = {
    3: { hands: [[.38,.45],[.55,.60]], feet: [[.33,.85],[.58,.86]] },
    4: { hands: [[.72,.45],[.74,.57]], feet: [[.37,.80],[.56,.78]] },
    5: { hands: [[.66,.46],[.48,.49]], feet: [[.38,.70],[.53,.69]] }
  };
  for (const id of ['fire-review', 'fighter']) {
    const image = document.getElementById(id);
    const canvas = document.createElement('canvas');
    canvas.width = 144; canvas.height = 144;
    canvas.setAttribute('aria-hidden', 'true');
    canvas.style.cssText = 'position:absolute;pointer-events:none;image-rendering:pixelated;z-index:2';
    if (id === 'fire-review') {
      const wrap = document.createElement('div');
      wrap.style.cssText = 'position:relative;display:inline-block;max-width:100%;line-height:0';
      image.before(wrap); wrap.append(image, canvas);
    } else image.after(canvas);
    layers.set(id, { image, canvas, ctx: canvas.getContext('2d') });
  }
  let active = 0;
  function flame(ctx, x, y, size, seed, time) {
    const wave = Math.sin(time * .018 + seed);
    x = Math.round(x); y = Math.round(y);
    const h = Math.round(size + wave * 2);
    ctx.fillStyle = '#ed3d13';
    ctx.beginPath();ctx.moveTo(x-size*.65,y+3);ctx.lineTo(x-size*.7,y-h*.45);
    ctx.lineTo(x-3,y-h*.3);ctx.lineTo(x+wave*2,y-h);
    ctx.lineTo(x+3,y-h*.42);ctx.lineTo(x+size*.6,y-h*.65);
    ctx.lineTo(x+size*.65,y+2);ctx.closePath();ctx.fill();
    ctx.fillStyle = '#ff921e';ctx.fillRect(x-3,y-h*.5,7,h*.5+3);
    ctx.fillStyle = '#ffe36a';ctx.fillRect(x-2,y-4,4,6);
    ctx.fillStyle = '#fff1bb';ctx.fillRect(x-1,y-1,2,3);
    for(let j=0;j<3;j++) {
      const rise = (time*.026 + seed*7 + j*6)%21;
      ctx.fillStyle = j%2 ? '#ffbe35' : '#ff6b19';
      ctx.fillRect(Math.round(x+Math.sin(seed+j+rise*.12)*7),Math.round(y-h*.5-rise),2,2);
    }
  }
  function draw(time) {
    active = 0;
    for (const {image, canvas, ctx} of layers.values()) {
      const match = /fire-original-([345])\.png/.exec(image.getAttribute('src') || '');
      const r=image.getBoundingClientRect(),p=canvas.parentElement.getBoundingClientRect();
      canvas.style.left = (r.left-p.left)+'px';canvas.style.top = (r.top-p.top)+'px';
      canvas.style.width = r.width+'px';canvas.style.height = r.height+'px';
      ctx.clearRect(0,0,144,144);
      canvas.style.display=match?'block':'none';
      if(!match)continue;
      active++;
      const pose=Number(match[1]),a=anchors[pose];
      a.feet.forEach(([x,y],i)=>flame(ctx,x*144,y*144,9,i+4,time));
      a.hands.forEach(([x,y],i)=>flame(ctx,x*144,y*144,12,i+1,time));
      if(pose>=4) {
        const [x,y]=a.hands[0];
        // A layered, ragged jet with a yellow-white core, red rim, and embers.
        const length=pose===5?38:23, bx=Math.round(x*144),by=Math.round(y*144);
        ctx.fillStyle='#ed4216';ctx.beginPath();ctx.moveTo(bx-3,by-8);
        ctx.lineTo(bx+length*.45,by-10);ctx.lineTo(bx+length*.7,by-5);
        ctx.lineTo(bx+length,by-3);ctx.lineTo(bx+length*.8,by+2);
        ctx.lineTo(bx+length*.65,by+7);ctx.lineTo(bx,by+7);ctx.closePath();ctx.fill();
        ctx.fillStyle='#ff9f24';ctx.fillRect(bx,by-5,length*.75,9);
        ctx.fillStyle='#ffe97d';ctx.fillRect(bx-1,by-2,length*.6,4);
        ctx.fillStyle='#fff4c4';ctx.fillRect(bx,by-1,10,2);
        for(let i=0;i<6;i++) {const dx=(time*.05+i*9)%43;ctx.fillStyle=i%2?'#ffcf40':'#ff6b20';ctx.fillRect(Math.round(bx+dx),Math.round(by+Math.sin(i+time*.01)*12),2,2);}
      }
    }
    requestAnimationFrame(draw);
  }
  const original=window.playtest;
  window.playtest=()=>({...original(),fireFlare:{activeLayers:active,hands:true,feet:true,blast:true,artworkChanged:false,poseTimingChanged:false}});
  requestAnimationFrame(draw);
})();
