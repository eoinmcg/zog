import { hsl, vec3, rgb } from 'littlejsengine'
// redDesert - hot red-orange dusk over a desert, with sand blowing sideways
//
// Same preset format as alienGreen.js. Differences worth noting:
//   - no lightning (`lightning: null`)
//   - the "rain" emitter is blowing sand: it shoots sideways, not down
//   - the sun is big and low on the LEFT, with a warm, faint lens flare

import { painters } from './weather';

const random = (min, max) => min + Math.random() * (max - min);

// ----------------------------------------------------------------------------
// Painters
// ----------------------------------------------------------------------------

// Flat-topped sandstone buttes with stepped shoulders, rock strata and a lit rim
const mesas = (g, w, h) => {
  let x = -40;
  while (x < w) {
    const bodyWidth = random(70, 180);
    const bodyHeight = random(60, 170);
    const step = random(8, 22);                     // width of the shoulder ledge
    const left = x, right = x + bodyWidth, top = h - bodyHeight;

    g.beginPath();
    g.moveTo(left, h);
    g.lineTo(left + step * .5, top + bodyHeight * .45);     // lower slope
    g.lineTo(left + step, top + bodyHeight * .45);          // ledge
    g.lineTo(left + step, top);                             // cliff up to the top
    g.lineTo(right - step, top + random(-6, 6));            // flat top
    g.lineTo(right - step, top + bodyHeight * .4);          // cliff down
    g.lineTo(right - step * .4, top + bodyHeight * .4);     // ledge
    g.lineTo(right, h);
    g.closePath();

    const gradient = g.createLinearGradient(0, top, 0, h);
    gradient.addColorStop(0, '#c4502a');
    gradient.addColorStop(.5, '#7a2a1a');
    gradient.addColorStop(1, '#3a1210');
    g.fillStyle = gradient;
    g.fill();

    // darker strata lines, only inside the butte
    g.save();
    g.clip();
    g.strokeStyle = 'rgba(40,5,10,0)';
    g.lineWidth = 2;
    for (let y = top + 8; y < h; y += random(9, 16)) {
      g.beginPath();
      g.moveTo(left, y);
      g.lineTo(right, y + random(-3, 3));
      g.stroke();
    }
    g.restore();

    g.strokeStyle = 'rgba(255,170,90,0)';                 // sunlit rim
    g.lineWidth = 2;
    g.stroke();

    x += bodyWidth + random(-50, 40);                       // may overlap the last one
  }
};

// Smooth rolling dunes. Sine waves with whole-number frequencies repeat
// seamlessly when the image is tiled sideways.
const dunes = (g, w, h) => {
  const phases = [0, 1, 2].map(() => random(0, 6.28));
  const crest = [];                                           // y of the top edge, every 4 px
  for (let x = 0; x <= w; x += 4) {
    const u = x / w * Math.PI * 2;
    crest.push(h - h * (.38 + .16 * Math.sin(u * 3 + phases[0]) + .09 * Math.sin(u * 7 + phases[1]) + .04 * Math.sin(u * 15 + phases[2])));
  }

  const tracePath = () => crest.forEach((y, i) => i ? g.lineTo(i * 4, y) : g.moveTo(0, y));

  g.beginPath();                                              // filled body
  tracePath();
  g.lineTo(w, h);
  g.lineTo(0, h);
  g.closePath();
  const gradient = g.createLinearGradient(0, 0, 0, h);
  gradient.addColorStop(0, '#f09a48');
  gradient.addColorStop(.4, '#b4562a');
  gradient.addColorStop(1, '#5a2014');
  g.fillStyle = gradient;
  g.fill();

  g.beginPath();                                              // bright line along the crest only
  tracePath();
  g.strokeStyle = 'rgba(0,0,0,.2)';
  g.lineWidth = 2;
  g.stroke();
};


// ----------------------------------------------------------------------------
// The preset
// ----------------------------------------------------------------------------

