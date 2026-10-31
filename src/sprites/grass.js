import {
  EngineObject3D, buildExtrude, render3D, vec3,
  tile, vec2, PI, rand, randSign
} from 'littlejsengine'

import config from "../data/config";
import state from "../data/state";

export default class Grass extends EngineObject3D {
  static spawnZ = -200;   // horizon
  static laneHalf = 0;    // keep a clear lane in front of the player

  constructor(randomZ = false, groundColor, t = 0) {
    super(vec3(0, -.5, 0), buildExtrude(tile(t, config.tileSize), vec2(1), .1))
    this.rotation3D = vec3(-PI / 2, 0, 0);
    this.velocity3D = vec3(0, 0, state.speed);
    this.groundColor = groundColor
    this.respawn(randomZ);
  }

  respawn(randomZ) {
    const s = rand(.6, 2);
    this.scale3D = vec3(s);
    this.color = this.groundColor.scale(rand(.7, .9), 1); // rgb darker, alpha stays 1
    const x = (Grass.laneHalf + rand(0, 24)) * randSign();
    const z = randomZ ? rand(Grass.spawnZ, render3D.camera.pos.z)
      : Grass.spawnZ - rand(0, 20); // stagger so they don't arrive in a line
    this.pos3D = vec3(x, 0, z); // sits on the ground if the mesh is centered
  }

  update() {
    this.velocity3D.z = state.speed
    // behind the camera, so it can't be seen: send it back to the horizon
    if (this.pos3D.z > render3D.camera.pos.z + 2)
      this.respawn(false);
  }
}

