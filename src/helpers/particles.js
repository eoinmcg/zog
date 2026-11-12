import { ParticleEmitter3D, PI, tile, hsl, rgb, vec3 } from "littlejsengine";
import config from "../data/config";

export function spark(pos) {
  const sparks = new ParticleEmitter3D(
    pos,
    0, 0.01,                              // emitSize, emitTime
    100, PI, tile(0, config.tileSize),               // rate, cone, tileInfo
    hsl(.2, 1, .8), hsl(.1, 1, .7),        // colorStartA, colorStartB
    hsl(0, 1, .5, 0), hsl(0, 1, .5, 0),      // colorEndA, colorEndB
    .5, .3, .1,                         // time, sizeStart, sizeEnd
    .2, .98, -.05,                    // speed, damping, gravity
    .2, .3, true                       // fade, randomness, additive
  );
  sparks.trailTime = .05;
}

export function dust(pos) {
  const particles = new ParticleEmitter3D(
    pos,
    0, .04,                              // emitSize, emitTime
    80, PI * .65, tile(0, config.tileSize), // rate, cone, tileInfo
    hsl(.1, .25, .8), hsl(.08, .2, .6), // colorStartA, colorStartB
    hsl(.1, .1, .7, 0), hsl(.08, .1, .6, 0), // colorEndA, colorEndB
    .35, .25, .05,                      // time, sizeStart, sizeEnd
    .12, .9, .015,                      // speed, damping, gravity
    .2, .5, false                       // fade, randomness, additive
  );

  particles.trailTime = 0;
}

export function buy(pos) {
  const sparks = new ParticleEmitter3D(
    pos,
    .5, 0.2,                              // emitSize, emitTime
    100, PI, tile(0, config.tileSize),               // rate, cone, tileInfo
    hsl(.2, 1, .8), hsl(.1, 1, .7),        // colorStartA, colorStartB
    hsl(0, 1, .5, 0), hsl(0, 1, .5, 0),      // colorEndA, colorEndB
    .5, .3, .1,                         // time, sizeStart, sizeEnd
    .2, .98, 0,                    // speed, damping, gravity
    .2, .3, true                       // fade, randomness, additive
  );
  sparks.trailTime = .05;
}


export function boom(pos, gravity = -.02) {
  new ParticleEmitter3D(
    pos,                  // pos
    1, .1,                         // emitSize, emitTime
    600, PI, undefined,            // rate, cone, tileInfo
    hsl(.1, 1, .8), hsl(0, 1, .5),     // colorStartA, colorStartB
    hsl(.1, 1, .5, 0), hsl(0, 1, .5, 0), // colorEndA, colorEndB
    1, 1.5, 0,                     // time, sizeStart, sizeEnd
    .4, .95, gravity,                 // speed, damping, gravity
    .1, .5, true                   // fade, randomness, additive
  );
}

export function collect(pos, gravity = -.02) {
  new ParticleEmitter3D(
    pos,                  // pos
    .15, .05,                         // emitSize, emitTime
    200, PI, tile(39, config.tileSize),            // rate, cone, tileInfo
    rgb(1, .84, .6, .3), rgb(1, 0, 0, .3),     // colorStartA, colorStartB
    rgb(1, .6, 0, 0),    rgb(1, 0, 0, 0),      // colorEndA, colorEndB
    1, 1.5, 0,                     // time, sizeStart, sizeEnd
    .2, .95, gravity,                 // speed, damping, gravity
    .05, .5, true                   // fade, randomness, additive
  );
}


export function fire(pos) {
  new ParticleEmitter3D(
    pos,
    2, .2,                              // emitSize, emitTime
    5, .3, undefined,                 // rate, cone, tileInfo
    hsl(.1, 1, .5, .5), hsl(.15, 1, .7, .5), // colorStartA, colorStartB
    hsl(0, 1, .5, 0), hsl(0, 1, .3, 0),      // colorEndA, colorEndB
    1, 2, 0,                           // time, sizeStart, sizeEnd
    .15, .96, 0,                       // speed, damping, gravity
    .1, .3, true                       // fade, randomness, additive
  );
}

export function jetpackFlame(pos) {
  const flame = new ParticleEmitter3D(
    pos,
    0, .01,                         // emitSize, emitTime
    160, PI / 8,                    // rate, cone
    tile(0, config.tileSize),

    hsl(.55, 1, .55),               // electric blue
    hsl(.12, 1, .55),               // golden yellow

    hsl(.03, 1, .4, 0),             // deep orange
    hsl(.08, 1, .35, 0),            // amber

    .3, .35, .08,                   // lifetime, start size, end size
    .4, .92, -.02,                  // speed, damping, gravity
    .15, .25, false                 // fade, randomness, additive
  );

  flame.rotation3D.x = PI;
  flame.trailTime = .04;

  return flame;
}

export function portalParticles(pos) {
  const emitter = new ParticleEmitter3D(
    pos,
    0, .05,
    80, PI * 2, tile(0, config.tileSize),

    hsl(.12, 1, .9),
    hsl(.06, 1, .7),

    hsl(.12, 1, .5, 0),
    hsl(.06, 1, .4, 0),

    .6, .15, .02,
    .15, .96, 0,
    .2, .4, true
  );

  emitter.trailTime = .1;
}


export function bossEntry(pos) {
  new ParticleEmitter3D(
    pos.copy(),
    vec3(2, 2, 2), // Spawn area
    .12,            // Emit duration (seconds)
    450,            // Particles per second
    PI,             // All directions
    undefined,      // Default particle texture

    hsl(.30, 1, .55), // Grass green
    hsl(.15, 1, .6),  // Yellow

    hsl(.30, 1, .3, 0), // Fade green to transparent
    hsl(.15, 1, .3, 0), // Fade yellow to transparent

    .65,  // Particle lifetime
    .8,   // Initial size
    .05,  // Final size
    .35,  // Speed
    .94,  // Damping
    0,    // Gravity
    .1,   // Fade rate
    .5,   // Randomness
    true  // Additive blending
  );
}
