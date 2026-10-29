import { hsl, vec3, rgb } from 'littlejsengine'
// mushroomTrip - a purple, psychedelic alienscape of giant glowing mushrooms
//
// Violet sky with aurora curtains, a rainbow-ringed sun, a spiral galaxy,
// three layers of giant mushrooms, and glowing spores drifting upward.
// No lightning. The "rain" emitter is reused for the spores.

import { painters } from './weather';

const random = (min, max) => min + Math.random() * (max - min);
const pick = (list) => list[Math.floor(Math.random() * list.length)];

// ----------------------------------------------------------------------------
// Painters
// ----------------------------------------------------------------------------

// One giant mushroom. The random shape is decided once (makeMushroom) and drawn from
// those numbers (drawMushroom), so the same mushroom can be drawn again across the
// edge of the strip and look identical on both sides.
function makeMushroom(height, capWidth, hue, glow) {
  const capHeight = capWidth * random(.45, .8);
  return {
    height, capWidth, capHeight, hue, glow,
    stalkWidth: capWidth * random(.14, .22),
    bend: random(-capWidth * .25, capWidth * .25),
    spots: Array.from({ length: 6 }, () => {
      const across = random(-.75, .75);                        // -1..1 across the cap
      return {
        across, up: random(.15, .75) * (1 - Math.abs(across)),
        rx: capWidth * random(.05, .11), ry: capWidth * random(.03, .07)
      };
    }),
  };
}

// (x, baseY) is the foot of the stalk. Draws halo, curved stalk, domed cap with spots,
// glowing gills and a lit rim.
function drawMushroom(g, x, baseY, m) {
  const { height, capWidth, capHeight, hue, glow, stalkWidth, bend } = m;
  const capY = baseY - height;

  // soft halo behind the whole cap
  const halo = g.createRadialGradient(x, capY, 0, x, capY, capWidth * 1.6);
  halo.addColorStop(0, `hsla(${glow}, 100%, 60%, .28)`);
  halo.addColorStop(1, `hsla(${glow}, 100%, 60%, 0)`);
  g.fillStyle = halo;
  g.fillRect(x - capWidth * 1.6, capY - capWidth * 1.6, capWidth * 3.2, capWidth * 3.2);

  // stalk, curving to one side
  g.fillStyle = `hsl(${hue + 20}, 45%, 17%)`;
  g.beginPath();
  g.moveTo(x - stalkWidth, baseY);
  g.quadraticCurveTo(x - stalkWidth * .4 + bend, baseY - height * .5, x - stalkWidth * .5, capY);
  g.lineTo(x + stalkWidth * .5, capY);
  g.quadraticCurveTo(x + stalkWidth * .4 + bend, baseY - height * .5, x + stalkWidth, baseY);
  g.closePath();
  g.fill();

  // cap
  const cap = g.createRadialGradient(x - capWidth * .3, capY - capHeight * .5, capWidth * .1, x, capY, capWidth);
  cap.addColorStop(0, `hsl(${hue}, 95%, 62%)`);
  cap.addColorStop(1, `hsl(${hue + 25}, 75%, 22%)`);
  g.fillStyle = cap;
  g.beginPath();
  g.ellipse(x, capY, capWidth, capHeight, 0, Math.PI, 0);
  g.closePath();
  g.fill();

  // spots on the cap
  g.fillStyle = `hsla(${hue + 160}, 100%, 85%, .65)`;
  for (const spot of m.spots) {
    g.beginPath();
    g.ellipse(x + spot.across * capWidth, capY - spot.up * capHeight, spot.rx, spot.ry, 0, 0, Math.PI * 2);
    g.fill();
  }

  // glowing gills under the cap, and a lit rim
  const gills = g.createLinearGradient(0, capY, 0, capY + capHeight * .3);
  gills.addColorStop(0, `hsla(${glow}, 100%, 75%, .95)`);
  gills.addColorStop(1, `hsla(${glow}, 100%, 60%, 0)`);
  g.fillStyle = gills;
  g.beginPath();
  g.ellipse(x, capY, capWidth, capHeight * .3, 0, 0, Math.PI);
  g.fill();

  g.strokeStyle = `hsla(${glow}, 100%, 75%, .7)`;
  g.lineWidth = 2;
  g.beginPath();
  g.ellipse(x, capY, capWidth, capHeight, 0, Math.PI, 0);
  g.stroke();
}

