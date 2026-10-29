import {
  EngineObject3D, engineObjectsDestroy, CameraControl3D,
  DirectionalLight3D, hsl,
  inputClear, gamepadStick, keyWasPressed,
  gamepadWasPressed,
  render3D, vec3, vec2,
  BLACK, YELLOW, RED,
  drawText, setPaused, paused,
  isTouchDevice
} from 'littlejsengine';

import config from '../data/config';
import state from '../data/state';
import Scene from "./scene";

import Player from '../sprites/player';

export default class Model extends Scene {
  enter() {
    inputClear()
    state.gameOver = false
    engineObjectsDestroy();

    render3D.bloom = true;
    const navy = config.palette.navy.col;
    const plum = config.palette.navy.plum;
    render3D.setSky(BLACK, navy, plum, .5);

    const light = { from: vec3(-.25, .25, 1), color: hsl(.6, .4, .65), intensity: .8 };
    new DirectionalLight3D(light.from, light.color, light.intensity);
    new DirectionalLight3D(vec3(-.25, .25, -1), light.color, light.intensity);

    new CameraControl3D(vec3(0, 1, 0), 3, 0, 0);
    this.stick = [gamepadStick(0),];
    this.lastStick = [0];

    console.log(state.equipment)
    state.equipment.raygun.owned = true
    state.equipment.glasses.owned = true
    this.model = new Player()
  }

  update() {
    super.update()
    this.handleUiInput()

  }

  updatePost() {
    const pausePressed = keyWasPressed('KeyP') || gamepadWasPressed(9);
    if (pausePressed) {
      setPaused(!paused);
    }
  }

  render() { }

  renderPost() {
    let text = this.model.name
    text = 'KROKETTE'
    drawText(text, vec2(-.2, 9.8), 3, YELLOW, 0, RED, 'center', config.font);
    drawText(text, vec2(0, 10), 3, RED, 0, RED, 'center', config.font);
  }
}

