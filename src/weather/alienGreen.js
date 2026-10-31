import { hsl, vec3, rgb, rand, tile } from 'littlejsengine'
// alienGreen - toxic green storm over an alien world
//
// A preset is plain data. Copy this file and change the numbers and painters
// to make another weather (see the notes after each section).

import { painters } from './weather';

const random = (min, max) => min + Math.random() * (max - min);

// ----------------------------------------------------------------------------
// Painters for this weather's own distant scenery. Each draws on a canvas
// (g = 2D context, w and h = canvas size) once at startup.
// ----------------------------------------------------------------------------

// Sharp crystal ridge with a glowing outline
const crystalRidge = (g, w, h) => {
  g.beginPath();
  g.moveTo(0, h);
  let x = 0;
  while (x < w) {
    const peakWidth = random(18, 60);
    g.lineTo(x + peakWidth * .4, h - random(50, 230));     // peak
    g.lineTo(x + peakWidth, h - random(30, 80));      // valley
    x += peakWidth;
  }
  g.lineTo(w, h);
  g.closePath();

  const gradient = g.createLinearGradient(0, 0, 0, h);
  gradient.addColorStop(0, '#3be0b0');
  gradient.addColorStop(.35, '#1a5a7a');
  gradient.addColorStop(1, '#1b0a4a');
  g.fillStyle = gradient;
  g.fill();

  g.strokeStyle = 'transparent';
  g.lineWidth = 2.5;
  g.globalAlpha = .8;
  g.stroke();
};

// City of dark curved spires with glowing tips, windows and domes
const spireCity = (g, w, h) => {
  const glowHues = [150, 300, 185];                           // green, magenta, cyan
  for (let x = 0; x < w;) {
    const spireWidth = random(22, 56);
    const spireHeight = random(70, 225);
    const hue = glowHues[Math.floor(Math.random() * 3)];
    const centerX = x + spireWidth * .5;
    const tipY = h - spireHeight;

    g.fillStyle = `hsl(${random(250, 285)}, 55%, ${random(9, 15)}%)`;   // body
    g.beginPath();
    g.moveTo(x, h);
    g.lineTo(x + spireWidth * .18, h - spireHeight * .5);
    g.quadraticCurveTo(centerX + random(-12, 12), h - spireHeight * .88, centerX, tipY);
    g.quadraticCurveTo(centerX, h - spireHeight * .88, x + spireWidth * .82, h - spireHeight * .5);
    g.lineTo(x + spireWidth, h);
    g.fill();

    for (let y = h - spireHeight * .7; y < h - (h * .25); y += random(10, 18))   // lights
    {
      g.fillStyle = `hsl(${hue}, 100%, 65%)`;
      g.fillRect(centerX + random(-5, 5), y, 3, 5);
    }

    // const orb = g.createRadialGradient(centerX, tipY, 0, centerX, tipY, 14);   // tip glow
    // orb.addColorStop(0, `hsla(${hue}, 100%, 75%, 1)`);
    // orb.addColorStop(1, `hsla(${hue}, 100%, 60%, 0)`);
    // g.fillStyle = orb;
    // g.fillRect(centerX - 14, tipY - 14, 28, 28);

    if (Math.random() < .3)                                                  // dome
    {
      g.fillStyle = `hsl(${random(250, 285)}, 50%, 12%)`;
      g.beginPath();
      g.ellipse(x + spireWidth + 14, h, random(18, 34), random(25, 50), 0, Math.PI, 0);
      g.fill();
    }
    x += spireWidth + random(0, 16);
  }
};

