import {
  vec3, rand, sin, time, PI, lerp, clamp,
} from 'littlejsengine';

import Baddie from './baddie';
import state from '../data/state';
import { fire, spark } from '../helpers/particles';

export default class Skull extends Baddie {
  constructor(pos) {
    super(pos, {
      animFrames: [28],
      animSpeed: 10,
      health: 0,
      value: 10,
      type: 'skull',
      scale: vec3(2)
    });

    this.baseY = this.pos3D.y;
    this.bobSpeed = rand(2, 4);
    this.bobHeight = rand(1, 3);
    this.bobPhase = rand(0, PI * 2);

    // Homing
    this.homeStrength = .003;
    this.maxDrift = 2.5;
    this.startX = this.pos3D.x;
  }

  update() {
    super.update();

    const player = state.player;

    if (player && !player.dead) {

      // Never drift too far from original path
      const targetX = clamp(
        player.pos3D.x,
        this.startX - this.maxDrift,
        this.startX + this.maxDrift
      );

      // Very gentle tracking, active from spawn
      this.pos3D.x = lerp(
        this.homeStrength,
        this.pos3D.x,
        targetX
      );
    }

    // Original bobbing, completely unchanged
    const bob = sin(
      time * this.bobSpeed + this.bobPhase
    );

    this.pos3D.y = this.baseY + bob * this.bobHeight;
    this.rotation3D.z = bob * .15;

    if (rand() > .7) {
      fire(this.pos3D);
    }
  }
}
