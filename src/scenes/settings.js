import {
  engineObjectsDestroy,
  inputClear,
  render3D, Light3D, vec3, vec2,
  gamepadStick, engineImageFont,
  toggleFullscreen,
  Color, BLACK, WHITE, YELLOW, RED,
  drawText, drawTile, tile, PI, time,

} from 'littlejsengine';

import config from '../data/config';
import state from '../data/state';
import Scene from "./scene";
import meteorShower from '../weather/meteorShower';

export default class Settings extends Scene {

  enter() {
    inputClear()
    state.gameOver = false
    engineObjectsDestroy();

    this.stick = [gamepadStick(0)];
    this.lastStick = [0];

    this.options = ["Mute", "Fullscreen", "Clear HiScore", "Exit"];
    this.yPos = [1, -1, -3, -5];
    this.pointer = 0;

    render3D.bloom = true; // Crucial for making sun/moon/stars glow

    const navy = config.palette.navy.col;
    const plum = config.palette.plum.col;
    render3D.setSky(navy, plum, navy, .5);

    new Light3D(vec3(5, 5, 5), 25, new Color(1, 1, 1));
    const pal = config.palette;
    const spaceCopy = Object.assign({}, meteorShower);
    spaceCopy.meteors = null

    spaceCopy.layers[2].z = -100
    spaceCopy.layers[2].y = -20
    // spaceCopy.layers[3].z = -120
    spaceCopy.layers[3].z = -200
    spaceCopy.layers[3].y = -60
    // spaceCopy.layers[4].y = -40
    spaceCopy.layers.splice(4, 1)
    spaceCopy.layers[0].texWidth = 2024;
    spaceCopy.layers[0].texHeight = 512;
    spaceCopy.sprites.splice(1, 1)
    spaceCopy.fog = null
    spaceCopy.sky = {
      top: pal.plum.col, horizon: pal.navy.col, bottom: pal.plum.col,
      ambient: 1
    }
    console.log({ spaceCopy })
    this.initWeather(spaceCopy);

  }


  update() {

    super.update()
    config.weather?.update();

    this.handleUiInput()

    if (this.uiInput === 'up') {
      this.pointer -= 1;
      config.sfx.play("walk");
      config.swipe.clear();
    } else if (this.uiInput === 'down') {
      this.pointer += 1;
      config.sfx.play("walk");
      config.swipe.clear();
    } else if (this.uiInput === 'enter') {
      this.runChoice(this.pointer);
      config.swipe.clear();
    }

    if (this.pointer < 0) this.pointer = this.yPos.length - 1;
    if (this.pointer > this.yPos.length - 1) this.pointer = 0;

  }



  render() {


  }

  renderPost() {

    drawText('SETTINGS', vec2(-.2, 8.8), 3, YELLOW, 0, RED, 'center', config.font);
    drawText('SETTINGS', vec2(0, 9), 3, RED, 0, RED, 'center', config.font);

    const font = engineImageFont;
    const gray = config.palette.gray.col;


    const wave = Math.sin(new Date().getTime() * 0.009);
    const t = wave > 0 ? 16 : 17;

    const yOff = 0
    drawTile(vec2(-6, this.yPos[this.pointer] + yOff), vec2(1), tile(t, config.tileSize), undefined,
      0, true)

    this.options.forEach((o, i) => {
      let text = o;
      if (o === "Mute" && state.mute) {
        text = "Mute: on";
      }
      if (o === "Mute" && !state.mute) {
        text = "Mute: off";
      }
      let col = this.pointer === i ? config.palette.grass.col : WHITE;
      drawText(text, vec2(-4.4, this.yPos[i] + yOff - .1), 1.5, BLACK, 0, BLACK, 'left', config.font);
      drawText(text, vec2(-4.5, this.yPos[i] + yOff), 1.5, col, 0, BLACK, 'left', config.font);
    });

  }

  runChoice(option) {
    if (option === 0) {
      state.mute = !state.mute;
    }
    if (option === 1) {
      toggleFullscreen();
    }
    if (option === 2) {
      try {
        localStorage.clear();
        config.hiScore = 500;
        config.sfx.play("spotted");
      } catch (e) {
        console.warn("FAILED TO CLEAR SCORES");
      }
    }
    if (option === 3) {
      config.sceneManager.changeScene("Splash");
    }
  }

}