// Floating islands with a waterfall and glowing plants (mostly empty image)
const floatingIslands = (g, w, h) => {
  // for (const centerX of [110, 330, 560, 800, 950]) {
  for (const centerX of [330]) {
    const y = random(70, 190);
    const radius = random(40, 80);

    // g.fillStyle = '#1d0f4d';                                // rock underneath
    // g.beginPath();
    // g.moveTo(centerX - radius, y);
    // g.quadraticCurveTo(centerX, y + radius * 1.1 + random(0, 25), centerX + radius, y);
    // g.closePath();
    // g.fill();
    //
    // g.fillStyle = '#37e6a0';                                // glowing top
    // g.beginPath();
    // g.ellipse(centerX, y, radius, radius * .14, 0, 0, Math.PI * 2);
    // g.fill();
    //
    // g.strokeStyle = '#8cffe0';                              // waterfall
    // g.lineWidth = 3;
    // g.beginPath();
    // g.moveTo(centerX + radius * .2, y + radius * .1);
    // g.lineTo(centerX + radius * .2, Math.min(h, y + radius * 1.6));
    // g.stroke();
    //
    // for (let i = 0; i < 3; i++)                             // plants
    // {
    //   const plantX = centerX + random(-radius * .6, radius * .6);
    //   const plantHeight = random(10, 26);
    //   g.strokeStyle = '#ff5ad8';
    //   g.lineWidth = 2;
    //   g.beginPath();
    //   g.moveTo(plantX, y);
    //   g.lineTo(plantX, y - plantHeight);
    //   g.stroke();
    //   g.fillStyle = '#ffe96b';
    //   g.beginPath();
    //   g.arc(plantX, y - plantHeight, 3.5, 0, Math.PI * 2);
    //   g.fill();
    // }
  }
};

// Ringed planet: back half of ring, planet, front half of ring
const ringedPlanet = (g) => {
  g.translate(128, 128);
  g.rotate(-.35);

  const ring = (from, to) => {
    g.beginPath();
    g.ellipse(0, 0, 122, 30, 0, from, to);
    g.lineWidth = 11;
    g.strokeStyle = 'rgba(255,220,150,.75)';
    g.stroke();
    g.beginPath();
    g.ellipse(0, 0, 108, 26, 0, from, to);
    g.lineWidth = 4;
    g.strokeStyle = 'rgba(255,120,220,.8)';
    g.stroke();
  };

  ring(Math.PI, Math.PI * 2);

  const bands = g.createLinearGradient(0, -60, 0, 60);
  bands.addColorStop(0, '#ffb0f0');
  bands.addColorStop(.35, '#a04df0');
  bands.addColorStop(.6, '#ff8a5a');
  bands.addColorStop(1, '#3a1590');
  g.fillStyle = bands;
  g.beginPath();
  g.arc(0, 0, 62, 0, Math.PI * 2);
  g.fill();

  g.globalCompositeOperation = 'source-atop';                 // shadow, only on the planet
  g.fillStyle = 'rgba(20,0,60,.35)';
  g.beginPath();
  g.arc(22, 16, 62, 0, Math.PI * 2);
  g.fill();
  g.globalCompositeOperation = 'source-over';

  ring(0, Math.PI);
};


// ----------------------------------------------------------------------------
// The preset
// ----------------------------------------------------------------------------

