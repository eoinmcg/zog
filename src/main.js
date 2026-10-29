'use strict';

import {
  engineInit, vec2,
  setTileDefaultBleed, setFontDefault,
  setCanvasFixedSize, setCanvasMaxSize,
  setShowSplashScreen, setDebugWatermark,
  Render3DPlugin, render3D
} from "littlejsengine";

import config from "./data/config";
import state from "./data/state";
import { preloadAudio, preloadFont, preloadModels } from "./helpers/loaders";
import favIcon from "./helpers/favicon";
import SceneManager from "./core/sceneManager";

async function gameInit() {
  document.title = config.title
  setTileDefaultBleed(.5);

  favIcon()
  setFontDefault(config.font);

  const size = vec2(config.W, config.H);
  setCanvasFixedSize(size);
  setCanvasMaxSize(size);

  new Render3DPlugin;

  render3D.shadows = true;
  render3D.shadowMapSize = 2048;

  config.sceneManager = new SceneManager()
  config.sceneManager.changeScene(config.startScene);

  const loadingDiv = document.querySelector('.loading');
  if (loadingDiv) {
    loadingDiv.remove();
  }

  if (window.BUILD) {
    setShowSplashScreen(true);
    console.log(`Built: ${BUILD}  [commit: ${COMMIT}]\n\n`);
    console.log(
      "%c" + `👽️ Greetings, Human!`,
      "font-size: 24px; font-family: monospace; font-weight: bold; color: hotpink;",
    );
    console.log(`Check the source: https://github.com/eoinmcg/escape-from-zog`);
    console.log(`code & GFX by @eoinmcg`);
    console.log(`made with: https://github.com/KilledByAPixel/LittleJS`);
    console.log(`music: https://davidkbd.itch.io/interstellar-vol2-edm-metal-music-pack `);
  } else {
    console.log('DEV MODE')
  }
}


function gameUpdate() {
  config.sceneManager.update();
}

function gameUpdatePost() {
  config.sceneManager.updatePost();
}

function gameRender() {
  config.sceneManager.render();
}

function gameRenderPost() {
  config.sceneManager.renderPost();
}

async function startGame() {
  engineInit(
    gameInit,
    gameUpdate,
    gameUpdatePost,
    gameRender,
    gameRenderPost,
    config.tiles
  )
}

// for debugging ?l=levelNum or ?s=Tutorial etc
const params = Object.fromEntries(new URLSearchParams(location.search));
if (params.l) {
  config.startScene = "Play";
  state.currentLevel = parseInt(params.l, 10)
  console.log('LEVEL', config.levelNum)
}
if (params.s) {
  config.startScene = params.s.charAt(0).toUpperCase() + params.s.slice(1);
}

await preloadFont()
config.models = await preloadModels(config.modelPaths)
preloadAudio(startGame)


// naughty, naughty
Array.prototype.rnd = function() {
  return this[Math.floor(Math.random() * this.length)];
};
