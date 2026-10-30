import {
  EngineObject3D, buildExtrude,
  tile, vec2, vec3, rand, PI, time,
  RED,
} from 'littlejsengine';

import config from '../data/config';
import state from '../data/state';
import { boom, spark, fire } from '../helpers/particles';

export default class Baddie extends EngineObject3D {
  constructor(pos, options = {}) {
    const {
      animFrames = [0],
      animSpeed = 8,
      health = 1,
      value = 10,
      scale = vec3(2),
      speed = .1,
      type = 'baddie',
      extrudeBy = .3,
      customMesh = null // <--- Added option for non-tile meshes
    } = options;

    let frames;
    if (customMesh) {
      frames = [customMesh];
    } else {
      frames = animFrames.map(i => buildExtrude(tile(i, config.tileSize), vec2(1), extrudeBy));
    }

    pos = pos || vec3(rand(-8, 8), rand(3, 5), -100);

    super(pos, frames[0]);

    this.speed = speed;
    this.velocity3D.z = state.speed;
    this.scale3D = scale;
    this.animFrames = animFrames;
    this.frames = frames;
    this.animSpeed = animSpeed;
    this.frameIndex = 0;

    this.pixelated = true;
    this.name = 'enemy';
    this.type = type;
    this.health = health;
    this.value = value;

    this.setCollision(true, true);
  }

  update() {
    super.update();

    // Continuous loop animation logic
    if (this.animFrames.length > 1) {
      this.frameIndex = Math.floor(time * this.animSpeed) % this.animFrames.length;
      this.mesh = this.frames[this.frameIndex];
    }

    // Face rotation based on position
    this.rotation3D = this.pos3D.x < 0 ? vec3(0, PI, 0) : vec3(0, 0, 0);

    // Despawn boundary check
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
