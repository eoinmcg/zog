import {
  EngineObject3D, buildExtrude, render3D,
  tile, vec2, vec3, Trail3D,
  PI, tweak, timeDelta, time,
  clamp, lerp, rand, setPaused,
  keyWasPressed, mouseWasPressed,
  isUsingGamepad, gamepadWasPressed,
} from 'littlejsengine'

import config from '../data/config';
import state from '../data/state';
import { dust, spark, jetpackFlame } from '../helpers/particles';
import { playMusic, stopMusic } from '../helpers/music';
import Laser from './laser'
import Ded from './ded'

export default class Player extends EngineObject3D {
  constructor() {
    const frameIndices = [1, 2, 3, 4]
    const frames = frameIndices.map(i => buildExtrude(tile(i, config.tileSize), vec2(1), .2));
    super(vec3(0, .5, 0), frames[0]);
    this.frames = frames;
    this.frameTimer = 0;
    this.rotation3D = vec3(0, PI, 0);

    // this.size3D = vec3(.8);   // roughly the player's visible size
    this.setCollision(true, true);

    this.pixelated = true;

    this.moveSpeed = .1; // world units per frame
    this.thrust = .0002; // upward acceleration while boosting
    this.gravity = .006; // downward acceleration otherwise
    this.maxRise = .3;
    this.maxFall = .2;
    this.floorY = .5;

    this.lastShot = 0;
    this.fireDelay = .12; // seconds between shots
    this.jumpForce = .22;

    this.name = 'player'
    this.hidden = false
    this.recover = 0
    this.transparent = true

    // let color = config.palette.white.mk(.5)
    // const trail = new Trail3D(vec3(), 1.5, .5, undefined,
    //   color, color.withAlpha(0), true);
    // this.addChild(trail);

    this.lastV = this.velocity3D
    this.wasGrounded = true

    this.equip()
  }

  equip() {
    const { raygun, jetpack, glasses, hat } = state.equipment;

    if (raygun.owned) {
      this.gun = this.addChild(new Gun(vec3(), raygun.tile));
      this.gun.current = raygun.current
    }
    if (jetpack.owned) {
      this.jetpack = this.addChild(new JetPack(vec3(), jetpack.tile));
      this.jetpack.current = jetpack.current
    }
    if (glasses.owned) this.glasses = this.addChild(new Glasses(vec3(), glasses.tile));
    if (hat.owned) this.hat = this.addChild(new Hat(vec3(), hat.tile));
  }

  update() {
    super.update();

    if (this.hidden) {
      this.mesh = undefined;
      return;
    }

    if (this.recover > 0) {
      this.recover = Math.max(0, this.recover - timeDelta)

      const flash = (time * 6 | 0) % 2 === 0
      const color = flash
        ? config.palette.plum.col
        : config.palette.white.col

      this.setFlashColor(color)
    } else {
      this.setFlashColor(config.palette.white.col)
    }

    const v = this.velocity3D;
    let actionTriggered = false;


    // Initialize runtime state properties if missing
    if (this.facingDir === undefined) this.facingDir = 0;
    if (this.jumpsLeft === undefined) this.jumpsLeft = 2;

    const isGrounded = this.pos3D.y <= this.floorY + 0.01;
    if (isGrounded && v.y <= 0) {
      this.jumpsLeft = this.jetpack?.current
    }

    const swiper = config.swipe;
    const swipeDir = (swiper && swiper.dir === 'tap') ? swiper.screen : false
    const wantsTurn =
      keyWasPressed('ArrowDown') ||
      keyWasPressed('KeyS') ||
      keyWasPressed('KeyX') ||
      swipeDir === 'left' ||
      (isUsingGamepad && (
        mouseWasPressed(0) ||
        gamepadWasPressed(1) ||
        gamepadWasPressed(13) ||
        gamepadWasPressed(14) ||
        gamepadWasPressed(5) ||
        gamepadWasPressed(7)
      ));

    const wantsJump =
      keyWasPressed('ArrowUp') ||
      keyWasPressed('KeyW') ||
      keyWasPressed('KeyZ') ||
      swipeDir === 'right' ||
      (isUsingGamepad && (
        mouseWasPressed(1) ||
        gamepadWasPressed(0) ||
        gamepadWasPressed(12) ||
        gamepadWasPressed(15) ||
        gamepadWasPressed(4) ||
        gamepadWasPressed(6)
      ));

    if (wantsTurn) {
      if (this.facingDir === 0) this.facingDir = -1
      this.facingDir *= -1
      actionTriggered = true;
      config.sfx?.play('jump');
      if (isGrounded) dust(vec3(this.pos3D.x, this.pos3D.y - 0.5, this.pos3D.z));
    }

    // if (isGrounded && this.velocity3D.x && rand() > .7) {
    //   dust(vec3(this.pos3D.x, this.pos3D.y - 0.5, this.pos3D.z));
    // }

    if (wantsJump && this.jetpack && this.jumpsLeft > 0) {
      v.y = this.jumpForce || 0.18; // Apply jump force
      this.jumpsLeft--;

      if (this.jetpack) {
        this.jetpack.spark = .3
      }
      actionTriggered = true;
    }

    // Gravity & Velocity Clamping
    v.y -= this.gravity;
    v.y = clamp(v.y, -this.maxFall, this.maxRise);

    // Y-Axis Ground Clamp
    this.pos3D.y = clamp(this.pos3D.y, this.floorY, 10);


    v.x = this.facingDir * this.moveSpeed * (isGrounded ? 1 : .2);

    // X-Axis Screen Wrap
    const MAX_X = 12;
    if (this.pos3D.x >= MAX_X && this.facingDir > 0) {
      this.facingDir = -1;
    } else if (this.pos3D.x <= -MAX_X && this.facingDir < 0) {
      this.facingDir = 1;
    }

    // Visuals & Sprite Mesh
    const frame = (isGrounded) ? (time * 16 | 0) % this.frames.length : 0;
    this.frame = frame
    this.mesh = this.frames[frame];

    this.rotation3D.z = .1
    this.rotation3D.y -= .4 * this.facingDir
    this.rotation3D.y = clamp(this.rotation3D.y, 0, PI)

    if (this.velocity3D.x !== 0 && (isGrounded && !this.wasGrounded)) {
      dust(this.pos3D);
      config.sfx.play('bounce')
      state.shake = .3
    }

    // Shooting Logic (Fires on Jump OR Direction Change)
    if (this.gun && actionTriggered && time - this.lastShot > this.fireDelay) {
      this.lastShot = time;
      this.shoot();
    }

    this.lastV = this.velocity3D
    this.wasGrounded = isGrounded
  }