// A row of mushrooms along the bottom of the strip.
// sizes = [min, max] cap width, heights = [min, max] stalk height, hues = cap colors.
// Each one is drawn three times, shifted by -w, 0 and +w, so whatever hangs over one edge
// of the strip continues on the other. The strip then repeats with no cut-off mushrooms.
const mushroomField = ({ sizes, heights, hues, glows, gap = [0, 20] }) => (g, w, h) => {
  for (let x = random(0, 30); x < w;) {
    const capWidth = random(sizes[0], sizes[1]);
    const hueIndex = Math.floor(Math.random() * hues.length);
    const mushroom = makeMushroom(random(heights[0], heights[1]), capWidth, hues[hueIndex], glows[hueIndex]);

    const centerX = x + capWidth;
    for (const wrap of [-w, 0, w])
      drawMushroom(g, centerX + wrap, h, mushroom);

    x += capWidth * 2 * random(.5, .9) + random(gap[0], gap[1]);   // overlap a bit
  }
};

// Aurora curtains: wavy ribbons of light hanging from a curve.
// Whole-number frequencies make the strip repeat seamlessly.
const aurora = (g, w, h) => {
  const hues = [160, 190, 290, 320];
  for (let ribbon = 0; ribbon < hues.length; ribbon++) {
    const phase = random(0, 6.28);
    const base = h * (.22 + .12 * ribbon);
    for (let x = 0; x < w; x += 2) {
      const u = x / w * Math.PI * 2;
      const y = base + h * .1 * Math.sin(u * (1 + ribbon) + phase) + h * .04 * Math.sin(u * (3 + ribbon * 2) + phase * 2);
      const length = h * (.4 + .12 * Math.sin(u * (2 + ribbon) + phase));
      const curtain = g.createLinearGradient(0, y, 0, y + length);
      curtain.addColorStop(0, `hsla(${hues[ribbon]}, 100%, 70%, .5)`);
      curtain.addColorStop(1, `hsla(${hues[ribbon]}, 100%, 60%, 0)`);
      g.fillStyle = curtain;
      g.fillRect(x, y, 2, length);
    }
  }
};

// A spiral galaxy: three arms of colored dots around a bright core
const spiralGalaxy = (g, w, h) => {
  const c = w / 2;
  const core = g.createRadialGradient(c, c, 0, c, c, c * .45);
  core.addColorStop(0, 'rgba(255,255,255,.95)');
  core.addColorStop(1, 'rgba(255,150,255,0)');
  g.fillStyle = core;
  g.fillRect(0, 0, w, h);

  for (let arm = 0; arm < 3; arm++)
    for (let i = 0; i < 380; i++) {
      const t = Math.pow(Math.random(), .8);
      const angle = arm * Math.PI * 2 / 3 + t * 5.5 + random(-.18, .18);
      const radius = t * c * .95;
      g.fillStyle = `hsla(${290 + t * 80}, 100%, ${85 - t * 25}%, ${.65 - t * .4})`;
      g.beginPath();
      g.arc(c + Math.cos(angle) * radius, c + Math.sin(angle) * radius, random(.8, 2.4), 0, Math.PI * 2);
      g.fill();
    }
};

// The sun: concentric rainbow rings with a feathered edge
const trippyOrb = (g, w, h) => {
  const c = w / 2;
  for (let ring = 12; ring >= 1; ring--) {
    g.fillStyle = `hsl(${(ring * 42) % 360}, 100%, ${ring % 2 ? 66 : 56}%)`;
    g.beginPath();
    g.arc(c, c, c * ring / 12, 0, Math.PI * 2);
    g.fill();
  }
  const core = g.createRadialGradient(c, c, 0, c, c, c * .3);
  core.addColorStop(0, 'rgba(255,255,255,1)');
  core.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = core;
  g.fillRect(0, 0, w, h);

  g.globalCompositeOperation = 'destination-in';              // feather the rim
  const feather = g.createRadialGradient(c, c, c * .75, c, c, c);
  feather.addColorStop(0, 'rgba(255,255,255,1)');
  feather.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = feather;
  g.fillRect(0, 0, w, h);
};


// ----------------------------------------------------------------------------
// The preset
// ----------------------------------------------------------------------------

