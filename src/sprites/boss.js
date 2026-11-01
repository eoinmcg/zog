import {
  EngineObject3D, buildExtrude, render3D,
  Light3D, tile, vec2, vec3, Trail3D, hsl,
  WHITE, PI, tweak, timeDelta, time,
  clamp, lerp, rand, setPaused,
} from 'littlejsengine'

import { spark, boom } from '../helpers/particles';
import state from '../data/state';
import config from '../data/config';

import Shockwave from './shockwave';
import BossFire from './bossfire';

export default class Boss extends EngineObject3D {

  constructor() {
    const frameIndices = [0]
    const frames = frameIndices.map(i => buildExtrude(tile(i, 16, 1), vec2(8), .3));
    super(vec3(0, 5, -50), frames[0]);

    this.name = 'boss';
    this.attackTimer = 0;

    this.velocity3D = vec3(.1, 0, 0)

    this.maxEnergy = 1;
    this.energy = this.maxEnergy;

    this.hitTimer = 0;
    this.hitCooldown = 15;
    this.dead = false;

    this.normalColor = this.color;
    this.setCollision();
    this.emissive = 1
    this.addChild(new Light3D(vec3(), 10, WHITE));

  }


  update() {
    super.update();

    this.attackTimer++;
    const maxX = 6
    if (Math.abs(this.pos3D.x) >= maxX) {
      this.pos3D.x = clamp(this.pos3D.x, -maxX, maxX);
      this.velocity3D.x *= -1;
    }

    if (this.attackTimer >= 180) {
      this.attackTimer = 0;
      new Shockwave(vec3(0, .5, this.pos3D.z + 5));
      this.fire()
    }

    if (this.hitTimer > 0) {
      this.hitTimer--;
      if (!this.hitTimer) {
        this.color = this.normalColor;
      }
    }
  }

  collideWithObject(o) {
    console.log({ o })
    if (o.name !== 'laser') return;

    o.destroy(false);
    this.takeDamage();
  }

  takeDamage(amount = 1) {
    if (this.dead || this.hitTimer > 0) return;

    this.energy = Math.max(0, this.energy - amount);

    this.hitTimer = this.hitCooldown;
    this.color = hsl(0, 1, .5);

    spark(this.pos3D);

    if (this.energy <= 0) {
      this.die();
    }
  }

  die() {
    if (this.dead) return;

    this.dead = true;

    spark(this.pos3D);
    this.destroy();
    state.shake = 3

    const pos = this.pos3D.copy();

    for (let i = 0; i < 25; i++) {
      state.events.add(i * .05, () => {
        boom(pos.add(vec3(
          rand(-4, 4),
          rand(-4, 4),
          rand(-2, 2)
        )));
      });
    }
    // TODO: victory sequence
  }
  fire() {
    const count = 5;
    const spread = .4;

    for (let i = 0; i < count; i++) {
      const velocityX = (i - (count - 1) / 2) * spread;

      state.events.add(i, () => {
        new BossFire(
          this.pos3D.add(vec3(0, 0, 5)),
          velocityX
        );
      })
    }
  }
}
