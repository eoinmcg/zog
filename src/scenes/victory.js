import {
  keyWasPressed, gamepadWasPressed, inputClear,
  render3D, engineObjectsDestroy, EngineObject3D,
  Light3D, Color, PI,
  vec2, vec3, drawText, setPaused, paused,
} from 'littlejsengine';

import config from '../data/config';
import state, { resetState } from '../data/state';
import { playMusic } from '../helpers/music';
import Scene from "./scene";
import meteorShower from '../weather/meteorShower';
import Alert from '../sprites/alert';

let zog, ufo


export default class Victory extends Scene {
  enter() {
    super.enter()
    zog = null;
    ufo = null;


    const navy = config.palette.navy.col;
    const plum = config.palette.plum.col;
    render3D.setSky(plum, navy, plum, .5);

    new Light3D(vec3(5, 5, 5), 25, new Color(1, 1, 1));

    const pal = config.palette;
    playMusic(7)

    const spaceCopy = {
      ...meteorShower,

      layers: meteorShower.layers.map(layer => ({ ...layer })),

      sun: {
        ...meteorShower.sun,
        pos: [...meteorShower.sun.pos]
      },

      sprites: [],
      fog: null,

      sky: {
        top: pal.plum.col,
        horizon: pal.navy.col,
        bottom: pal.plum.col,
        ambient: 1
      }
    };

    // Modify the independent copies
    spaceCopy.layers[0].y = 0;
    spaceCopy.layers[0].z = -190;
    spaceCopy.layers = [spaceCopy.layers[0]];

    spaceCopy.sun.pos[1] = -5000; // Y is index 1

    this.initWeather(spaceCopy);
    zog = new EngineObject3D(
      vec3(0, 0, 5),
      config.models.earth.mesh,
      null,
      config.palette.plum.col
    );

    state.events.add(4, () => {
      ufo = new EngineObject3D(
        vec3(0, 0, -10),
        config.models.ufo.mesh,
        null,
        config.palette.white.col
      );
      ufo.scale3D = vec3(.25);
      ufo.rotation3D.x = -PI * .4
      ufo.velocity3D = vec3(0, 0, .1)
    })

    state.events.add(1, () => new Alert({ text: 'Bye bye' }))
    state.events.add(3, () => new Alert({ text: 'Planet Zog' }))
    state.events.add(10, () => new Alert({ text: 'The END', yVel: 0, ttl: 50 }))

    render3D.camera.pos = vec3(0, 0, 10);

  }

  update() {
    super.update()

    if (ufo && ufo.pos3D.z > 10) ufo.destroy()
    if (ufo && ufo.pos3D.z > 4 && ufo.pos3D.z < 9) {
      config.sfx.play('jet')
    }
    if (ufo) { ufo.rotation3D.z += 0.001 }

    if (zog) {
      zog.rotation3D.y += 0.001
      zog.rotation3D.z += 0.001
    }
  }

  updatePost() { }
  renderPost() { }

}
