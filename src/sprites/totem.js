import {
  EngineObject3D, buildBox, buildExtrude, tile,
  vec2, vec3, rand, sin, time, RED,
} from 'littlejsengine';
import { boom, spark } from '../helpers/particles';

import config from '../data/config';
import state from '../data/state';

export default class Totem extends EngineObject3D {
  constructor(pos) {

    pos = pos || vec3(rand(-12, 12), 2, -100);
    const shape = buildBox(vec3(1, 7, 1));
    const texture = tile(31, config.tileSize)
    const col = config.palette.plum.col;

    super(pos, shape, texture, col)

    this.name = 'enemy';
    this.type = 'totem';
    this.pixelated = true;
    this.health = 5;
    this.value = 20;

    // const frames = [60, 61]
    // const frames = [28, 29]
    // const frames = [60]
    const frames = [53]
    this.masks = frames.map(i => buildExtrude(tile(i, config.tileSize), vec2(1.4), .1))
    this.head = this.addChild(new EngineObject3D(vec3(-.05, 3.05, .5), this.masks[0]))
    this.setCollision(true, true);

    this.targetY = .5;
    this.pos3D.y = this.targetY - 5;

  }

  update() {
    this.pos3D.y += (this.targetY - this.pos3D.y) * .05;
    const wave = sin(time * 2)
    this.velocity3D = vec3(0, 0, state.speed);

    // const frame = wave > 0 ? 0 : 1;
    // this.head.mesh = this.masks[frame]

    // this.pos3D.y = wave + 1

    if (this.pos3D.z > 9) {
      this.destroy();
    }

  }

  collideWithObject(o) {
    if (o.name === 'enemy') return;

    if (o.name === 'laser') {
      this.health -= 1;
    }

    if (o.name === 'coin') {
      return
    }

    if (o.name === 'obstacle') {
      return
    }

    if (o.name === 'player') {
      o.loseLive(this);
    }

    if (this.health <= 0) {
      this.destroy(o);
      boom(o.pos3D.add(vec3(0, 0, 3)));
      state.score += this.value;
    } else {
      this.color = RED;
      spark(this.pos3D);
    }
    config.sfx.play('explosion');
  }
}
