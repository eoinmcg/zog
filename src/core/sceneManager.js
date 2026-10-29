import {
  engineObjectsDestroy, engineObjects,
  inputClear, keyIsDown
} from "littlejsengine";
import { resetEvents } from "../data/state.js";
import { stopMusic } from "../helpers/music.js";
import config from "../data/config.js";

import Play from "../scenes/play.js";
import Splash from "../scenes/splash.js";
import Help from "../scenes/help.js";
import Settings from "../scenes/settings.js";
import Model from "../scenes/model.js";
import Shop from "../scenes/shop.js";
import Logo from "../scenes/logo.js";

const Scenes = {
  Play: Play,
  Splash: Splash,
  Help: Help,
  Settings: Settings,
  Model: Model,
  Shop: Shop,
  Logo: Logo,
};

export default class SceneManager {
  constructor() {
    this.currentScene = null;
    this.lastChange = 500;
  }

  changeScene(newScene, data = {}, effect = "complete", force = false) {
    const delta = new Date().getTime() - this.lastChange;
    if (!force && delta < 1000) {
      return;
    }

    try {
      stopMusic()
    } catch (e) { }

    this.lastChange = new Date().getTime();
    document.body.classList.add(effect);
    resetEvents()

    window.setTimeout(() => {
      if (this.currentScene) {
        this.currentScene.exit();
      }
      engineObjectsDestroy();
      engineObjects.length = 0

      if (config.weather) {
        config.weather.destroy();
        config.weather = undefined;
      }

      this.clearInput();
      document.body.classList.remove(effect);
      this.currentScene = new Scenes[newScene]();
      this.currentScene.enter(data);
    }, 150);
  }

  update() {
    if (this.currentScene) {
      this.currentScene.update();
    }
  }

  updatePost() {
    if (this.currentScene) {
      this.currentScene.updatePost();
    }
  }

  render() {
    if (this.currentScene) {
      this.currentScene.render();
    }
  }

  renderPost() {
    if (this.currentScene) {
      this.currentScene.renderPost();
    }
  }

  clearInput() {
    inputClear();
    for (let key in keyIsDown) {
      keyIsDown[key] = false;
    }
  }
}
