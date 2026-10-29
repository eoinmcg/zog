import {
  vec3, rand, sin, time, PI,
} from 'littlejsengine';
import Baddie from './baddie';
import state from '../data/state';
import { fire } from '../helpers/particles';

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
  }

  update() {
    // this.velocity3D.z = state.speed * this.speedFactor;

    super.update();

    this.pos3D.y =
      this.baseY +
      sin(time * this.bobSpeed + this.bobPhase) * this.bobHeight;
    this.rotation3D.z = sin(time * this.bobSpeed + this.bobPhase) * .15;

    if (rand() > .1) { fire(this.pos3D) }
  }
}

