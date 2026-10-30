import {
  EngineObject3D, buildCylinder,
  createCanvasContext, TextureInfo, vec3,
  randInt, randSign, PI, hsl, tile, Color,
} from 'littlejsengine'

import config from '../data/config';
import state from '../data/state';
import { boom } from '../helpers/particles';

export default class Obstacle extends EngineObject3D {
  constructor(pos3D, size = 1, long = 1) {

    let texture,
      p = config.palette,
      col = p.white.col

    const settings = state.level.obstacles
    if (settings?.tile) {
      texture = tile(settings.tile, config.tileSize)
    } else {
      texture = makeBrickTexture()
    }
    if (settings?.col) {
      col = p[settings.col].col
      console.log(col, settings.col)
    }

    super(pos3D, buildCylinder(1, 1), texture, col);
    this.scale3D = vec3(size * (10 * long), size * 2, size);
    this.size3D = vec3(size);      // matches scale3D so collision matches how it looks
    this.setCollision(true, true); // takes part in solid collision, and blocks

    this.castShadow = true
    this.velocity3D = vec3(0, 0, state.speed);
    this.name = 'obstacle'


    switch (randInt(3)) {
      case 0: this.rotation3D.z = 0; break;
      case 1: this.rotation3D.z = PI * .25 * randSign(); break;
      case 2: this.rotation3D.z = PI * .5; break;
    }

    if (config.weather && config.weather.name === 'darkTunnel' && this.rotation3D.z === 0) {
      this.rotation3D.z = PI * .5;
    }

  }

  update() {

    if (this.pos3D.y < .5) {
      this.pos3D.y += .1
    }
    this.velocity3D = vec3(0, 0, state.speed);
    // this.rotation3D.z += .01
    super.update()
    if (this.pos3D.z > 10) {

      this.destroy()
    }
  }

  collideWithObject(o) {

    if (o.name === 'enemy') return
    if (o.name === 'portal') return
    if (o.name === 'coin') return

    if (o.name === 'player') {
      o.loseLive(this);
    }
    // this.destroy()
    boom(o.pos3D.add(vec3(0, 0, 3)))
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
