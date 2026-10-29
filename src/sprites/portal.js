import {
  EngineObject3D, buildExtrude, buildText3D,
  vec2, vec3, time, rand, tile,
  RED, BLACK, WHITE,
} from 'littlejsengine';

import config from '../data/config';
import state from '../data/state';
import { portalParticles } from '../helpers/particles';

const RING_COUNT = 8;
const MAX_SIZE = 50;
const SPEED = .2;

export default class Portal extends EngineObject3D {
  constructor() {
    super(vec3(0, -50, -200));

    this.name = 'portal';

    this.rings = [];
    this.castShadow = false;

    this.size3D = vec3(20, 20, 4);
    this.velocity3D.z = state.speed;
    this.setCollision(true, true);

    const mesh = buildExtrude(
      tile(0, config.tileSize),
      vec2(1),
      .05
    );

    const colA = config.palette.yellow.col,
      colB = config.palette.plum.col

    for (let i = 0; i < RING_COUNT; i++) {
      const ring = new EngineObject3D(
        vec3(0, 0, i * .02),
        mesh
      );

      ring.color = i % 2 ? colA : colB;
      // ring.emissive = 1;
      ring.pixelated = true;

      this.addChild(ring);
      this.rings.push(ring);
    }


    this.exitSign = this.addChild(
      new EngineObject3D(
        vec3(0, 30, 1),
        buildText3D('EXIT', 3, 1))
    );

    this.exitSign.emissive = 1;
    this.exitSign.pixelated = true;
    this.exitSign.color = WHITE;

  }

  update() {
    super.update();

    if (this.pos3D.y < 0) this.pos3D.y += .3
    this.emitParticles()

    this.exitSign.pos3D.y = 30 + Math.sin(time * 4) * .5;

    for (let i = 0; i < this.rings.length; i++) {
      const ring = this.rings[i];

      const progress = (time * SPEED + i / RING_COUNT) % 1;

      // Grow from center outward
      const size = Math.max(.001, progress * MAX_SIZE);

      ring.scale3D = vec3(size);

      // Small circles in front, large circles behind
      ring.pos3D.z = -progress * 2;
      ring.rotation3D.z += .01
    }
  }

  collideWithObject(o) {

    if (state.level.exitReached === true) return

    if (o.name === 'player') {
      o.hide()
      state.speed = 0
      state.level.exitReached = true;
      state.level.portalExitPos = this.pos3D.copy().add(vec3(0, 0, -5))
      state.events.add(.1, () => {
        config.sfx.play('teleport')
      })
      state.events.add(1, () => {
        state.currentLevel += 1
        state.level.exitReached = false;
        config.sceneManager.changeScene('Shop');
        this.destroy()
      })

    } else if (o?.type === 'baddie') {
      o.destroy()
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

    portalParticles(pos.add(vec3(0, 0, -15)));
  }
}
