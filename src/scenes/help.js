import {
  EngineObject, engineObjects, engineObjectsDestroy,
  inputClear, gamepadStick, mouseWasPressed,
  engineImageFont, mousePos, CameraControl3D,
  render3D, Light3D, vec3, vec2,
  Color, BLACK, WHITE, YELLOW, RED,
  drawText, drawRect, time, sin,
  isTouchDevice
} from 'littlejsengine';

import config from '../data/config';
import state from '../data/config';
import Scene from "./scene";
// import Mouse from '../sprites/mouse'
import TextBox from '../sprites/textbox'

import deepSpace from '../weather/deepSpace';

export default class Help extends Scene {
  enter() {
    inputClear()
    state.gameOver = false
    engineObjectsDestroy();

    const navy = config.palette.navy.col;
    const plum = config.palette.plum.col;
    render3D.setSky(BLACK, navy, plum, .5);

    new Light3D(vec3(5, 5, 5), 25, new Color(1, 1, 1));

    this.stick = [gamepadStick(0),];
    this.lastStick = [0];

    // this.mouse = new Mouse(this.g);

    const gray = config.palette.gray.col;
    const spaceCopy = Object.assign({}, deepSpace);

    spaceCopy.sprites = []
    spaceCopy.meteors = null
    this.initWeather(spaceCopy);

    render3D.camera.pos = vec3(7, 5, 12);
    render3D.camera.lookAt(vec3(7, 5, -100));
    // new CameraControl3D(vec3(0, 1, 0), 10, .45, .003);

    this.selectedIndex = 0;
    this.boxes = [
      new TextBox(this, vec2(0, -5), vec2(9, .7), 'code & gfx: @eoinmcg', 'https://eoinmcgrath.com', gray),
      new TextBox(this, vec2(0, -7), vec2(9, .7), 'music: by David KBD', 'https://davidkbd.itch.io/interstellar-vol2-edm-metal-music-pack', gray),
      new TextBox(this, vec2(0, -9), vec2(9, .7), 'made with: LittleJS', 'https://github.com/KilledByAPixel/LittleJS', gray),
      new TextBox(this, vec2(0, -11), vec2(9, .7), 'exit to main menu', 'scene:Splash', gray, true)
    ];

    this.updateBoxSelection();
  }

  update() {
    super.update()
    this.handleUiInput()
    config.weather?.update();

    // this.ufo.rotation3D.z -= .01;

    if (this.uiInput === 'up') {
      config.sfx.play('walk');
      this.selectedIndex = (this.selectedIndex - 1 + this.boxes.length) % this.boxes.length;
      this.updateBoxSelection();
    } else if (this.uiInput === 'down') {
      config.sfx.play('walk');
      this.selectedIndex = (this.selectedIndex + 1) % this.boxes.length;
      this.updateBoxSelection();
    } else if (this.uiInput === 'enter') {
      // Trigger click action on the currently focused box
      this.boxes[this.selectedIndex].handleClick();
    }
  }

  updateBoxSelection() {
    // Enable selection for the active index, disable for others
    this.boxes.forEach((box, i) => {
      box.selected = (i === this.selectedIndex);
    });
  }

  render() { }

  renderPost() {
    drawText('Controls:', vec2(-.2, 9.8), 3, YELLOW, 0, RED, 'center', config.font);
    drawText('Controls:', vec2(0, 10), 3, RED, 0, RED, 'center', config.font);
    const pos = 'left'

    if (isTouchDevice) {
      drawText('Tap left - Move', vec2(0, 6), 1.5, WHITE, 0, BLACK, pos)
      drawText('Tap right - Jump', vec2(0, 4), 1.5, WHITE, 0, BLACK, pos)
    } else {
      drawText('[x]  Change Direction', vec2(-8, 6), 1.5, WHITE, 0, BLACK, pos)
      drawText('[y]  Jump', vec2(-8, 4), 1.5, WHITE, 0, BLACK, pos)
      drawText('Or use a gamepad', vec2(-8, 2), 1.5, WHITE, 0, BLACK, pos)
    }

    drawText('Credits', vec2(-.1, -2.1), 2, BLACK, 0, RED, 'center', config.font);
    drawText('Credits', vec2(0, -2), 2, config.palette.sky.col, 0, RED, 'center', config.font);
  }
}


