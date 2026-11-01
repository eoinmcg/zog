import { EngineObject3D, buildExtrude, vec3, rand, tile, vec2, time, Light3D } from 'littlejsengine';
import config from '../data/config';
import { spark } from '../helpers/particles';

export default class BossFire extends EngineObject3D {
  constructor(pos3D, velocityX = 0, velocityY = 0, speedZ = .8) {
    const col = config.palette.grass.col;
    super(pos3D, buildExtrude(tile(38, config.tileSize), vec2(1), .2), undefined, col);

    this.name = 'enemy';
    this.type = 'bossProjectile';
    this.emissive = 1;
    this.addChild(new Light3D(vec3(), 7, col));
    this.scale3D = vec3(1.2, 1.2, 2.4);
    this.size3D = vec3(.8, .8, 1.6);
    this.velocity3D = vec3(velocityX, velocityY, speedZ);
    this.age = 0;
    this.setCollision(true, false);

    this.baseColor = config.palette.grass.col;
    this.pulseColor = config.palette.yellow.col
    this.pulseOffset = rand(0, 10);

  }

  update() {
    super.update();
    ++this.age;
    this.rotation3D.x += .12;
    this.rotation3D.z += .08;
    if (this.age % 6 === 0 && rand() > .35) spark(this.pos3D.copy());
    if (this.pos3D.z > 12 || this.age > 150) this.destroy();
  
    const pulse = (Math.sin(time * 8 + this.pulseOffset) + 1) / 2;
    this.color = this.baseColor.lerp(this.pulseColor, pulse);

  }

  collideWithObject(o) {
    if (o.name !== 'player') return;
    o.loseLive(this);
    this.destroy();
  }
}
