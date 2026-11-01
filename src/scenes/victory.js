import {
  keyWasPressed, gamepadWasPressed, inputClear,
  render3D, engineObjectsDestroy, EngineObject3D,
  Light3D, Color,
  vec2, vec3, drawText, setPaused, paused,
} from 'littlejsengine';

import config from '../data/config';
import state, { resetState } from '../data/state';
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

    state.events.add(1, () => new Alert({ text: 'BYE' }))
    state.events.add(2, () => new Alert({ text: 'BYE' }))
    state.events.add(3, () => new Alert({ text: 'Zog' }))

  }

  update() {
    super.update()

    if (zog) {
      console.log(zog.pos3D)
      zog.rotation3D.y += 0.001
      zog.rotation3D.z += 0.001
    }
  }

  updatePost() { }
  renderPost() { }

}
