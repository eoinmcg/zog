import {
  vec3, rand
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
      health: 3,
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

    if (this.contains && this.contains === 'heart') {
      new Heart(this.pos3D);
      return
    }

    if (this.contains && this.contains === 'coin') {
      new Coin(this.pos3D);
      return
    }

    if (rand() < 0.7) {
      new Coin(this.pos3D);
    } else {
      new Heart(this.pos3D);
    }
    super.destroy()
  }

}


