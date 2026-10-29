import { hsl, vec3, rgb } from 'littlejsengine'
// lunarNight - a clear, cold, moonlit night
//
// Deep blue sky full of stars with a faint Milky Way, a big cratered moon,
// snowy mountains, a pine forest with a lit cabin, and thin moonlit clouds.
// No rain and no lightning. The "rain" emitter is reused as glowing motes
// (fireflies / spores) that drift slowly upward.

import { painters } from './weather';

const random = (min, max) => min + Math.random() * (max - min);

// ----------------------------------------------------------------------------
// Painters
// ----------------------------------------------------------------------------

// Tiny stars, denser high in the sky. A few are big and get a soft glow.
const stars = (g, w, h) => {
  for (let i = 0; i < 750; i++) {
    const x = random(0, w);
    const y = h * Math.pow(Math.random(), 1.2);             // more stars near the top
    const big = Math.random() < .04;
    const radius = big ? random(1.6, 2.4) : random(.5, 1.2);
    const hue = [215, 50, 0][Math.floor(Math.random() * 3)];   // blue, yellow, red tints
    g.fillStyle = `hsla(${hue}, ${random(30, 70)}%, ${random(80, 100)}%, ${random(.45, 1)})`;
    g.beginPath();
    g.arc(x, y, radius, 0, Math.PI * 2);
    g.fill();

    if (big) {
      const halo = g.createRadialGradient(x, y, 0, x, y, 10);
      halo.addColorStop(0, 'rgba(200,220,255,.5)');
      halo.addColorStop(1, 'rgba(200,220,255,0)');
      g.fillStyle = halo;
      g.fillRect(x - 10, y - 10, 20, 20);
    }
  }
};

// A soft diagonal band of faint glow and fine stars
const milkyWay = (g, w, h) => {
  const bandY = (x) => h * .5 + (x - w / 2) * .12;           // gentle slope
  for (let i = 0; i < 150; i++) {
    const x = random(0, w);
    const y = bandY(x) + (Math.random() + Math.random() - 1) * h * .22;
    const radius = random(25, 70);
    const color = Math.random() < .7 ? '170,190,255' : '220,170,255';
    for (const wrap of [-w, 0, w])                          // repeat so it tiles sideways
    {
      const blob = g.createRadialGradient(x + wrap, y, 0, x + wrap, y, radius);
      blob.addColorStop(0, `rgba(${color},.09)`);
      blob.addColorStop(1, `rgba(${color},0)`);
      g.fillStyle = blob;
      g.fillRect(x + wrap - radius, y - radius, radius * 2, radius * 2);
    }
  }
  for (let i = 0; i < 500; i++)                               // fine stars along the band
  {
    const x = random(0, w);
    const y = bandY(x) + (Math.random() + Math.random() - 1) * h * .18;
    g.fillStyle = `rgba(220,230,255,${random(.2, .7)})`;
    g.fillRect(x, y, 1, 1);
  }
};

// Mountain ridge with snow on the tall peaks and a pale moonlit edge.
// (Snow is just a light gradient painted over the top of the ridge shape.)
const snowyRidge = (g, w, h) => {
  const trace = () => {
    g.beginPath();
    g.moveTo(0, h);
    let x = 0, up = true;
    while (x < w) {
      const step = random(14, 44);
      g.lineTo(x + step, up ? h - random(70, 235) : h - random(25, 90));
      x += step;
      up = !up;
    }
    g.lineTo(w, h);
    g.closePath();
  };

  trace();
  const body = g.createLinearGradient(0, 0, 0, h);
  body.addColorStop(0, '#31457a');
  body.addColorStop(1, '#070b20');
  g.fillStyle = body;
  g.fill();

  g.save();                                                   // snow, only inside the ridge
  g.clip();
  const snow = g.createLinearGradient(0, 0, 0, h * .55);
  snow.addColorStop(0, 'rgba(215,230,255,.9)');
  snow.addColorStop(1, 'rgba(215,230,255,0)');
  g.fillStyle = snow;
  g.fillRect(0, 0, w, h);
  g.restore();

  g.strokeStyle = 'rgba(170,200,255,0)';                     // moonlit edge
  g.lineWidth = 0;
  g.stroke();
};

