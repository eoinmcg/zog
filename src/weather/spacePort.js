import { hsl, vec3, rgb, time } from 'littlejsengine'
// spacePort - deepSpace plus a busy orbital spaceport
//
// Everything from deepSpace (stars, nebulae, black hole, comets, sparkles) stays as the
// backdrop. On top of it there are floating landing pads in the midground and a slowly
// turning ring station in the background. UFOs land on the pads, sit there for a while,
// then lift off and fly away, each pad running its own cycle.
//
// Pads are plain sprites in the `sprites` list. The `ships.pads` list holds the same
// positions, so the craft know where to land. Both are built from the `pads` list below,
// so to move a pad, change it in ONE place.
//
// Same camera advice as deepSpace: level, looking down -z, from about (7, 5, 12).

import { painters } from './weather';
import deepSpace from './deepSpace.js';

const random = (min, max) => min + Math.random() * (max - min);

// ----------------------------------------------------------------------------
// Painters
// ----------------------------------------------------------------------------

// A landing pad seen from the side and a little above: glowing platform edge, a lit
// surface with a target ring, a support column fading into the dark, and a beacon tower.
const landingPad = (g, w, h) => {
  const cx = w / 2;
  const slabTop = h * .4, slabBottom = h * .52;

  // soft glow behind everything: an oval that fades to nothing before the image edge
  // (a glow that reaches the edge would show up as a faint box around the sprite)
  g.save();
  g.translate(cx, slabTop);
  g.scale(w / h, 1);
  const halo = g.createRadialGradient(0, 0, 0, 0, 0, h * .46);
  halo.addColorStop(0, 'rgba(80,220,255,.28)');
  halo.addColorStop(1, 'rgba(80,220,255,0)');
  g.fillStyle = halo;
  g.fillRect(-h * .46, -h * .46, h * .92, h * .92);
  g.restore();

  // support column, fading out toward the bottom
  const column = g.createLinearGradient(0, slabBottom, 0, h);
  column.addColorStop(0, '#39426a');
  column.addColorStop(1, 'rgba(20,24,50,0)');
  g.fillStyle = column;
  g.beginPath();
  g.moveTo(cx - w * .16, slabBottom);
  g.lineTo(cx + w * .16, slabBottom);
  g.lineTo(cx + w * .05, h);
  g.lineTo(cx - w * .05, h);
  g.closePath();
  g.fill();
  g.fillStyle = 'rgba(130,230,255,.8)';                       // a few lit windows on the column
  for (let i = 0; i < 5; i++) g.fillRect(cx + random(-14, 14), slabBottom + 12 + i * 16, 5, 3);

  // beacon tower on the right, with a dish and a red light
  const towerX = w * .86;
  g.fillStyle = '#2b3358';
  g.fillRect(towerX - 5, h * .08, 10, slabTop - h * .08);
  g.fillStyle = '#434d7c';
  g.beginPath();
  g.ellipse(towerX, h * .1, 20, 7, -.3, 0, Math.PI * 2);      // dish
  g.fill();
  const beacon = g.createRadialGradient(towerX, h * .05, 0, towerX, h * .05, 14);
  beacon.addColorStop(0, 'rgba(255,90,90,1)');
  beacon.addColorStop(1, 'rgba(255,90,90,0)');
  g.fillStyle = beacon;
  g.fillRect(towerX - 14, h * .05 - 14, 28, 28);

  // slab edge: metal with panel lines
  const edge = g.createLinearGradient(0, slabTop, 0, slabBottom);
  edge.addColorStop(0, '#8a96c4');
  edge.addColorStop(1, '#2b335c');
  g.fillStyle = edge;
  g.beginPath();
  g.moveTo(w * .06, slabTop);
  g.lineTo(w * .94, slabTop);
  g.lineTo(w * .88, slabBottom);
  g.lineTo(w * .12, slabBottom);
  g.closePath();
  g.fill();
  g.strokeStyle = 'rgba(10,15,40,.5)';
  g.lineWidth = 1;
  for (let x = w * .14; x < w * .88; x += w * .09) {
    g.beginPath();
    g.moveTo(x, slabTop);
    g.lineTo(x - 2, slabBottom);
    g.stroke();
  }

  // glowing lights along the lower edge, alternating cyan and magenta
  for (let x = w * .13, i = 0; x < w * .88; x += w * .055, i++) {
    const color = i % 2 ? '255,90,220' : '80,230,255';
    const light = g.createRadialGradient(x, slabBottom - 3, 0, x, slabBottom - 3, 9);
    light.addColorStop(0, `rgba(${color},1)`);
    light.addColorStop(1, `rgba(${color},0)`);
    g.fillStyle = light;
    g.fillRect(x - 9, slabBottom - 12, 18, 18);
  }

  // the surface seen from a little above: a dark ellipse with a glowing target ring
  g.fillStyle = '#10142e';
  g.beginPath();
  g.ellipse(cx, slabTop, w * .44, h * .075, 0, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = 'rgba(80,230,255,.95)';
  g.lineWidth = 3;
  g.beginPath();
  g.ellipse(cx, slabTop, w * .44, h * .075, 0, 0, Math.PI * 2);
  g.stroke();
  g.strokeStyle = 'rgba(255,200,90,.9)';
  g.lineWidth = 2;
  g.beginPath();
  g.ellipse(cx, slabTop, w * .2, h * .036, 0, 0, Math.PI * 2);
  g.stroke();
};

// The craft: a classic flying saucer from the side. Lit dome, metal hull, rim lights, dark underside.
const ufo = (g, w, h) => {
  const cx = w / 2;

  // underside: dark disc with a glowing core (the engine glow is drawn separately, in the scene)
  g.fillStyle = '#1b2142';
  g.beginPath();
  g.ellipse(cx, h * .76, w * .3, h * .13, 0, 0, Math.PI * 2);
  g.fill();
  const core = g.createRadialGradient(cx, h * .8, 0, cx, h * .8, w * .17);
  core.addColorStop(0, 'rgba(120,240,255,.95)');
  core.addColorStop(1, 'rgba(120,240,255,0)');
  g.fillStyle = core;
  g.fillRect(cx - w * .2, h * .66, w * .4, h * .3);

  // dome
  const dome = g.createLinearGradient(0, h * .1, 0, h * .55);
  dome.addColorStop(0, 'rgba(190,250,255,.95)');
  dome.addColorStop(1, 'rgba(40,140,200,.85)');
  g.fillStyle = dome;
  g.beginPath();
  g.ellipse(cx, h * .52, w * .19, h * .4, 0, Math.PI, 0);
  g.closePath();
  g.fill();
  g.strokeStyle = 'rgba(255,255,255,.7)';                     // glint
  g.lineWidth = 2;
  g.beginPath();
  g.ellipse(cx, h * .52, w * .15, h * .32, 0, Math.PI * 1.15, Math.PI * 1.5);
  g.stroke();

  // hull
  const hull = g.createLinearGradient(0, h * .45, 0, h * .8);
  hull.addColorStop(0, '#f0f5ff');
  hull.addColorStop(.45, '#95a5cc');
  hull.addColorStop(1, '#3a4570');
  g.fillStyle = hull;
  g.beginPath();
  g.ellipse(cx, h * .6, w * .47, h * .2, 0, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = 'rgba(255,255,255,.55)';                    // lit top edge
  g.lineWidth = 2;
  g.beginPath();
  g.ellipse(cx, h * .6, w * .47, h * .2, 0, Math.PI * 1.1, Math.PI * 1.9);
  g.stroke();

  // rim lights
  for (let i = 0; i < 9; i++) {
    const x = cx + (i - 4) * w * .095;
    const y = h * .62 + Math.abs(i - 4) * h * .004;
    const color = ['255,230,120', '120,240,255', '255,120,220'][i % 3];
    const light = g.createRadialGradient(x, y, 0, x, y, 8);
    light.addColorStop(0, `rgba(${color},1)`);
    light.addColorStop(1, `rgba(${color},0)`);
    g.fillStyle = light;
    g.fillRect(x - 8, y - 8, 16, 16);
  }
};



// ----------------------------------------------------------------------------
// The pads: [x, y, z]. Each is drawn as a sprite AND given to the ships as a landing spot.
// Farther pads (more negative z) look smaller. Tune these to fit your logo and camera.
// ----------------------------------------------------------------------------

const pads =
  [
    [-34, -13, -105],       // left, low, near
    [30, -20, -85],         // right, low, nearest
    [-8, 8, -150],          // centre, floating high, far
    [-72, 14, -175],        // far left, far
  ];

export default
  {
    ...deepSpace,                                               // everything from deepSpace: sky, stars, nebulae, comets...
    name: 'spacePort',

    sprites:
      [
        ...deepSpace.sprites,                                   // the black hole and its glow

        // the ring station, far behind the pads, turning slowly (negative = clockwise)
        // { paint: ringStation, texWidth: 512, texHeight: 512, pos: [-95, 40, -255], size: [110, 110], tint: [.85, .9, 1, .95], spin: .04 },

        // one sprite per pad
        // ...pads.map(pos => ({ paint: landingPad, texWidth: 512, texHeight: 256, pos, size: padSize, tint: [1, 1, 1, 1] })),
      ],

    ships:
    {
      paint: ufo, texWidth: 256, texHeight: 128,
      size: [11, 5.5],
      pads: pads.map(pos => ({ pos, lift: 3.8 })),            // 3.8 = how far above a pad's center a parked craft sits

      landTime: [5, 7],                                       // seconds, each stage
      dwell: [6, 12],
      liftTime: [4, 6],
      cooldown: [2, 8],

      // a landing starts this far from the pad (x, y, z ranges), and a takeoff ends this far
      approach: { x: [-60, 60], y: [60, 100], z: [-90, -30] },
      departure: { x: [-50, 50], y: [70, 110], z: [-100, -40] },

      engineColor: rgb(.5, .9, 1),
      lights: [rgb(1, .3, .0), rgb(.3, 1, .0)],
    },
  };
