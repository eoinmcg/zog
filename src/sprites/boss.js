import {
  EngineObject3D, Light3D, tile, vec3, vec2,
  buildCylinder, buildBox, buildExtrude,
  hsl, WHITE, clamp, rand,
} from 'littlejsengine';

import { spark, boom, bossEntry } from '../helpers/particles';
import state from '../data/state';
import config from '../data/config';
import Shockwave from './shockwave';
import BossFire from './bossfire';

const HOME_Z = -50;
const RUSH_END_Z = 7;
const MAX_X = 6;
const BOSS_FRAMES = {
  idle: [0, 1],
  telegraph: [2],
  rush: [3],
  hit: [4],
  powered: [2],
};


export default class Boss extends EngineObject3D {
  constructor() {
    const frameIndices = [64, 65, 66, 67, 68]
    const frames = frameIndices.map(i => buildExtrude(tile(i, config.tileSize), vec2(5), .5));
    const pos = vec3(0, 5, HOME_Z)
    super(pos, frames[0])

    this.frames = frames;
    this.name = 'enemy';
    this.type = 'boss';
    // Billboard width/height in world units; Z is used for collision only.
    // this.size3D = vec3(5, 5, 2);
    this.animTick = 0;
    this.currentFrame = -1;
    this.upright = true;
    this.maxEnergy = 12;
    this.energy = this.maxEnergy;
    this.hitTimer = 0;
    this.hitCooldown = 15;
    this.dead = false;
    this.normalColor = this.color;
    this.emissive = 1;
    this.addChild(new Light3D(vec3(), 10, WHITE));
    this.setCollision();

    this.homeY = this.pos3D.y;
    this.phase = 'idle';
    this.phaseTimer = 75;
    this.attack = null;
    this.lastAttack = null;
    this.burstTimer = 0;
    this.burstsLeft = 0;
    this.volleyIndex = 0;
    this.rushX = 0;
    this.velocity3D = vec3(.1, 0, 0);

    state.shake = 1;
    for (let i = 0; i < 10; i++) {
      const p = pos.copy().add(vec3(
        rand(-4, 4),
        rand(-3, 3),
        rand(-2, 2)
      ));
      state.events.add(i * .05, () => bossEntry(p));
    }

    this.hoverDisc = new HoverDisc();
    this.addChild(this.hoverDisc);
  }

  update() {
    if (this.dead) return;
    super.update();

    if (this.hitTimer > 0) --this.hitTimer;
    --this.phaseTimer;

    if (this.phase === 'idle' || this.phase === 'recovery') {
      this.patrol();
      if (this.phaseTimer <= 0) this.beginTelegraph();
    } else if (this.phase === 'telegraph') {
      this.telegraph();
      if (this.phaseTimer <= 0) this.beginAttack();
    } else if (this.phase === 'attack') {
      this.updateAttack();
    } else if (this.phase === 'retreat') {
      this.updateRetreat();
    }

    if (this.hitTimer > 0) this.color = hsl(0, 1, .65);
    else if (this.phase !== 'telegraph') this.color = this.normalColor;

    this.updateAnimation();
  }

  updateAnimation() {
    // Keep frame selection independent from gameplay state transitions.
    ++this.animTick;
    let frames = BOSS_FRAMES.idle;
    let interval = 18;

    if (this.hitTimer > 0) {
      frames = BOSS_FRAMES.hit;
    } else if (this.phase === 'telegraph') {
      frames = BOSS_FRAMES.telegraph;
      interval = this.phaseTimer < 20 ? 4 : 9;
    } else if (this.phase === 'attack' && this.attack === 'rush') {
      frames = BOSS_FRAMES.rush;
      interval = 5;
    } else if (this.phase === 'retreat') {
      frames = BOSS_FRAMES.rush;
      interval = 9;
    } else if (this.phase === 'attack') {
      frames = BOSS_FRAMES.powered;
    }

    const frame = frames[Math.floor(this.animTick / interval) % frames.length];
    if (frame !== this.currentFrame) {
      this.mesh = this.frames[frame]
    }
  }

  patrol() {
    if (Math.abs(this.pos3D.x) >= MAX_X) {
      this.pos3D.x = clamp(this.pos3D.x, -MAX_X, MAX_X);
      this.velocity3D.x *= -1;
    }
  }

  beginTelegraph() {
    const choices = ['fire', 'shockwave', 'rush'].filter(a => a !== this.lastAttack);
    this.attack = choices[Math.floor(rand(0, choices.length))];
    this.lastAttack = this.attack;
    this.phase = 'telegraph';
    this.phaseTimer = this.attack === 'rush' ? 75 : 55;
    this.velocity3D = vec3();
    this.rushX = clamp(this.pos3D.x, -4, 4);
  }

  telegraph() {
    const warningColor = this.attack === 'fire'
      ? hsl(.28, 1, .5)
      : this.attack === 'shockwave'
        ? hsl(0, 1, .5)
        : hsl(.13, 1, .55);

    // Faster blinking as launch approaches.
    const interval = this.phaseTimer < 20 ? 4 : 10;
    // this.color = Math.floor(this.phaseTimer / interval) % 2 ? warningColor : WHITE;

    if (this.attack === 'rush') {
      // Pull back before charging and line up on the center lane.
      this.pos3D.x += (0 - this.pos3D.x) * .08;
      this.pos3D.z = Math.max(HOME_Z - 6, this.pos3D.z - .12);
      this.pos3D.y += (this.homeY - this.pos3D.y) * .04;
    }
    if (this.phaseTimer % 8 === 0) spark(this.pos3D.copy());
  }

