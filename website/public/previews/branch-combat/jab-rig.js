// A cutout rig: every frame uses the same guard head, torso, feet and palette.
// No generated turning poses are used by the Jab, including its recovery.
window.jabRigReady = (async () => {
  const source = new Image();
  source.src = 'idle-0.png';
  await source.decode();
  const frames = [];
  const steps = [-3, -5, 1, 8, 17, 26];
  for (const reach of steps) {
    const canvas = document.createElement('canvas');
    canvas.width = source.naturalWidth;
    canvas.height = source.naturalHeight;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(source, 0, 0);
    // Remove only the outside lead forearm/fist. Head pixels end at x=82.
    ctx.clearRect(84, 48, 14, 25);
    const fistX = 85 + reach;
    const fistY = reach <= 0 ? 50 : 57;
    if (reach > 0) {
      // Reuse the original arm's skin/shading, extending from the fixed shoulder.
      ctx.drawImage(source, 81, 65, 4, 5, 81, 63, fistX - 79, 5);
      ctx.drawImage(source, 85, 61, 4, 5, 84, 62, Math.max(4, fistX - 81), 4);
    } else {
      ctx.drawImage(source, 84, 60, 7, 12, 84 + reach, 60, 7, 12);
    }
    // The exact approved flame/fist cutout, never mirrored or re-generated.
    ctx.drawImage(source, 84, 48, 13, 14, fistX, fistY, 13, 14);
    frames.push(canvas.toDataURL('image/png'));
  }
  window.jabRig = { frames, guard: 'idle-0.png', facing: 'east', fixedBody: true, generationCost: 0 };
  return window.jabRig;
})();
