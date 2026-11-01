import { EngineObject3D, buildCylinder, vec3, rand, time } from 'littlejsengine';
import { boom } from '../helpers/particles';
import config from '../data/config';

export default class Shockwave extends EngineObject3D {
  constructor(pos3D) {
    super(pos3D, buildCylinder(1, 1), undefined, config.palette.red.col);
    this.name = 'enemy';
    this.type = 'shockwave';
    this.endZ = 12;
    this.size3D = vec3(8, .4, .4);
    this.scale3D = vec3(1, 1, 1);
    this.velocity3D = vec3(0, 0, 1.3);
    this.emissive = 1;
    this.age = 0;
    this.setCollision(true, false);

    this.baseColor = config.palette.grass.col;
    this.pulseColor = config.palette.yellow.col
    this.pulseOffset = rand(0, 10);
    
  }

  update() {
    super.update();
    ++this.age;
    this.scale3D.x += .6;
    const halfWidth = this.scale3D.x / 2;
    if (this.age % 4 === 0 && rand() > .4) {
      boom(vec3(this.pos3D.x + rand(-halfWidth, halfWidth), this.pos3D.y, this.pos3D.z));
    }
    if (this.pos3D.z > this.endZ || this.age > 120) this.destroy();

    const pulse = (Math.sin(time * 8 + this.pulseOffset) + 1) / 2;
    this.color = this.baseColor.lerp(this.pulseColor, pulse);
  }

  collideWithObject(o) {
    if (o.name !== 'player') return;
    o.loseLive(this);
    this.destroy();
  }
}
