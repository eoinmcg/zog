import {
  EngineObject3D, buildExtrude, Light3D,
  tile, vec2, vec3, YELLOW
} from 'littlejsengine'

import config from "../data/config";
import state from "../data/state";
import { boom } from "../helpers/particles";

export default class Coin extends EngineObject3D {

  constructor(pos) {

    const frameIndices = [20]
    const frames = frameIndices.map(i => buildExtrude(tile(i, config.tileSize), vec2(1), .2));
    pos = pos || vec3(rand(-5, 5), 1, -50)


    super(pos, frames[0])
    this.color = YELLOW

    this.setCollision(true, true)

    this.size3D = vec3(this.size3D.x * 4)

    this.name = 'coin';
    this.emissive = 1;
    this.addChild(new Light3D(vec3(), 10, YELLOW));

  }

  update() {

    this.rotation3D.y += .1
    this.velocity3D = vec3(0, 0, state.speed * .7);

    super.update()
  }


  collideWithObject(o) {

    if (o.name !== 'player') return

    this.destroy()
    boom(o.pos3D.add(vec3(0, 0, 3)))
    config.sfx.play('alert')
    state.score += 50
    state.coins += 1
  }

}
