import {
  EngineObject3D, buildCylinder, buildCone,
  createCanvasContext, TextureInfo, vec3,
  randInt, randSign, PI, hsl, tile,
  clamp, lerp, render3D,
} from 'littlejsengine'

import config from '../data/config';
import state from '../data/state';
import { boom, spark } from '../helpers/particles';

export default class Obstacle extends EngineObject3D {
  constructor(pos3D, size = 1, long = 1, angles = 3) {

    let texture,
      p = config.palette,
      shape,
      col = p.white.col

    const settings = state.level.obstacles
    if (settings?.tile) {
      texture = tile(settings.tile, config.tileSize)
    } else {
      texture = makeBrickTexture()
    }
    if (settings?.col) {
      col = p[settings.col].col
    }

    let zRot;
    if (settings?.shape === 'spike') {
      shape = buildCone(1, 1)
      zRot = PI * .5 * randSign();
    } else {
      shape = buildCylinder(1, 1)
      switch (randInt(angles)) {
        case 0: zRot = 0; break;
        case 1: zRot = PI * .25 * randSign(); break;
        case 2: zRot = PI * .5; break;
      }
    }

    super(pos3D, shape, texture, col);
    this.color = col.copy();
    this.scale3D = vec3(size * (10 * long), size * 2, size);
    this.size3D = vec3(size);      // matches scale3D so collision matches how it looks
    this.setCollision(true, true); // takes part in solid collision, and blocks
    this.rotation3D.z = zRot

    this.castShadow = true
    this.velocity3D = vec3(0, 0, state.speed);
    this.name = 'obstacle'


    if (config.weather && config.weather.name === 'darkTunnel' && this.rotation3D.z === 0) {
      this.rotation3D.z = PI * .5;
    }

    if (settings?.glow === true) {
      this.emissive = 1;
    }


    this.targetY = .5;
    this.pos3D.y = this.targetY - 5;
  }

  update() {
    this.pos3D.y += (this.targetY - this.pos3D.y) * .05;
    this.velocity3D = vec3(0, 0, state.speed);
    super.update()

    this.updateFade()

    if (this.pos3D.z > 10) {
      this.destroy()
    }
  }

  updateFade() {

    if (config.lowQuality) {
      if (this.transparent) {
        this.color.a = 1;
        this.transparent = false;
      }
      return;
    }
    // 1. mild early fade as it nears the camera: 100% at dz >= 26, 85% at dz <= 15
    const dz = render3D.camera.pos.z - this.pos3D.z;
    const early = lerp(.7, 1, clamp((dz - 15) / (26 - 15), 0, 1));

    // 2. stronger fade once it has passed the player (no longer a threat): 100% -> 30% over 6 units
    let passed = 1;
    if (state.player) {
      const behind = this.pos3D.z - state.player.pos3D.z;   // > 0 once past the player
      passed = lerp(1, .3, clamp(behind / 6, 0, 1));
    }

    const alpha = Math.min(early, passed);
    if (alpha >= .99) {
      this.color.a = 1;
      this.transparent = false;
    } else {
      this.transparent = true;    // flag first, then alpha
      this.color.a = alpha;
    }

  }

  collideWithObject(o) {

    if (o.name === 'enemy') return
    if (o.name === 'portal') return
    if (o.name === 'coin') return

    if (o.name === 'player') {
      o.loseLive(this);
    }

    if (o.name === 'laser') {
      o.destroy(false);
      // return
    }

    // this.destroy()
    spark(o.pos3D.add(vec3(0, 0, 3)))
    config.sfx.play('blip')
  }
}

function makeBrickTexture(col = 'poop') {
  const size = 64, context = createCanvasContext(size);
  context.fillStyle = hsl(.05, .4, .3);
  context.fillRect(0, 0, size, size);
  context.fillStyle = hsl(.05, .5, .5);
  context.fillStyle = config.palette[col].col
  for (let row = 4; row--;)
    for (let col = 5; col--;)
      context.fillRect(col * 32 + (row & 1) * 8 - 8, row * 16, 30, 14);
  return new TextureInfo(context.canvas, true, true); // wrap, so uvs repeat
}
