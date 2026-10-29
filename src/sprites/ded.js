import {
  EngineObject3D, buildExtrude,
  vec2, vec3, tile, lerp, PI,
} from "littlejsengine";

import config from "../data/config";

export default class Ded extends EngineObject3D {

  constructor(pos) {
    const frame = buildExtrude(tile(10, config.tileSize), vec2(1), .2);
    super(pos.copy(), frame);

    this.name = 'ded';

    this.groundY = .6;
    this.fallSpeed = 0;
    this.landed = this.pos3D.y <= this.groundY;

    this.rotation3D = vec3(0, this.landed ? PI : 0, 0);

    if (this.landed) {
      this.pos3D.y = this.groundY;
    }
  }

  update() {
    super.update();

    if (!this.landed) {

      // Accelerate downward
      this.fallSpeed += .015;
      this.pos3D.y -= this.fallSpeed;

      if (this.pos3D.y <= this.groundY) {
        this.pos3D.y = this.groundY;
        this.landed = true;
      }

    } else {

      // Smoothly rotate after landing
      this.rotation3D.x = lerp(this.rotation3D.x, PI * .5, .3);

    }
  }
}

