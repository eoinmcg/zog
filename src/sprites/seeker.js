import {
  vec3, randSign
} from 'littlejsengine';

import Baddie from './baddie';
import Coin from './coin';
import state from '../data/state';

export default class Seeker extends Baddie {
  constructor(pos) {
    super(pos, {
      animFrames: [56, 57],
      // animFrames: [40, 41, 42],
      animSpeed: 10,
      health: 1,
      value: 20,
      scale: vec3(2),
      type: 'seeker',
      scale: vec3(2)
    });
    this.velocity3D = vec3(.1 * randSign(), 0, state.speed);
    this.speedFactor = 1.2;


    this.pos3D.y = .9;
    this.homingSpeed = .5
  }

  update() {
    super.update();

    this.velocity3D.z = state.speed * this.speedFactor;

    const p1 = state.player;
    if (!p1) return;

    // const dx = p1.pos3D.x - this.pos3D.x;
    // const targetVx = Math.sign(dx) * this.homingSpeed;
    //
    // // Smoothly adjust horizontal velocity
    // this.velocity3D.x += (targetVx - this.velocity3D.x) * 0.05;
    const dx = p1.pos3D.x - this.pos3D.x;

    const targetVx =
      Math.abs(dx) < 0.5
        ? 0
        : Math.sign(dx) * this.homingSpeed;

    this.velocity3D.x += (targetVx - this.velocity3D.x) * 0.05;
  }

  destroy() {
    new Coin(this.pos3D);
    super.destroy()
  }

}
