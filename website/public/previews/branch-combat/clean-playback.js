// Decode all saved artwork before playback; never leave a previous pose visible
// while the browser fetches the next one. No generated or modified artwork.
const cachedPoses = new Map();
const poseSources = [...new Set([...jabFrames, ...['idle', 'attack', 'fire-original'].flatMap(clip => Array.from({length: clip === 'idle' ? 8 : 6}, (_, i) => `${clip}-${i}.png`))])];
window.posePlaybackReady = false;
Promise.all(poseSources.map(async src => {
  const image = new Image();
  image.src = src;
  await image.decode();
  cachedPoses.set(src, image);
})).then(() => { window.posePlaybackReady = true; }).catch(error => {
  document.getElementById('status').textContent = 'Artwork could not load: ' + error.message;
});
function showPose(element, src) {
  if (!window.posePlaybackReady || !cachedPoses.has(src)) return;
  if (element.getAttribute('src') !== src) element.src = cachedPoses.get(src).src;
}
window.cleanPlayback = () => ({ready: window.posePlaybackReady, cachedFrames: cachedPoses.size, singlePosePerPanel: true, frameMs: 90});