export default
  {
    name: 'mushroomTrip',

    sky:
    {
      top: hsl(.75, .85, .2),     // deep violet
      horizon: hsl(.8, .8, .5),       // purple-magenta glow (fog takes this color too)
      bottom: hsl(.7, .8, .3),
      ambient: 1.1,
    },

    fog: { start: 70, end: 600 },

    sun:
    {
      direction: vec3(-.2, .2, -1),   // low and a little to the left
      color: hsl(.85, .6, .85),
      pos: [-46, 46, -231],           // match `direction`
      glow: { size: 150, color: rgb(.9, .4, 1, .5) },
      disc: { size: 36, color: rgb(1, 1, 1, 1), paint: trippyOrb, texSize: 256 },
      flare: {
        size: 1.2, count: 9, intensity: .6, saturation: .9, color: hsl(.85, .8, .85),
        shapes: ['ring', 'hex', 'glow', 'disc'], seed: 21
      },
    },

    // Fill light from behind the camera so the runner and enemies stay readable
    lights:
      [
        { from: vec3(-.2, .3, 1), color: hsl(.8, .5, .6), intensity: .6 },
      ],

    sprites:
      [
        {
          paint: spiralGalaxy, texWidth: 256, texHeight: 256, pos: [62, 72, -240], size: [95, 95], tint: [1, 1, 1, .9],
          spin: -.12
        },     // radians per second: negative = clockwise, one turn in about 52 s
        { paint: painters.moon('#ffffff', '#4ff0ff'), texWidth: 64, texHeight: 64, pos: [10, 100, -240], size: [12, 12], tint: [1, 1, 1, 1] },
      ],

    // Far to near
    layers:
      [
        // aurora curtains high up, drifting slowly
        { paint: aurora, texWidth: 1024, texHeight: 256, z: -265, y: 88, w: 520, h: 130, scroll: 2, tint: [1, 1, 1, .7] },

        // pink and violet cloud banks
        { paint: painters.clouds('rgba(255,120,230,', 30), texWidth: 1024, texHeight: 256, z: -230, y: 62, w: 420, h: 105, scroll: 3, tint: [1, 1, 1, .5] },

        // far mushrooms: huge, dim, blue and violet
        {
          paint: mushroomField({ sizes: [40, 90], heights: [60, 150], hues: [270, 300, 240], glows: [200, 320, 180] }),
          texWidth: 1024, texHeight: 256, z: -240, y: 38, w: 360, h: 90, scroll: 0, tint: [.7, .6, .85, 1]
        },

        // middle mushrooms: bright magenta, cyan, orange and lime
        {
          paint: mushroomField({ sizes: [28, 70], heights: [40, 110], hues: [310, 185, 25, 95], glows: [330, 170, 45, 120] }),
          texWidth: 1024, texHeight: 256, z: -170, y: 26, w: 250, h: 62, scroll: 0, tint: [1, 1, 1, 1]
        },

        { paint: painters.clouds('rgba(90,40,170,', 28), texWidth: 1024, texHeight: 256, z: -145, y: 58, w: 300, h: 75, scroll: 8, tint: [1, 1, 1, .5] },

        // near mushrooms: small and glowing, right at the edge of the world
        {
          paint: mushroomField({ sizes: [14, 38], heights: [20, 60], hues: [320, 175, 50, 270], glows: [340, 160, 60, 290], gap: [4, 30] }),
          texWidth: 1024, texHeight: 256, z: -125, y: 12, w: 190, h: 48, scroll: 0, tint: [1, 1, 1, 1]
        },
      ],

    // Not rain: glowing spores drifting up. Drawn on the screen itself, so the camera
    // cannot slide them sideways. (For spores in the 3D world, use a `rain` block.)
    rain: null,
    screenRain:
    {
      rate: 45,
      life: 7,
      direction: Math.PI,             // straight up
      speed: [.03, .1],               // screen heights per second; bigger ones drift faster
      length: [0, 0],                 // round glowing dots
      size: [6, 16],                  // dot diameter in pixels
      colors: [rgb(.7, 1, 1), rgb(1, .7, 1)],
      alpha: 1,
      additive: true,                 // glow
      wobble: .03,                    // sway as they rise
    },

    lightning: null,
  };
