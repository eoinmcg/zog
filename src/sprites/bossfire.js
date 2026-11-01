import {
  EngineObject3D, buildExtrude,
  vec3, rand, tile, vec2, Light3D,
} from 'littlejsengine';

import config from '../data/config';
import { spark } from '../helpers/particles';

export default class BossFire extends EngineObject3D {
  constructor(pos3D, velocityX = 0) {
    const col = config.palette.grass.col
    super(
      pos3D,
      buildExtrude(tile(38, config.tileSize), vec2(1), .2),
      undefined,
      col
    );

    this.name = 'bossProjectile';

    this.emissive = 1;
    this.addChild(new Light3D(vec3(), 10, col));

    this.scale3D = vec3(1.5, 1.5, 3);
    this.size3D = vec3(1, 1, 2);

    this.velocity3D = vec3(velocityX, 0, .8);

    // Damage on contact, but don't physically block player
    this.setCollision(true, false);
  }

  update() {
    super.update();

    this.rotation3D.x += 0.1

    // Occasional sparks
    if (rand() > .9) {
      spark(this.pos3D);
    }

    if (this.pos3D.z > 10) {
      this.destroy();
    }
  }

  collideWithObject(o) {
    if (o.name === 'player') {
      o.loseLive(this);
      this.destroy();
    }
  }
}
