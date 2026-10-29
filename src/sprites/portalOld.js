import {
  EngineObject3D, Light3D, tile,
  buildSphere, buildTorus, buildExtrude,
  vec3, vec2, rand, time, Color,
} from 'littlejsengine';

import state from '../data/state';
import { portalParticles } from '../helpers/particles';

const size = 5;
const type = '2d'

export default class Portal extends EngineObject3D {
  constructor() {

    super(vec3(0, 2, -200))

    this.velocity3D.z = state.speed;
    this.name = 'portal'

    if (type === '2d') {
      this.setup2d()
    } else {
      this.setup3d()
    }
  }

  setup2d() {
    const portalSize = size * 10;

    this.mesh = buildExtrude(
      tile(1, 16, 1),
      vec2(portalSize),
      .3
    );

    this.pos3D.y = 20;
    this.emissive = 1;
    this.color = new Color(1, 1, 1);

    // Explicitly set collision dimensions
    this.size3D = vec3(portalSize, portalSize, 2);

    this.setCollision(true, true);
  }
  setup3d() {
    this.mesh = buildSphere(size, 24, 16);
    this.transparent = true
    this.color = new Color(.8, .8, .1, .5);
    this.emissive = 1

    this.completed = false;

    this.light = this.addChild(
      new Light3D(
        vec3(0, 0, 0),
        30,
        new Color(1, .8, .2)
      )
    );
    this.ring1 = this.buildRing(size * 1.4)
    this.ring2 = this.buildRing(size * 1.4)
  }


  update() {
    super.update();

    this.emitParticles();

    if (this.is3d) {
      this.update3d()
    } else {
      this.rotation3D.z += .05;
    }
  }

  collideWithObject(o) {
    console.log("COLCHCK")

    if (state.levelExitReached === true) return

    // console.log({ o })
    if (o.name === 'player') {
      console.log('PLAYER')
      state.speed = 0
      state.levelExitReached = true;
    }
  }

  update3d() {
    const pulse = 1 + Math.sin(time * 5) * .08;
    this.scale3D = vec3(3 * pulse);

    this.rotation3D.y += .01;
    this.rotation3D.z += .005;

    this.ring1.rotation3D.y += .02;
    this.ring1.rotation3D.x += .01;

    this.ring2.rotation3D.y -= .02;
    this.ring2.rotation3D.x -= .01;
    this.checkPlayerCollide()

  }

  checkPlayerCollide() {

    const player = state.player;

    if (player && !this.completed) {
      const dx = player.pos3D.x - this.pos3D.x;
      const dy = player.pos3D.y - this.pos3D.y;
      const dz = player.pos3D.z - this.pos3D.z;

      const distance = Math.hypot(dx, dy, dz);

      if (distance < 2) {
        this.completed = true;
        state.speed = 0;
        this.velocity3D.z = 0;
        state.levelExitReached = true;
      }
    }
  }


  emitParticles() {
    const radius = 5 * this.scale3D.x;

    const y = rand(-1, 1);
    const angle = rand(0, Math.PI * 2);
    const r = Math.sqrt(1 - y * y);

    const pos = this.pos3D.add(vec3(
      r * Math.cos(angle) * radius,
      y * radius,
      r * Math.sin(angle) * radius
    ));

    portalParticles(pos);
  }

  buildRing(size) {
    size = size || this.size3D.x * 1.4
    const ring = new EngineObject3D(
      vec3(), buildTorus(size, .3, 32, 8)
    );

    ring.transparent = true;
    ring.color = new Color(1, 1, 1, .3);
    ring.emissive = 1;

    this.addChild(ring);
    this.ring = ring;

    return ring;

  }
}
