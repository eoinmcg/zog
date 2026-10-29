import { hsl, vec3, rgb, time } from 'littlejsengine'
// deepSpace - empty space for splash screens: stars, faint nebulae and a black hole
//
// No horizon, no ground, no fog. The sky is near-black all round, with four star layers
// at different distances that drift at different speeds (a parallax effect), two dim
// nebula clouds, a slowly turning black hole, a few drifting sparkles and the odd comet.
//
// Made for a camera looking down -z from about (0, 0, 8). If your camera sits higher or
// lower, change the `y` of the layers and sprites, which are centered on y = 0.
// Use it INSTEAD of your own setSky (the preset sets the sky itself).

import { painters } from './weather';

const random = (min, max) => min + Math.random() * (max - min);

// ----------------------------------------------------------------------------
// Painters
// ----------------------------------------------------------------------------

// Stars spread evenly over the whole image. A few are big and get spikes and a halo.
// `scale` makes every star bigger (use it for the nearer layers).
const starfield = (count, scale = 1) => (g, w, h) => {
  const star = (x, y, radius, hue, saturation, alpha, big) => {
    g.fillStyle = `hsla(${hue}, ${saturation}%, ${random(82, 100)}%, ${alpha})`;
    g.beginPath();
    g.arc(x, y, radius, 0, Math.PI * 2);
    g.fill();
    if (!big) return;

    const halo = g.createRadialGradient(x, y, 0, x, y, radius * 7);
    halo.addColorStop(0, `hsla(${hue}, 100%, 85%, .45)`);
    halo.addColorStop(1, `hsla(${hue}, 100%, 85%, 0)`);
    g.fillStyle = halo;
    g.fillRect(x - radius * 7, y - radius * 7, radius * 14, radius * 14);

    g.strokeStyle = `hsla(${hue}, 100%, 90%, .5)`;          // four-point sparkle
    g.lineWidth = 1;
    g.beginPath();
    g.moveTo(x - radius * 6, y); g.lineTo(x + radius * 6, y);
    g.moveTo(x, y - radius * 6); g.lineTo(x, y + radius * 6);
    g.stroke();
  };

  for (let i = 0; i < count; i++) {
    const x = random(0, w), y = random(0, h);
    const big = Math.random() < .003;
    const radius = (big ? random(1.4, 2.2) : random(.4, 1.1)) * scale;
    const hue = [215, 200, 45, 15][Math.floor(Math.random() * 4)];      // blue-white, yellow, orange
    const saturation = random(30, 80);
    const alpha = big ? 1 : random(.35, 1);
    star(x, y, radius, hue, saturation, alpha, big);
    if (big) {
      star(x - w, y, radius, hue, saturation, alpha, big);
      star(x + w, y, radius, hue, saturation, alpha, big);
    }
  }
};

const blackHole = (g, w, h) => {
  const c = w / 2;
  const horizon = w * .12;                                    // radius of the black disc
  const reach = w * .46;                                      // how far the gas extends

  // wide warm halo
  const halo = g.createRadialGradient(c, c, horizon, c, c, c);
  halo.addColorStop(0, 'rgba(255,160,70,.45)');
  halo.addColorStop(.4, 'rgba(255,90,30,.15)');
  halo.addColorStop(1, 'rgba(255,90,30,0)');
  g.fillStyle = halo;
  g.fillRect(0, 0, w, h);

  // the swirl: dots along four spiral arms, white-hot near the middle, red at the edge
  g.globalCompositeOperation = 'lighter';
  for (let arm = 0; arm < 4; arm++)
    for (let i = 0; i < 1100; i++) {
      const t = Math.pow(Math.random(), .75);             // 0 = inner edge, 1 = outer edge
      const radius = horizon * 1.15 + t * (reach - horizon * 1.15);

      // ADDED: Include the time-based offset here (multiplied by a speed factor, e.g., 0.2)
      const angle = arm * Math.PI / 2 + t * 6.2 + random(-.3, .3) * (.3 + t) + (time * 0.2);

      g.fillStyle = `hsla(${52 - t * 42}, 100%, ${92 - t * 42}%, ${.55 * Math.pow(1 - t, .8)})`;
      g.beginPath();
      g.arc(c + Math.cos(angle) * radius, c + Math.sin(angle) * radius, random(.8, 3.4) * (1 - t * .4), 0, Math.PI * 2);
      g.fill();
    }
  g.globalCompositeOperation = 'source-over';
};

// ----------------------------------------------------------------------------
// The preset
// ----------------------------------------------------------------------------

export default
  {
    name: 'deepSpace',

    // Black all the way round: the top, "horizon" and bottom colors are all near-black violet,
    // so there is no horizon line. No fog and no sun on purpose.
    sky:
    {
      top: hsl(.75, .8, .03),
      horizon: hsl(.72, .7, .05),
      bottom: hsl(.75, .8, .03),
      ambient: 1,
      ambientColor: rgb(.18, .18, .26),       // a little cool light so a logo or 3D text stays visible
    },

    sprites:
      [
        // a soft warm glow behind the black hole, so it seems to bend the light around it
        { paint: painters.glow(), texWidth: 128, texHeight: 128, pos: [45, 14, -232], size: [340, 340], tint: [1, .55, .25, .4] },

        // the black hole itself. Move `pos` to put it where your logo is not.
        // spin: radians per second, negative = clockwise
        { paint: blackHole, texWidth: 512, texHeight: 512, pos: [45, 14, -230], size: [150, 150], tint: [1, 1, 1, 1], spin: -.18 },
      ],

    // Far to near. Nearer layers drift faster, which gives a feeling of depth.
    layers:
      [
        // dim nebula clouds
        { paint: painters.clouds('rgba(120,60,255,', 22), texWidth: 1024, texHeight: 256, z: -295, y: 30, w: 1100, h: 275, scroll: .6, tint: [1, 1, 1, .32] },
        { paint: painters.clouds('rgba(40,200,220,', 20), texWidth: 1024, texHeight: 256, z: -290, y: -40, w: 900, h: 225, scroll: .9, tint: [1, 1, 1, .22] },

        // star layers: many tiny far ones, fewer bigger near ones
        { paint: starfield(1400, .8), texWidth: 1024, texHeight: 512, z: -300, y: 0, w: 1100, h: 550, scroll: .15, tint: [1, 1, 1, 1] },
        { paint: starfield(500, 1.1), texWidth: 1024, texHeight: 512, z: -250, y: 0, w: 900, h: 450, scroll: .35, tint: [1, 1, 1, 1] },
        { paint: starfield(120, 1.5), texWidth: 1024, texHeight: 512, z: -200, y: 0, w: 800, h: 400, scroll: .7, tint: [1, 1, 1, 1] },
      ],

    // Sparkles of dust drifting slowly, drawn on the screen
    screenRain:
    {
      rate: 40,
      life: 5,
      direction: Math.PI / 2 + .6,            // drifting sideways and a little up
      speed: [.01, .045],
      length: [0, 0],                         // round dots
      size: [1.5, 4.5],
      colors: [rgb(.7, .85, 1), rgb(1, .9, .8)],
      alpha: .7,
      additive: true,
      wobble: .02,
    },

    // The odd comet, with a long trail. Never hits anything.
    meteors:
    {
      rate: .12,
      z: [-260, -200],
      speed: [50, 90],
      size: [.8, 1.6],
      trail: [1, 1.8],
      colors: [rgb(.7, .85, 1), rgb(1, .9, .8)],
      impactChance: 0,
      flashColor: rgb(1, 1, 1),
      flashAlpha: 0,
      boom: null,
    },

    lightning: null,
  };
