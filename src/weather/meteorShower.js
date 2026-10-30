import {
  hsl, vec3, rgb,
  mainContext
} from 'littlejsengine'
// meteorShower - a night on an alien badlands, with a gas giant looming overhead
//
// Shooting stars cross the sky all night, and now and then a whole shower comes down.
// Some burn out, some fall to the horizon with a flash, a boom and a camera-shake hook.
//
// To shake the camera on an impact, in your game:
//   weather.onImpact = (strength) => { config.shake = strength; }     // strength is 0..1

import { painters } from './weather';

const random = (min, max) => min + Math.random() * (max - min);

// ----------------------------------------------------------------------------
// Painters
// ----------------------------------------------------------------------------

// Jagged dark ridge with a hot orange edge. It starts and ends at the same height, so
// the strip repeats with no cut at the join.
const badlandsRidge = (g, w, h) => {
  const edgeY = h - 60;
  g.beginPath();
  g.moveTo(0, h);
  g.lineTo(0, edgeY);
  let x = 0, up = true;
  while (x < w - 30) {
    const step = random(16, 46);
    x = Math.min(x + step, w - 20);
    g.lineTo(x, up ? h - random(70, 200) : h - random(40, 100));
    up = !up;
  }
  g.lineTo(w, edgeY);
  g.lineTo(w, h);
  g.closePath();

  const body = g.createLinearGradient(0, 0, 0, h);
  body.addColorStop(0, '#4a2020');
  body.addColorStop(1, '#10060a');
  g.fillStyle = body;
  g.fill();
  // g.strokeStyle = 'rgba(255,120,50,.55)';
  // g.lineWidth = 2;
  // g.stroke();
};

// Volcanoes with a glowing crater, lava streaks and a smoke plume. Each is drawn three
// times, shifted by -w, 0 and +w, so the strip repeats seamlessly.
const volcanoes = (g, w, h) => {
  const count = 4;
  for (let i = 0; i < count; i++) {
    const x = (i + random(.2, .8)) * w / count;
    const width = random(110, 190);
    const height = random(90, 165);
    const crater = width * .12;

    for (const wrap of [-w, 0, w]) {
      const cx = x + wrap;

      for (let puff = 0; puff < 6; puff++)                    // smoke rising from the crater
      {
        const px = cx + random(-8, 14) + puff * 4;
        const py = h - height - puff * random(12, 22);
        const r = random(14, 26) + puff * 4;
        const smoke = g.createRadialGradient(px, py, 0, px, py, r);
        smoke.addColorStop(0, 'rgba(70,35,45,.5)');
        smoke.addColorStop(1, 'rgba(70,35,45,0)');
        g.fillStyle = smoke;
        g.fillRect(px - r, py - r, r * 2, r * 2);
      }

      g.fillStyle = '#220c12';                                // the cone
      g.beginPath();
      g.moveTo(cx - width / 2, h);
      g.lineTo(cx - crater, h - height);
      g.lineTo(cx + crater, h - height);
      g.lineTo(cx + width / 2, h);
      g.closePath();
      g.fill();

      g.strokeStyle = 'rgba(255,110,30,.8)';                  // lava running down the sides
      g.lineWidth = 2;
      for (let streak = 0; streak < 3; streak++) {
        const start = random(-crater, crater);
        g.beginPath();
        g.moveTo(cx + start, h - height);
        g.lineTo(cx + start * 3 + random(-12, 12), h - height * random(.25, .6));
        g.stroke();
      }

      const glow = g.createRadialGradient(cx, h - height, 0, cx, h - height, width * .45);   // crater glow
      glow.addColorStop(0, 'rgba(255,170,60,.95)');
      glow.addColorStop(1, 'rgba(255,80,20,0)');
      g.fillStyle = glow;
      g.fillRect(cx - width * .45, h - height - width * .45, width * .9, width * .9);
    }
  }
};

// A banded gas giant with a wide ring: back half of ring, planet, front half of ring
const gasGiant = (g) => {
  g.translate(128, 128);
  g.rotate(-.3);

  const ring = (from, to) => {
    g.beginPath();
    g.ellipse(0, 0, 124, 28, 0, from, to);
    g.lineWidth = 12;
    g.strokeStyle = 'rgba(200,225,255,.6)';
    g.stroke();
    g.beginPath();
    g.ellipse(0, 0, 106, 23, 0, from, to);
    g.lineWidth = 4;
    g.strokeStyle = 'rgba(255,200,150,.7)';
    g.stroke();
  };
  ring(Math.PI, Math.PI * 2);

  const bands = g.createLinearGradient(0, -62, 0, 62);
  bands.addColorStop(0, '#9fe4ff');
  bands.addColorStop(.25, '#2f6fd8');
  bands.addColorStop(.5, '#e6d0ff');
  bands.addColorStop(.75, '#3a46b0');
  bands.addColorStop(1, '#14206a');
  g.fillStyle = bands;
  g.beginPath();
  g.arc(0, 0, 62, 0, Math.PI * 2);
  g.fill();

  g.globalCompositeOperation = 'source-atop';                     // night side
  g.fillStyle = 'rgba(5,5,40,.55)';
  g.beginPath();
  g.arc(30, 20, 62, 0, Math.PI * 2);
  g.fill();
  g.globalCompositeOperation = 'source-over';

  ring(0, Math.PI);
};