// Dark pine forest. Now and then there is a cabin with a warm lit window.
const pineForest = (g, w, h) => {
  for (let x = 0; x < w;) {
    const treeWidth = random(14, 32);
    const treeHeight = random(40, 110);
    const centerX = x + treeWidth / 2;
    g.fillStyle = `hsl(${random(215, 235)}, 40%, ${random(4, 8)}%)`;

    for (let tier = 0; tier < 3; tier++)                    // three stacked triangles
    {
      const top = h - treeHeight + tier * treeHeight * .22;
      const bottom = h - treeHeight * (1 - (tier + 1) * .38);
      const halfWidth = treeWidth * (.4 + tier * .3);
      g.beginPath();
      g.moveTo(centerX, top);
      g.lineTo(centerX - halfWidth, bottom);
      g.lineTo(centerX + halfWidth, bottom);
      g.fill();
    }
    g.fillRect(centerX - 2, h - treeHeight * .2, 4, treeHeight * .2);   // trunk

    if (Math.random() < .03)                                // cabin
    {
      const cabinX = x + treeWidth + 6;
      g.fillStyle = '#05070f';
      g.fillRect(cabinX, h - 22, 26, 22);
      g.beginPath();
      g.moveTo(cabinX - 3, h - 22);
      g.lineTo(cabinX + 13, h - 36);
      g.lineTo(cabinX + 29, h - 22);
      g.fill();
      const glow = g.createRadialGradient(cabinX + 13, h - 12, 0, cabinX + 13, h - 12, 16);
      glow.addColorStop(0, 'rgba(255,190,90,.9)');
      glow.addColorStop(1, 'rgba(255,190,90,0)');
      g.fillStyle = glow;
      g.fillRect(cabinX - 4, h - 28, 34, 32);
      g.fillStyle = '#ffd27a';
      g.fillRect(cabinX + 9, h - 15, 8, 7);
      x += 36;
    }
    x += treeWidth * random(.5, .9);                        // trees overlap a bit
  }
};

