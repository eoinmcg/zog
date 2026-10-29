// PICO-8 Secret Palette
// https://lospec.com/palette-list/pico-8-secret-palette
import { Color } from 'littlejsengine'

const names = [
  'black', 'navy', 'plum', 'forest',
  'poop', 'gunmetal', 'gray', 'white',
  'red', 'orange', 'yellow', 'grass',
  'sky', 'smoke', 'pink', 'flesh',
];

const colors = [
  [0, 0, 0], [29, 43, 83], [126, 37, 83], [0, 135, 81],
  [171, 82, 54], [95, 87, 79], [194, 195, 199], [255, 241, 232],
  [255, 0, 77], [255, 163, 0], [255, 236, 39], [0, 228, 54],
  [41, 173, 255], [131, 118, 156], [255, 119, 168], [255, 204, 170],
  [41, 24, 20], [17, 29, 53], [66, 33, 54], [18, 83, 89],
  [116, 47, 41], [73, 51, 59], [162, 136, 121], [243, 239, 125],
  [190, 18, 80], [255, 108, 36], [168, 231, 46], [0, 181, 67],
  [6, 90, 181], [117, 70, 101], [255, 110, 89], [255, 157, 129],
];

const toHSL = (r, g, b) => {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;

  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (delta) {
    s = delta / (1 - Math.abs(2 * l - 1));

    switch (max) {
      case r: h = ((g - b) / delta) % 6; break;
      case g: h = (b - r) / delta + 2; break;
      case b: h = (r - g) / delta + 4; break;
    }

    h *= 60;
    if (h < 0) h += 360;
  }

  return {
    h: h / 360,
    s,
    l,
  };
};

const palette = Object.fromEntries(
  colors.map((rgb, i) => {
    const name = names[i % 16] + (i >= 16 ? '2' : '');
    const [r, g, b] = rgb.map(v => v / 255);

    return [name, {
      r,
      g,
      b,
      hsl: toHSL(r, g, b),
      hex: '#' + rgb.map(v => v.toString(16).padStart(2, '0')).join(''),
      col: new Color(r, g, b, 1),
      mk: (o = 1) => new Color(r, g, b, o),
    }];
  })
);

export default palette;