// ----------------------------------------------------------------------------
// The preset
// ----------------------------------------------------------------------------

export default
  {
    name: 'meteorShower',

    sky:
    {
      top: hsl(.68, .8, .1),      // near-black indigo
      horizon: hsl(.04, .85, .42),    // burnt orange glow over the badlands (fog takes this color too)
      bottom: hsl(.02, .6, .12),
      ambient: 1.4,
    },

    // Clear air, so the meteors and stars stay bright
    fog: { start: 140, end: 900 },

    // A small, low orange sun
    sun:
    {
      direction: vec3(.3, .15, -1),
      color: hsl(.06, .6, .6),
      pos: [68, 34, -227],            // match `direction`
      glow: { size: 150, color: rgb(1, .5, .2, .6) },
      disc: { size: 16, color: rgb(1, .85, .6, 1) },
      flare: {
        size: .9, count: 6, intensity: .4, saturation: .6, color: hsl(.07, .8, .8),
        shapes: ['ring', 'glow', 'disc'], seed: 4
      },
    },

    // Fill light from behind the camera so the runner and enemies stay readable
    lights:
      [
        { from: vec3(-.2, .25, 1), color: hsl(.07, .5, .6), intensity: .6 },
        { from: vec3(-.25, .25, 1), color: hsl(.6, .4, .65), intensity: .8 },
      ],

    sprites:
      [
        { paint: gasGiant, texWidth: 256, texHeight: 256, pos: [-85, 66, -245], size: [170, 170], tint: [1, 1, 1, 1] },
        { paint: painters.moon('#ffffff', '#ffd9b0'), texWidth: 64, texHeight: 64, pos: [30, 96, -240], size: [10, 10], tint: [1, 1, 1, 1] },
      ],

    // Far to near
    layers:
      [
        { paint: painters.stars(900), texWidth: 1024, texHeight: 256, z: -290, y: 105, w: 880, h: 220, scroll: .1, tint: [1, 1, 1, 1] },
        { paint: painters.clouds('rgba(255,110,50,', 28), texWidth: 1024, texHeight: 256, z: -245, y: 18, w: 420, h: 80, scroll: 5, tint: [1, 1, 1, .5] },
        { paint: badlandsRidge, texWidth: 1024, texHeight: 256, z: -250, y: 32, w: 340, h: 85, scroll: 0, tint: [.6, .45, .5, 1] },
        { paint: volcanoes, texWidth: 1024, texHeight: 256, z: -215, y: 30, w: 240, h: 60, scroll: 0, tint: [.9, .75, .75, 1] },
        { paint: badlandsRidge, texWidth: 1024, texHeight: 256, z: -165, y: 22, w: 240, h: 60, scroll: 0, tint: [.8, .6, .6, 1] },
        { paint: painters.clouds('rgba(40,15,30,', 24), texWidth: 1024, texHeight: 256, z: -140, y: 55, w: 300, h: 75, scroll: 8, tint: [1, 1, 1, .4] },
      ],

    // Glowing embers drifting up, drawn on the screen so the camera cannot slide them
    rain: null,
    screenRain:
    {
      rate: 22,
      life: 7,
      direction: Math.PI,
      speed: [.03, .09],
      length: [0, 0],
      size: [3, 9],
      colors: [rgb(1, .55, .2), rgb(1, .8, .4)],
      alpha: .9,
      additive: true,
      wobble: .03,
    },

    meteors:
    {
      rate: .35,                              // a lone shooting star every few seconds
      burst: { every: [12, 20], count: [6, 11], spread: 1.8 },   // and now and then a whole shower
      z: [-235, -150],
      speed: [110, 190],                      // world units per second
      size: [.8, 2],
      trail: [.5, .9],                        // seconds
      colors: [rgb(1, .6, .25), rgb(.55, .85, 1)],   // orange and ice blue
      impactChance: .15,                      // chance one falls all the way down and hits
      flashColor: rgb(1, .8, .5),
      flashAlpha: .22,
    },

    lightning: null,
  };
