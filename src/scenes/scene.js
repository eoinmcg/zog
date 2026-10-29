import {
  render3D, engineObjectsDestroy,
  toggleFullscreen, timeDelta,
  drawRect, cameraPos, vec2, Color,
  keyWasPressed, keyWasReleased,
  mouseWasReleased, mouseWasPressed,
  gamepadWasReleased, gamepadStick, gamepadWasPressed,
} from 'littlejsengine';

import config from "../data/config";
import state from "../data/state";

import Weather from '../weather/weather';
import Tunnel from '../weather/tunnel';


import { restartMusic, stopMusic } from "../helpers/music";

export default class Scene {
  enter() {
    this.uiInput = false;
    this.lastStickY = 0
    this.cleanedUp = false;
    this.tunnel = false;
  }

  exit() { }

  update() {

    state.events.update();
    if (keyWasPressed('KeyM')) {
      state.mute = !state.mute
      if (state.mute) {
        stopMusic()
      } else {
        restartMusic()
      }
    }

    if (keyWasPressed('KeyF')) {
      toggleFullscreen();
    }

    this.skip = false;
    if (mouseWasReleased(0)
      || keyWasReleased('Space')
      || keyWasReleased('Enter')
      || keyWasReleased('KeyX')
      || keyWasReleased('KeyZ')
      || gamepadWasReleased(2)
      || gamepadWasReleased(0)) {
      this.skip = true;
    }


    this.uiInput = false;

  }

  // for navigating menus on splash screen etc
  handleUiInput() {
    const stick = gamepadStick(0);
    const swipe = config.swipe.dir;
    const isTouchDevice = navigator.maxTouchPoints > 0;

    this.uiInput = false;

    if (keyWasPressed('ArrowUp')
      || swipe === 'up'
      || (this.lastStickY > 0 && stick.y === 0)) {
      this.uiInput = 'up';
      config.swipe.clear();
    }
    if (keyWasPressed('ArrowDown')
      || swipe === 'down'
      || (this.lastStickY < 0 && stick.y === 0)) {
      this.uiInput = 'down';
      config.swipe.clear();
    }
    if (keyWasPressed('ArrowLeft')
      || swipe === 'left'
      || (this.lastStickX < 0 && stick.x === 0)) {
      this.uiInput = 'left';
      config.swipe.clear();
    }
    if (keyWasPressed('ArrowRight')
      || swipe === 'right'
      || (this.lastStickX > 0 && stick.x === 0)) {
      this.uiInput = 'right';
      config.swipe.clear();
    }

    // Only check enter if no directional swipe was already handled
    if (!this.uiInput) {
      if (keyWasPressed('Enter')
        || keyWasPressed('ArrowUp')
        || keyWasPressed('ArrowDown')
        || keyWasPressed('KeyW')
        || keyWasPressed('KeyZ')
        || keyWasPressed('KeyS')
        || keyWasPressed('KeyX')
        || gamepadWasPressed(0)
        || gamepadWasPressed(1)
        || gamepadWasPressed(2)
        || gamepadWasPressed(7)
        || gamepadWasPressed(14)
        || gamepadWasPressed(15)
        || (!isTouchDevice && mouseWasPressed(0))  // only on real mouse
        || swipe === 'tap'
        || keyWasPressed('Space')) {
        this.uiInput = 'enter';
        config.swipe.clear();
      }
    }

    this.lastStickY = stick.y;
    this.lastStickX = stick.x;
  }

  updatePost() {
    // state.fade = Math.min(1, state.fade + timeDelta * 2)
  }
  render() { }
  renderPost() {
    drawRect(cameraPos, vec2(100, 100), new Color(0, 0, 0, state.fade))
  }

  initWeather(weatherSystem) {

    // Destroy previous weather.
    if (config.weather) {
      config.weather.destroy();
      config.weather = undefined;
    }

    // Destroy previous tunnel.
    if (this.tunnel) {
      this.tunnel.destroy();
      this.tunnel = undefined;
    }


    // Select background.
    config.weather = new Weather(weatherSystem);

    // Set transparent rendering callback.
    render3D.onRenderTransparent = () => {
      config.weather?.renderTransparent();
    };

    if (config.weather.hasTunnel) {
      this.tunnel = new Tunnel();
    }
  }

  cleanup() {

    if (this.cleanedUp) return;
    // this.cleanedUp = true;
    engineObjectsDestroy()

    // Stop rendering callbacks.
    render3D.onRenderTransparent = undefined;
    if (config.weather) {
      config.weather.destroy();
      config.weather = undefined;
    }
    if (this.tunnel) {
      this.tunnel.destroy();
      this.tunnel = undefined;
    }
    config.swipe.clear();
    stopMusic();
  }


}
