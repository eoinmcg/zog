import {
  buildSphere, vec3, rand, RED
} from 'littlejsengine';

import Baddie from './baddie';
import config from '../data/config';
import state from '../data/state';
import { fire, spark } from '../helpers/particles';

export default class Meteor extends Baddie {
  constructor(pos) {
    // 1. Lock X to the player's X position if player exists, otherwise default to 0
    // const playerX = state.player ? state.player.pos3D.x : 0;
    const playerX = rand() > .5 && state.player?.pos3D
      ? rand(-20, 20)
      : state.player?.pos3D.x || rand(-20, 20)

    // Spawn high up on Y (top of screen), deep in the distance on Z, matched X to player
    pos = pos || vec3(playerX, 50, -120);

    // 2. Build the sphere mesh for the meteor
    const meteorMesh = buildSphere(1.5, 12, 8);

    super(pos, {
      health: 10,
      value: 50,
      type: 'meteor',
      customMesh: meteorMesh,
      scale: vec3(1.5)
    });

    // Meteor specific movement variables
    this.color = RED;   // Gives it a molten/fiery tint
    this.descentSpeed = rand(.5, .9)
    this.hasCrashed = false
  }

  update() {
    // Custom movement: No X movement, descends down in Y and moves closer in Z
    let speedMuliplier = 1.2

    this.pos3D.y -= this.descentSpeed;
    if (this.pos3D.y < .5) {
      this.pos3D.y = .5
      speedMuliplier = state.speed
      if (!this.hasCrashed) {
        this.hasCrashed = true
        state.shake = .5
        console.log('CRASH')
        config.sfx.play('explosion')
        spark(this.pos3D);
      }
    }
    if (state.gameOver) speedMuliplier = 0
    this.pos3D.z += state.speed * speedMuliplier
    this.rotation3D.z += .1


    if (!this.hasCrashed && (this.pos3D.z < 6 && this.pos3D.z > 4)) {
      config.sfx.play('jet')
    }

    // Call parent update for boundary checks / destruction logic
    super.update();

    // Continuously emit fire particles while alive
    // if (!this.hasCrashed) {
    fire(this.pos3D);
    // }
    // if (!this.hasCrashed) {
    //   spark(this.pos3D.add(vec3(0, 1, 0)));
    //   state.shake = .5
    // }
  }
}
