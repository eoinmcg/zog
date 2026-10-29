import {
  EngineObject3D, render3D, Light3D,
  vec3, hsl, RED, time
} from 'littlejsengine'

import config from "../data/config";
import { boom } from '../helpers/particles';

export default class Laser extends EngineObject3D {
  constructor(from, target) {
    from = from.add(vec3(0, 0, -2))
    super(from, render3D.boxMesh, undefined, hsl(.0, 1, .6)); // shared mesh, tint is the color
    this.scale3D = vec3(.2, .3, 3);   // long along its own z
    this.emissive = 1;                // own color, brighter than lit
    this.addChild(new Light3D(vec3(), 10, RED));
    this.castShadow = this.receiveShadow = false;
    this.lookAt(target);                // points -Z at the target, the box is the same both ways
    this.velocity3D = target.subtract(from).normalize(-5); // 3 units per frame
    this.spawnTime = time;
    this.collideAsSphere3D = true;
    this.setCollision();
    this.name = 'laser'
    config.sfx.play('laser')
  }

  update() {
    // far away, under the floor, or old: remove it
    if (this.pos3D.z < -200 || this.pos3D.y < 0 || time - this.spawnTime > 3)
      this.destroy(false);
  }

  destroy(explode = true) {
    if (explode) {
      boom(this.pos3D.add(vec3(0, 0, 3)))
    }
    super.destroy()
  }
}

