import {
  vec3, rand,
  PI
} from 'littlejsengine';

import Baddie from './baddie';
import Coin from './coin';
import Heart from './heart';
import state from '../data/state';

export default class Crate extends Baddie {
  constructor(pos, contains = false) {
    super(pos, {
      animFrames: [27],
      animSpeed: 10,
      scale: vec3(2, 4, 2),
      health: 1,
      value: 10,
      type: 'crate',
      scale: vec3(2),
      extrudeBy: 1,
    });
    this.velocity3D = vec3(0, 0, state.speed);

    this.pos3D.y = .9;
    this.contains = contains
  }

  update() {
    super.update()
    this.velocity3D = vec3(0, 0, state.speed * 1.1);
  }

  destroy() {

    if (state.lives <= 1) {
      new Heart(this.pos3D);
    } else if (state.rand() > .9 && state.lives <= 1) {
      new Heart(this.pos3D);
    } else {
      new Coin(this.pos3D);
    }

    super.destroy()
  }

}