export default
  {
    name: 'alienGreen',

    // Gradient dome. `ambient` scales how bright the shadows are.
    sky:
    {
      top: hsl(.5, .95, .24),     // deep teal
      horizon: hsl(.3, .95, .52),     // toxic green (fog takes this color too)
      bottom: hsl(.8, .8, .35),      // purple, seen below the horizon
      ambient: 1.4,
    },

    // Distant things fade into the horizon color between start and end.
    // fog: { start: 180, end: 420 },

    sun:
    {
      direction: vec3(.25, .18, -1),  // points TOWARD the sun: low, straight ahead
      color: hsl(.28, .5, .9),
      pos: [57, 41, -229],            // where the sun sprite is drawn (match `direction`)
      glow: { size: 170, color: rgb(.7, 1, .45, .85) },   // or null
      disc: { size: 24, color: rgb(1, 1, .85, 1) },       // or null
      flare: {
        size: 1.3, count: 0, intensity: .7, saturation: .8, color: hsl(.3, .6, .95),
        shapes: ['ring', 'disc', 'hex', 'glow', 'streak'], seed: 7
      },   // or null for none
    },

    lights:
      [
        { from: vec3(-.25, .25, 1), color: hsl(.6, .4, .65), intensity: .8 },
      ],

    // Fixed billboards: pos = [x, y, z], size = [width, height]
    sprites:
      [
        { paint: ringedPlanet, texWidth: 256, texHeight: 256, pos: [-75, 62, -250], size: [110, 110], tint: [1, 1, 1, 1] },
        { paint: painters.moon(), texWidth: 64, texHeight: 64, pos: [25, 78, -240], size: [11, 11], tint: [1, .9, 1, 1] },
        { paint: painters.moon('#fff', '#ffe96b'), texWidth: 64, texHeight: 64, pos: [-20, 96, -240], size: [6, 6], tint: [1, 1, .8, 1] },
      ],

    // Wide repeating layers. z = distance (more negative is farther),
    // y = height of the layer's center, w x h = world size,
    // scroll = sideways drift in units per second (0 = still), tint = [r, g, b, alpha].
    layers:
      [
        // a strip of scattered tiles, replacing e.g. spireCity
        // {
        //   paint: painters.tiles(() => [tile(0, 16, 1), tile(0, 16, 1), tile(0, 16, 1)], { scale: 2, spacing: [20, 40] }),
        //   texWidth: 1024, texHeight: 256, z: -200, y: rand(42, 52), w: 240, h: 60, scroll: 0, tint: [1, 1, 1, 1]
        // },
        { paint: floatingIslands, texWidth: 1024, texHeight: 256, z: 210, y: 52, w: 330, h: 82, scroll: 1.2, tint: [1, 1, 1, 1] },
        { paint: crystalRidge, texWidth: 1024, texHeight: 256, z: -250, y: 34, w: 320, h: 80, scroll: .3, tint: [1, 1, 1, 1] },
        { paint: spireCity, texWidth: 1024, texHeight: 256, z: -170, y: 19, w: 200, h: 50, scroll: 0, tint: [1, 1, 1, 1] },
        { paint: painters.clouds('rgba(15,60,90,', 40), texWidth: 1024, texHeight: 256, z: -230, y: 38, w: 420, h: 105, scroll: 3, tint: [.9, .8, 1, .95] },
        { paint: painters.clouds('rgba(110,255,190,', 34), texWidth: 1024, texHeight: 256, z: -200, y: 70, w: 420, h: 105, scroll: 5, tint: [1, .9, 1, .85] },
        { paint: painters.clouds('rgba(15,60,90,', 40), texWidth: 1024, texHeight: 256, z: -140, y: 58, w: 300, h: 75, scroll: 9, tint: [.8, .7, 1, .9] },
        { paint: painters.clouds('rgba(110,255,190,', 34), texWidth: 1024, texHeight: 256, z: -110, y: 82, w: 300, h: 75, scroll: 12, tint: [1, .8, 1, .75] },
      ],

    // A sheet of drops above the road. Use `rain: null` for dry weather.
    rain:
    {
      position: vec3(0, 24, -14),
      area: vec3(46, 0, 56),          // spawn area
      rate: 1100,                     // drops per second
      lifetime: .6,
      speed: .85,
      size: [.07, .05],               // start / end
      colorStart: [rgb(.7, 1, .9, .55), rgb(.6, .85, 1, .5)],
      colorEnd: [rgb(.7, 1, .9, .2), rgb(.6, .85, 1, .1)],
      tilt: .22,                      // wind slant in radians
      streak: .07,                    // trail length in seconds
    },

    // Use `lightning: null` for none.
    lightning:
    {
      minDelay: 1.8, maxDelay: 5,     // seconds between strikes
      bolt: { x: [-90, 90], z: [-190, -130], top: 120 },
      coreColor: rgb(1, 1, 1),
      glowColor: rgb(.4, 1, .7),
      haloColor: rgb(.5, 1, .8),
      flashColor: rgb(.7, 1, .9),     // scene lights and screen tint during a flash
      flashDecay: 2.2,                // higher = shorter flash
      overlayAlpha: .28,              // strength of the full-screen tint
      thunder: [1.2, .2, 70, .1, .4, .9, 4, 2.5, 0, 0, 0, 0, 0, 1.6, 0, .3, 0, .6, .2],   // zzfx params, or null
    },
  };