  render() {
    if (state.levelExitReached || this.hidden) return

    super.render()
  }

  setVisible(visible) {
    this.mesh = visible ? this.frames[this.frame] : undefined

    const update = (object) => {
      if (!visible) {
        if (object.mesh) object.savedMesh = object.mesh
        object.mesh = undefined
      } else if (object.savedMesh) {
        object.mesh = object.savedMesh
      }

      for (const child of object.children) {
        update(child)
      }
    }

    for (const child of this.children) {
      update(child)
    }
  }

  setFlashColor(color) {
    const update = (object) => {
      object.color = color

      for (const child of object.children) {
        update(child)
      }
    }

    update(this)
  }

  hide() {
    this.hidden = true
    this.setVisible(false)
  }

  shoot() {
    const from = this.pos3D.add(vec3(0, 0, -.5));

    const toPlayer = from.subtract(render3D.camera.pos);
    const dir = vec3(toPlayer.x, 0, -toPlayer.z).normalize();
    const target = from.add(dir.scale(100));
    target.x = from.x

    new Laser(from, target);
    spark(from);
  }

  loseLive(o) {
    if (this.recover > 0) return

    state.lives -= 1
    this.recover = 2
    config.sfx.play('hurt')
    state.shake = 1
    // if (this.hat && rand() > .5) this.hat.flyOff(vec3(.05, .5, .04));

    if (state.lives < 0) {
      this.destroy(o)
      this.hitStop(null, 200)
    } else {
      this.hitStop(null, 100)
    }
  }

  hitStop(callback, delay = 100) {
    if (state.hitStop) return

    setPaused(true)
    state.hitStop = true

    window.setTimeout(() => {
      setPaused(false)
      state.hitStop = false
      if (callback) callback()
    }, delay)
  }

  destroy(killedBy) {

    const name = killedBy?.name
    if (name === 'enemy' || name === 'obstacle') {
      this.killed()
    }
    super.destroy()

  }

  killed() {
    state.shake = 1
    state.speed = 0
    state.gameOver = time

    if (this.hat) this.hat.flyOff(vec3(.05, .5, .04));
    if (this.jetPack) this.jetPack.flyOff(vec3(.05, .05, .04));
    if (this.gun) this.gun.flyOff(vec3(.09, .20, .08));
    if (this.glasses) this.glasses.flyOff(vec3(.09, .20, .08));
    new Ded(this.pos3D.add(vec3(0, -.3, 1)))

    config.sfx.play('hurt')
    stopMusic()
    state.events.add(.75, () => {
      if (state.mute) return
      playMusic(0, false)
    })
  }
}

