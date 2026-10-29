import {
  vec3,
} from 'littlejsengine';

import Baddie from './baddie';
import Coin from './coin';
import state from '../data/state';

export default class Crate extends Baddie {
  constructor(pos) {
    super(pos, {
      animFrames: [27],
      animSpeed: 10,
      scale: vec3(2, 4, 2),
      health: 3,
      value: 10,
      type: 'crate',
      scale: vec3(2),
      extrudeBy: 1,
    });
    this.velocity3D = vec3(0, 0, state.speed);

    this.pos3D.y = .9;
  }

  update() {
    super.update()
    this.velocity3D = vec3(0, 0, state.speed * 1.1);
  }

  destroy() {
    new Coin(this.pos3D);
    super.destroy()
  }

}


