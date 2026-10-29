import {
  vec3, randSign
} from 'littlejsengine';

import Baddie from './baddie';
import Coin from './coin';
import state from '../data/state';

export default class Crawler extends Baddie {
  constructor(pos) {
    super(pos, {
      animFrames: [58, 59],
      // animFrames: [40, 41, 42],
      animSpeed: 10,
      health: 0,
      value: 10,
      scale: vec3(2),
      type: 'drone',
      scale: vec3(2)
    });
    this.velocity3D = vec3(.1 * randSign(), 0, state.speed);
    this.speedFactor = 1.1;


    this.pos3D.y = .9;
  }

  update() {
    super.update();

    this.velocity3D.z = state.speed * this.speedFactor;

    const MAX_X = 12;
    const x = this.pos3D.x;
    const vx = this.velocity3D.x;

    if (x >= MAX_X && vx > 0) {
      this.pos3D.x = MAX_X;
      this.velocity3D.x = -vx;
    }
    else if (x <= -MAX_X && vx < 0) {
      this.pos3D.x = -MAX_X;
      this.velocity3D.x = -vx;
    }
  }

  destroy() {
    new Coin(this.pos3D);
    super.destroy()
  }

}

