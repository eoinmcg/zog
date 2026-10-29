import {
  engineObjectsDestroy,
  inputClear, sin, time,
  render3D, Light3D, vec3, vec2,
  EngineObject3D, engineImageFont,
  BLACK, WHITE,
  drawText, drawTile, tile, PI,
} from 'littlejsengine';

import config from '../data/config';
import state, { resetState } from '../data/state';
import Scene from "./scene";
import { boom, spark } from '../helpers/particles';

import deepSpace from '../weather/deepSpace';

let earth;
let ufo;

export default class Splash extends Scene {

  constructor() {
    super();
  }

  enter() {

    earth = null;
    ufo = null;

    inputClear()
    state.gameOver = false
    engineObjectsDestroy();
    resetState(true)

    this.options = ['Play', 'Help', 'Settings'];
    this.yPos = [-4, -6, -8];
    this.pointer = 0;

    const spaceCopy = Object.assign({}, deepSpace);
    spaceCopy.meteors = null
    spaceCopy.sprites[1].pos = [200, 50, -300]
    this.initWeather(spaceCopy);

    render3D.camera.pos = vec3(7, 5, 12);
    render3D.camera.lookAt(vec3(7, 5, -100));

    ufo = new EngineObject3D(
      vec3(6, 1, 16),
      config.models.ufo.mesh,
      null,
      WHITE
    );
    // ufo.scale3D = vec3(1);
    ufo.rotation3D.x = -PI * .4
    ufo.velocity3D.x = .06
    ufo.velocity3D.y = .02
    ufo.velocity3D.z = -.1
    // ufo.velocity3D.x = -.1
  }

  update() {
    super.update()

    this.handleUiInput()
    config.weather?.update();

    if (this.uiInput === 'up') {
      this.pointer -= 1;
      config.sfx.play('walk');
    } else if (this.uiInput === 'down') {
      this.pointer += 1;
      config.sfx.play('walk');
    } else if (this.uiInput === 'enter') {
      const opt = this.options[this.pointer];
      config.swipe.clear();
      if (opt === 'Help') {
        config.sceneManager.changeScene('Help');
      } else if (opt === 'Settings') {
        config.sceneManager.changeScene('Settings');
      } else {
        state.plays += 1;
        // playMusic(1)
        config.sceneManager.changeScene('Play')
      }
    }

    if (this.pointer < 0) this.pointer = this.yPos.length - 1;
    if (this.pointer > this.yPos.length - 1) this.pointer = 0;

    if (earth) earth.rotation3D.y += .001
    if (ufo) {
      ufo.rotation3D.z -= .01;
      if (ufo.pos3D.z < 6 && ufo.pos3D.z > 4) {
        config.sfx.play('jet')
      }
      if (ufo.pos3D.z < -60) {
        ufo.destroy()
        boom(ufo.pos3D, 0)
        config.sfx.play('teleport')
        ufo = null
      }
    }


  }

  render() {
    // const title = config.title.replace(' ', '\n')
    // drawText(title, vec2(-20.2, 3.8), 4, config.palette.orange.col, 0, BLACK, 'left', config.font)
    // drawText(title, vec2(-20, 4), 4, config.palette.red.col, 0, BLACK, 'left', config.font)
    drawTile(vec2(-7, -5), vec2(27), tile(0, 1024, 2))
  }

  renderPost() {

    const wave = sin(time * 5);
    const x = wave > 0 ? .1 : 0
    const yOff = 0
    drawTile(vec2(-20 + x, this.yPos[this.pointer] + yOff), vec2(1), tile(21, config.tileSize), undefined, 0);
    this.options.forEach((o, i) => {
      let col = this.pointer === i ? config.palette.grass.col : WHITE;
      drawText(o, vec2(-18.9, this.yPos[i] + yOff - .1), 1.5, BLACK, 0, BLACK, 'left', config.font);
      drawText(o, vec2(-19, this.yPos[i] + yOff), 1.5, col, 0, BLACK, 'left', config.font);
    })

    const font = engineImageFont

    font.drawText('HI: ' + state.hiScore, vec2(0, 10.9), .8, true, config.palette.plum.col)
    font.drawText('HI: ' + state.hiScore, vec2(0, 11), .8, true)

  }

}