// The moon itself: pale disc, dark seas, craters, a little shading
const crateredMoon = (g, w, h) => {
  const radius = w / 2 - 3;
  g.translate(w / 2, h / 2);
  g.beginPath();
  g.arc(0, 0, radius, 0, Math.PI * 2);
  g.clip();

  const base = g.createRadialGradient(-radius * .3, -radius * .3, radius * .1, 0, 0, radius);
  base.addColorStop(0, '#ffffff');
  base.addColorStop(1, '#c9d4ec');
  g.fillStyle = base;
  g.fillRect(-radius, -radius, radius * 2, radius * 2);

  const spot = () => { const a = random(0, 6.283), d = radius * Math.sqrt(Math.random()); return [Math.cos(a) * d, Math.sin(a) * d]; };

  g.fillStyle = 'rgba(120,135,175,.35)';                      // dark "seas"
  for (let i = 0; i < 6; i++) {
    const [x, y] = spot();
    g.beginPath();
    g.ellipse(x, y, radius * random(.12, .3), radius * random(.1, .22), random(0, 3), 0, Math.PI * 2);
    g.fill();
  }
  for (let i = 0; i < 30; i++)                                // craters
  {
    const [x, y] = spot();
    const craterRadius = radius * random(.02, .08);
    g.fillStyle = 'rgba(130,145,185,.35)';
    g.beginPath();
    g.arc(x, y, craterRadius, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = 'rgba(255,255,255,.4)';
    g.lineWidth = 1.5;
    g.beginPath();
    g.arc(x - craterRadius * .15, y - craterRadius * .15, craterRadius, Math.PI, Math.PI * 1.7);
    g.stroke();
  }

  const shade = g.createRadialGradient(-radius * .4, -radius * .4, radius * .5, 0, 0, radius * 1.1);   // dark lower-right edge
  shade.addColorStop(0, 'rgba(10,20,60,0)');
  shade.addColorStop(1, 'rgba(10,20,60,.35)');
  g.fillStyle = shade;
  g.fillRect(-radius, -radius, radius * 2, radius * 2);
};


// ----------------------------------------------------------------------------
// The preset
// ----------------------------------------------------------------------------

export default
  {
    name: 'lunarNight',

    sky:
    {
      top: hsl(.65, .65, .16),    // deep navy
      horizon: hsl(.58, .55, .32),    // steel blue glow (fog takes this color too)
      bottom: hsl(.7, .5, .12),
      ambient: 1.5,                   // cool bluish ambient = moonlight; raise if too dark
    },

    // Clear night air: fog starts far away so the stars stay crisp
    fog: { start: 80, end: 700 },

    // The moon lights the scene and drives the lens flare
    sun:
    {
      direction: vec3(.25, .25, -1),
      color: hsl(.6, .35, .85),       // cool pale light
      pos: [57, 57, -226],            // match `direction`
      glow: { size: 280, color: rgb(.5, .65, 1, .4) },
      disc: { size: 46, color: rgb(1, 1, 1, 1), paint: crateredMoon, texSize: 256 },
      flare: {
        size: .9, count: 5, intensity: .3, saturation: .15, color: hsl(.6, .4, .9),
        shapes: ['ring', 'glow', 'disc'], seed: 11
      },
    },

    // A cool fill light from behind the camera. The moon is ahead of the player, so
    // without this the faces turned toward the camera only get ambient light.
    // `from` is where it shines from (it points toward the origin): +z is behind the camera.
    // Keep it low (small y): a high light also floods the ground. Raise intensity for brighter characters.
    lights:
      [
        { from: vec3(-.25, .25, 1), color: hsl(.6, .4, .65), intensity: .8 },
      ],

    sprites: [],

    layers:
      [
        // the starfield and Milky Way creep sideways very slowly, like the night turning
        { paint: stars, texWidth: 1024, texHeight: 256, z: -290, y: 105, w: 880, h: 220, scroll: .15, tint: [1, 1, 1, 1] },
        { paint: milkyWay, texWidth: 1024, texHeight: 256, z: -285, y: 100, w: 800, h: 200, scroll: .1, tint: [1, 1, 1, .9] },
        // far snowy range, bluish with distance
        { paint: snowyRidge, texWidth: 1024, texHeight: 256, z: -250, y: 33, w: 340, h: 85, scroll: 0, tint: [.7, .8, 1, 1] },
        // thin clouds lit by the moon
        // { paint: painters.clouds('rgba(150,180,230,', 22), texWidth: 1024, texHeight: 256, z: -215, y: 62, w: 420, h: 105, scroll: 3, tint: [1, 1, 1, .45] },
        // nearer, darker range
        { paint: snowyRidge, texWidth: 1024, texHeight: 256, z: -190, y: 24, w: 260, h: 65, scroll: 0, tint: [.55, .65, .9, 1] },
        // pine forest at the edge of the world
        // { paint: pineForest, texWidth: 1024, texHeight: 256, z: -140, y: 13, w: 220, h: 55, scroll: 0, tint: [1, 1, 1, 1] },
        // dark cloud wisps passing in front of the stars
        { paint: painters.clouds('rgba(40,55,110,', 24), texWidth: 1024, texHeight: 256, z: -120, y: 60, w: 300, h: 75, scroll: 7, tint: [1, 1, 1, .4] },
      ],

    // Not rain here: glowing motes rising slowly from the ground around the road
    rain:
    {
      position: vec3(0, .3, -15),
      area: vec3(40, 0, 50),          // flat sheet at ground level
      rate: 22,
      lifetime: 6,
      speed: .02,                     // units per frame: about 1.2 per second
      size: [.14, .02],
      colorStart: [rgb(.7, 1, .9, .5), rgb(.6, .85, 1, .4)],
      colorEnd: [rgb(.7, 1, .9, 0), rgb(.6, .85, 1, 0)],
      rotation: vec3(0, 0, 0),        // emitter "up" = world up
      cone: .5,                       // wander a little as they rise
      additive: true,                 // glow
      streak: 0,                      // plain dots, no trails
    },

    lightning: null,
  };
