import {
  EngineObject3D, buildCylinder,
  vec3, hsl, clamp, lerp, rand,
} from 'littlejsengine';

import { boom } from '../helpers/particles';
import config from '../data/config';

export default class Shockwave extends EngineObject3D {
  constructor(pos3D) {
    super(
      pos3D,
      buildCylinder(1, 1),
      undefined,
      config.palette.red.col
    );

    this.name = 'shockwave';

    this.startZ = pos3D.z;
    this.endZ = 10;

    this.size3D = vec3(8, .4, .4);

    this.velocity3D = vec3(0, 0, 1.5);
    this.setCollision(true, true);

  }

  update() {
    super.update();

    this.scale3D.x += .5;
    let x = this.scale3D.x / 2
    if (rand() > .5) {
      boom(vec3(
        this.pos3D.x + rand(-x, x),
        this.pos3D.y,
        this.pos3D.z
      ));
    }

    if (this.pos3D.z > this.endZ) {
      this.destroy();
    }
  }

  collideWithObject(o) {
    if (o.name === 'player') {
      o.loseLive(this);
    }
  }
}
