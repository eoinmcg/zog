import {
  EngineObject3D, vec3, vec2, Mesh, buildBox, hsl,
  render3D, buildMatrix, Light3D, timeDelta, time, tile,
  isTouchDevice
} from 'littlejsengine'
// Tunnel.js - an endless tunnel for the runner: walls, ceiling, ribs, pillars and flickering lamps
//
// One long shell mesh that slides toward the camera and wraps around, like
// the road does. Lamps are children of the shell, so they slide with it.
//
//   tunnel = new Tunnel();                                    // wide square hall (default)
//   tunnel = new Tunnel({ halfWidth: 14, shape: 'arch' });    // narrower, arched
//   every frame:        tunnel.speed = config.speed;
//   leaving the level:  tunnel.destroy();
//
// Options (all optional):
//   halfWidth  distance from the center to each wall.            default 24
//   height     wall height for 'square'. For 'arch' it is the straight part of the wall.   default 12 / 3
//   archRise   how high the arch curves above the wall (only for 'arch').     default 8
//   shape      'square' or 'arch'.                                default 'square'
//   pillars    columns beside the road, for depth and speed (square only).    default true
//
// The floor is not part of it. Your road stays as it is.
// Pair it with weather/tunnel.js for the fog, the light at the end and the dust.

const PERIOD = 20;              // the pattern repeats every 20 units; the wrap is invisible
const SEGMENTS = 12;            // 12 x 20 = 240 units long
const ARCH_STEPS = 16;          // how smooth the arch curve is
const RIB_EVERY = 10;           // ribs and pillars along the tunnel
const START_Z = 20;             // shell runs from z = +20 (behind the camera) to far ahead

// Points (x, y) of the cross section: left floor -> up the wall -> across the top -> down the right wall
function crossSection(o) {
  if (o.shape === 'square')
    return [vec2(-o.halfWidth, 0), vec2(-o.halfWidth, o.height), vec2(o.halfWidth, o.height), vec2(o.halfWidth, 0)];

  const points = [vec2(-o.halfWidth, 0), vec2(-o.halfWidth, o.height)];
  for (let i = 1; i <= ARCH_STEPS; i++) {
    const angle = PI - PI * i / ARCH_STEPS;                 // from 180 degrees down to 0
    points.push(vec2(o.halfWidth * Math.cos(angle), o.height + o.archRise * Math.sin(angle)));
  }
  points.push(vec2(o.halfWidth, 0));
  return points;
}

function buildTunnelMesh(o) {
  const mesh = new Mesh();
  const section = crossSection(o);
  const length = PERIOD * SEGMENTS;
  const segmentLength = 10;
  const box = buildBox(1);                                    // unit box, scaled per part

  for (let i = 0; i < section.length - 1; i++) {
    const p0 = section[i], p1 = section[i + 1];
    const edge = p1.subtract(p0);
    const edgeLength = edge.length();
    const edgeAngle = Math.atan2(edge.y, edge.x);
    const inward = vec2(edge.y, -edge.x).normalize();       // interior is to the right of travel
    const middle = p0.add(p1).scale(.5);

    // wall panels: long quads in slightly different shades so it does not look flat
    for (let z = START_Z; z > START_Z - length; z -= segmentLength) {
      const shade = .22 + ((Math.floor(z / segmentLength) + i) % 3) * .015;
      const color = hsl(.58, .12, shade);
      // wound so the face points into the tunnel
      mesh.addQuad(vec3(p0.x, p0.y, z), vec3(p0.x, p0.y, z - segmentLength),
        vec3(p1.x, p1.y, z - segmentLength), vec3(p1.x, p1.y, z), color);
    }

    // ribs: a beam along each edge, pushed inward, every RIB_EVERY units
    const depth = .6;
    const center = middle.add(inward.scale(depth / 2));
    for (let z = START_Z; z > START_Z - length; z -= RIB_EVERY)
      mesh.combine(box,
        buildMatrix(vec3(center.x, center.y, z), vec3(0, 0, edgeAngle), vec3(edgeLength + .02, depth, .9)),
        hsl(.6, .15, .1));
  }

  // pillars on both sides of the road, at every rib
  if (o.pillars && o.shape === 'square')
    for (const side of [-1, 1])
      for (let z = START_Z; z > START_Z - length; z -= RIB_EVERY)
        mesh.combine(box,
          buildMatrix(vec3(side * o.halfWidth * .9, o.height / 2, z), vec3(0, 0, 0), vec3(1.6, o.height, 1.6)),
          hsl(.6, .15, .12));
  return mesh;
}

export default class Tunnel extends EngineObject3D {
  constructor(options = {}) {
    const shape = options.shape ?? 'square';
    const o = {
      shape,
      halfWidth: options.halfWidth ?? 24,
      height: options.height ?? (shape === 'square' ? 12 : 3),
      archRise: options.archRise ?? 8,
      pillars: options.pillars ?? true,
    };
    super(vec3(0, 0, 0), buildTunnelMesh(o));

    this.options = o;
    this.speed = 0;                 // world speed in units per second; set by the game every frame
    this.offset = 0;                // how far the pattern has slid
    this.lamps = [];                // one per segment: { light, bars, baseIntensity, phase, broken }

    let lightGlow = 5;

    // if (isTouchDevice) {
    o.pllars = false
    render3D.bloom = false
    lightGlow = false;

    // }

    const topY = shape === 'square' ? o.height : o.height + o.archRise;
    const lampY = topY - .5;

    // Lamp bars: a row down the middle that carries the light, plus side rows
    // for a wide tunnel (bars only; the engine uses just the 8 nearest lights).
    const rows = o.halfWidth > 12 ? [-o.halfWidth * .5, 0, o.halfWidth * .5] : [0];

    for (let i = 0; i < SEGMENTS; i++) {
      const z = START_Z - i * PERIOD - RIB_EVERY / 2;     // halfway between two ribs
      const bars = [];

      for (const x of rows) {
        const bar = new EngineObject3D(vec3(x, lampY, z), buildBox(vec3(3.5, .15, .5)), undefined, hsl(.11, .35, .95));
        bar.emissive = 1;                               // emissive = ignores shading, so it glows
        bar.castShadow = false;
        this.addChild(bar);
        bars.push(bar);
      }

      // the real light, in the middle: bigger radius for a wider tunnel
      const light = new Light3D(vec3(0, lampY - .3, z), Math.max(26, o.halfWidth * 1.7), hsl(.1, .7, .65), 1.5);
      if (lightGlow) {
        light.glow = lightGlow;
      }
      this.addChild(light);

      this.lamps.push({ light, bars, baseIntensity: light.intensity, phase: Math.random() * 100, broken: i % 4 === 1 });
    }
  }

  update() {
    // slide, and wrap every PERIOD so it repeats seamlessly
    this.offset += this.speed * timeDelta;
    this.pos3D.z = this.offset % PERIOD;

    // flicker: all lamps hum a little, "broken" ones cut out now and then
    for (const lamp of this.lamps) {
      const hum = 1 + .06 * Math.sin(time * 50 + lamp.phase);
      const cutOut = lamp.broken && Math.sin(time * 23 + lamp.phase) * Math.sin(time * 7.3 + lamp.phase * 2) > .5;
      lamp.light.intensity = lamp.baseIntensity * (cutOut ? .08 : hum);
      for (const bar of lamp.bars) bar.emissive = cutOut ? .1 : 1;
    }
  }
}
