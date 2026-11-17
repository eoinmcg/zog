let ctx;
const nodes = new WeakMap(); // audio element -> analyser

export function getAnalyser(audio) {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (ctx.state === 'suspended') ctx.resume();

  if (nodes.has(audio)) return nodes.get(audio);

  const source = ctx.createMediaElementSource(audio); // only once per element!
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 256;
  analyser.smoothingTimeConstant = 0.8;

  source.connect(analyser);
  analyser.connect(ctx.destination); // so you still hear it

  const data = new Uint8Array(analyser.frequencyBinCount);
  const api = { analyser, data };
  nodes.set(audio, api);
  return api;
}

export function getBass(api, bins = 5) {
  if (!api) return 0;
  api.analyser.getByteFrequencyData(api.data);
  let sum = 0;
  for (let i = 0; i < bins; i++) sum += api.data[i];
  return sum / bins / 255; // 0..1
}