class PlayerPart extends EngineObject3D {
  constructor(pos, mesh) {
    super(pos, mesh);

    this.flyingOff = false;
    this.flyGravity = .008;
    this.angularVelocity3D = vec3();
  }

  flyOff(velocity) {
    const parent = this.parent;

    // Convert local position to world position
    const worldPos = parent.pos3D.add(
      this.pos3D.rotateY(parent.rotation3D.y)
    );

    // Detach
    parent.removeChild(this);

    // Preserve position
    this.pos3D = worldPos;

    // Give it movement
    this.velocity3D = velocity;

    this.setCollision(false, false);
    this.angularVelocity3D = vec3(
      rand(-.15, .15),
      rand(.15, .15),
      rand(-.15, .15)
    );

    this.flyingOff = true;
  }

  update() {
    super.update();

    if (!this.flyingOff) return;

    // Apply gravity
    this.velocity3D.y -= this.flyGravity;

    // Spin while airborne
    this.rotation3D = this.rotation3D.add(
      this.angularVelocity3D
    );

    // Floor collision
    const floorY = .15;

    if (this.pos3D.y <= floorY) {
      this.pos3D.y = floorY;

      // Bounce with energy loss
      if (Math.abs(this.velocity3D.y) > .025) {
        this.velocity3D.y = Math.abs(this.velocity3D.y) * .35;

        // Reduce spinning
        this.angularVelocity3D = this.angularVelocity3D.scale(.6);
      }
      else {
        // Come to rest
        this.velocity3D.y = 0;
        this.velocity3D.x *= .8;
        this.velocity3D.z *= .8;

        this.angularVelocity3D = vec3();
      }
    }
  }
}


class JetPack extends PlayerPart {
  constructor(pos) {
    let jetPack = buildExtrude(tile(24, config.tileSize), vec2(.6), .2);
    let jetPackActive = buildExtrude(tile(25, config.tileSize), vec2(.6), .2);
    super(pos.add(vec3(-.5, -.5, 0)), jetPack)
    this.rotation3D.y = PI / 2
    this.baseY = -.1;

    this.spark = 0;
    this.meshes = [jetPack, jetPackActive];

  }

  update() {
    super.update();

    if (this.flyingOff) return;

    const p = this.parent;
    const frameOffset = (p && p.frame === 1) ? 0 : .1;

    this.pos3D.y = this.baseY + frameOffset;

    if (this.spark > 0) {
      this.spark -= timeDelta;
      this.mesh = this.meshes[1]

      if ((time * 60 | 0) % 2 === 0) {
        const exhaustPos = this.parent.pos3D.add(
          this.pos3D.rotateY(this.parent.rotation3D.y)
        ).add(vec3(0, -.5, 0));

        jetpackFlame(exhaustPos);
        config.sfx?.play('jet');

      }
    } else {
      this.mesh = this.meshes[0]
    }
  }
}


class Gun extends PlayerPart {
  constructor(pos) {
    let gun = buildExtrude(tile(8, config.tileSize), vec2(.6), .3)
    super(pos.add(vec3(.2, .3, 0)), gun)
    this.baseY = -.25;
  }

  update() {
    super.update()
    const p = this.parent;

    const frameOffset = (p && p.frame === 1) ? 0 : .1;
    this.pos3D.y = this.baseY + frameOffset
  }
}

class Glasses extends PlayerPart {
  constructor(pos) {
    let frame = buildExtrude(tile(35, config.tileSize), vec2(.9), .32)
    super(pos.add(vec3(-.24, 0, 0)), frame)
    this.baseY = .42;
  }

  update() {
    super.update()
    const p = this.parent;

    const frameOffset = (p && p.frame === 1) ? 0 : .05;
    this.pos3D.y = this.baseY + frameOffset
  }
}


class Hat extends PlayerPart {
  constructor(pos, t = 32) {
    let hat = buildExtrude(tile(t, config.tileSize), vec2(1), .3)
    super(pos.add(vec3(-.2, -.1, 0)), hat)
    this.baseY = 0.45;
  }

  update() {
    super.update()
    const p = this.parent;

    const frameOffset = (p && p.frame === 1) ? .1 : 0;

    const playerVY = (p && p.velocity3D) ? p.velocity3D.y : 0;
    const jumpLift = playerVY > 0.01 ? 0.12 : 0;

    const targetY = this.baseY + frameOffset + jumpLift;
    this.pos3D.y = lerp(this.pos3D.y, targetY, 0.2);

  }
}