export default
  {
    name: 'redDesert',

    sky:
    {
      top: hsl(.98, .7, .3),      // deep crimson
      horizon: hsl(.07, .95, .58),    // glowing orange (fog takes this color too)
      bottom: hsl(.03, .6, .32),
      ambient: 1.8,                   // top is dark, so ambient needs to be high
    },

    fog: { start: 40, end: 380 },

    sun:
    {
      direction: vec3(-.3, .12, -1),  // low, ahead, to the left
      color: hsl(.08, .7, .9),
      pos: [-68, 27, -228],           // match `direction`
      glow: { size: 220, color: rgb(1, .5, .15, .85) },
      disc: { size: 38, color: rgb(1, .95, .7, 1), inner: '#fff6c8', outer: '#ffb040' },
      flare: {
        size: 1.1, count: 7, intensity: .55, saturation: .3, color: hsl(.08, .8, .85),
        shapes: ['ring', 'disc', 'glow', 'hex'], seed: 3
      },
    },

    lights:
      [
        { from: vec3(-.25, .25, 1), color: hsl(.6, .4, .65), intensity: .8 },
      ],

    sprites:
      [
        // a pale ghost of a moon, high in the dusk
        {
          paint: painters.moon('#ffffff', '#e8c8b0'), texWidth: 64, texHeight: 64,
          pos: [70, 92, -240], size: [14, 14], tint: [1, .9, .85, .8]
        },
      ],

    // Far to near: haze, far mesas, near mesas, dunes, then clouds and dust
    layers:
      [
        // low hazy dust along the horizon, drifting
        { paint: painters.clouds('rgba(255,170,90,', 30), texWidth: 1024, texHeight: 256, z: -245, y: 20, w: 420, h: 90, scroll: 6, tint: [1, 1, 1, .6] },
        // far buttes, dimmed so they sit in the haze
        { paint: mesas, texWidth: 1024, texHeight: 256, z: -235, y: 30, w: 360, h: 90, scroll: 0, tint: [.85, .7, .75, 1] },
        // near buttes
        { paint: mesas, texWidth: 1024, texHeight: 256, z: -170, y: 23, w: 240, h: 60, scroll: 0, tint: [1, .9, .9, 1] },
        // rolling dunes in front
        { paint: dunes, texWidth: 1024, texHeight: 256, z: -130, y: 8, w: 200, h: 50, scroll: 0, tint: [1, 1, 1, 1] },
        // thin high clouds, lit orange
        { paint: painters.clouds('rgba(255,190,140,', 30), texWidth: 1024, texHeight: 256, z: -200, y: 75, w: 420, h: 105, scroll: 3, tint: [1, 1, 1, .5] },
        // dark red dust clouds streaming past faster
        { paint: painters.clouds('rgba(160,60,40,', 26), texWidth: 1024, texHeight: 256, z: -120, y: 58, w: 300, h: 75, scroll: 14, tint: [1, 1, 1, .5] },
      ],

    // Blowing sand: the same particle emitter as rain, turned sideways.
    // `rotation` aims it along +X (left to right). It spawns on a tall flat
    // wall at the left, and the grains cross the screen in a few seconds.
    // `area` is in the emitter's own axes: (wall height, 0, wall depth).
    // rain:
    // {
    //   position: vec3(-55, 8, -20),
    //   area: vec3(24, 0, 60),
    //   rotation: vec3(0, 0, -PI / 2),
    //   rate: 700,
    //   lifetime: 3.2,
    //   speed: .5,                      // units per frame (30 per second at 60 fps)
    //   size: [.1, .06],
    //   colorStart: [rgb(1, .75, .4, .5), rgb(.9, .55, .3, .45)],
    //   colorEnd: [rgb(1, .7, .4, .15), rgb(.9, .5, .3, .05)],
    //   cone: .06,                      // a little spread for turbulence
    //   streak: .18,                    // long streaks read as speed
    // },

    lightning: null,
  };