  beginAttack() {
    this.phase = 'attack';
    if (this.attack === 'rush') {
      this.phaseTimer = 105; // safety fallback
      this.velocity3D = vec3(0, 0, 2.1);
    } else if (this.attack === 'fire') {
      this.phaseTimer = 75;
      this.burstTimer = 0;
      this.burstsLeft = 4;
      this.volleyIndex = 0;
    } else {
      this.phaseTimer = 30;
      new Shockwave(vec3(this.pos3D.x, .5, this.pos3D.z + 5));
      state.shake = .35;
    }
  }

  updateAttack() {
    if (this.attack === 'rush') {
      if (this.pos3D.z >= RUSH_END_Z || this.phaseTimer <= 0) {
        this.pos3D.z = Math.min(this.pos3D.z, RUSH_END_Z);
        this.velocity3D = vec3(0, 0, -1.5);
        this.phase = 'retreat';
        this.phaseTimer = 100;
      } else if (this.phaseTimer % 3 === 0) {
        spark(this.pos3D.copy());
      }
    } else if (this.attack === 'fire') {
      if (this.burstsLeft > 0 && --this.burstTimer <= 0) {
        this.fire(this.volleyIndex++);
        --this.burstsLeft;
        this.burstTimer = 14;
      }
      if (this.phaseTimer <= 0) this.endAttack();
    } else if (this.phaseTimer <= 0) {
      this.endAttack();
    }

  }

  updateRetreat() {
    this.pos3D.y += (this.homeY - this.pos3D.y) * .08;
    if (this.pos3D.z <= HOME_Z || this.phaseTimer <= 0) {
      this.pos3D.z = HOME_Z;
      this.pos3D.y = this.homeY;
      this.endAttack();
    }
  }

  endAttack() {
    this.phase = 'recovery';
    this.phaseTimer = 65;
    this.velocity3D = vec3(rand() < .5 ? -.1 : .1, 0, 0);
  }

  fire(index = 0) {
    const count = 5;
    const gap = index % count;
    const origin = this.pos3D.copy().add(vec3(0, 0, rand(0, 5)));
    for (let i = 0; i < count; i++) {
      // Rotating safe gap in each volley.
      if (i === gap) continue;
      new BossFire(origin.copy(), (i - 2) * .18, 0, .8 + index * .04);
    }

  }

  collideWithObject(o) {
    if (o.name === 'laser') {
      o.destroy(false);
      this.takeDamage();
    } else if (o.name === 'player' && this.phase === 'attack' && this.attack === 'rush') {
      o.loseLive(this);
    }
  }

  takeDamage(amount = 1) {
    if (this.dead || this.hitTimer > 0) return;
    this.energy = Math.max(0, this.energy - amount);
    this.hitTimer = this.hitCooldown;
    spark(this.pos3D.copy());
    if (this.energy <= 0) this.die();
  }

  die() {
    if (this.dead) return;
    this.dead = true;
    this.destroy();
    state.shake = 3;
    const pos = this.pos3D.copy();
    for (let i = 0; i < 25; i++) {
      state.events.add(i * .05, () => boom(pos.copy().add(vec3(
        rand(-4, 4), rand(-4, 4), rand(-2, 2)
      ))));
    }
  }
}



class HoverDisc extends EngineObject3D {
  constructor() {
    super(
      vec3(0, -2.9, 0),
      buildCylinder(6, .65, 20),
      undefined,
      WHITE
    );

    this.name = 'bossHoverDisc';

    // Glowing rim
    const rim = new EngineObject3D(
      vec3(0, -.28, 0),
      buildCylinder(5.4, .25, 20),
      undefined,
      WHITE
    );

    rim.emissive = .65;
    this.addChild(rim);

    // Rotating lights
    const lamps = [
      [2.6, 0, hsl(.5, 1, .6)],
      [-2.6, 0, hsl(.5, 1, .6)],
      [0, 2.6, hsl(.14, 1, .55)],
      [0, -2.6, hsl(.14, 1, .55)],
    ];

    for (const [x, z, color] of lamps) {
      const lamp = new EngineObject3D(
        vec3(x, -.05, z),
        buildBox(vec3(.5, .25, .5)),
        undefined,
        color
      );

      lamp.emissive = 1;
      this.addChild(lamp);

      lamp.addChild(
        new Light3D(vec3(0, .25, 0), 3.2, WHITE)
      );
    }

    // Fins make rotation more visible
    for (let i = 0; i < 3; i++) {
      const angle = i * Math.PI * 2 / 3;

      const fin = new EngineObject3D(
        vec3(
          Math.cos(angle) * 1.9,
          .27,
          Math.sin(angle) * 1.9
        ),
        buildBox(vec3(.85, .18, .35)),
        undefined,
        hsl(.65, .45, .56)
      );

      fin.rotation3D.y = -angle;
      this.addChild(fin);
    }
  }

  update() {
    super.update();

    const boss = this.parent;

    const rushing =
      boss?.phase === 'attack' &&
      boss.attack === 'rush';

    this.rotation3D.y += rushing ? .16 : .045;
  }
}
