import {
  engineObjectsDestroy, engineObjects,
  inputClear, keyWasPressed, gamepadWasPressed, gamepadStick,
  mouseWasPressed, mousePos,
  render3D, vec3, vec2, lerp, clamp,
  rand, paused, setPaused,
  toggleFullscreen,
  engineImageFont,
  isTouchDevice,
  Color, BLACK, WHITE, YELLOW, RED,
  drawRect, drawText, drawTile, tile,
  sin, time, timeDelta
} from 'littlejsengine';

import levels from '../data/levels';
import config from '../data/config';
import state, { resetState } from '../data/state';
import { setItem } from '../helpers/store';

import Alert from '../sprites/alert';
import Player from '../sprites/player';
import Portal from '../sprites/portal';
import Scene from './scene';

import { updateLevelPhases } from '../helpers/updateLevelPhases';
import spawners from '../data/spawners';

import {
  playMusic,
  restartMusic,
  stopMusic
} from '../helpers/music';


export default class Play extends Scene {

  constructor() {
    super();

    this.pointer = 0;
    this.pausedPointer = 0;
    this.lastStickY = 0;

    this.yPos = [-5, -7];

    this.cleanedUp = false;
  }


  enter() {

    inputClear();
    state.gameOver = 0;

    engineObjectsDestroy();

    this.pointer = 0;
    this.pausedPointer = 0;
    this.lastStickY = 0;
    this.cleanedUp = false;

    state.player = new Player(
      vec3(0, 0.5, 0), 3
    );

    render3D.camera.pos = vec3(0, 5, 12);
    this.cameraPos = render3D.camera.pos.copy()

    state.level = levels[state.currentLevel - 1];
    if (!state.level) {
      console.warn('LEVEL DOESNT EXIST. REVERTING to 0')
      state.level = levels[0]
    }
    this.initWeather(state.level.weather);
    state.level.setUp();

    const font = engineImageFont;
    new Alert({
      text: 'LEVEL ' + state.currentLevel,
      fontSize: 1,
      imageFont: font,
      col: 'white',
      outline: 'black'
    })
    state.events.add(1, () => {
      new Alert({ text: state.level.title })

    })

    state.level.completed = 0
    state.level.isFinished = false
    state.level.exitReached = false
    this.portalCameraTarget = undefined;
    this.cameraLookTarget = undefined;
    playMusic(state.level.music);

    state.level.phases = state.level.phases.map(phase => ({
      ...phase,
      timer: 0,
      triggered: false,
    }));

    state.speed = state.level.speed;
  }

  update() {
    super.update();

    if (this.tunnel) {
      this.tunnel.speed = (state.gameOver || state.level.exitReached)
        ? 0
        : state.speed * 90;
    }

    config.weather?.update();

    if (state.score > state.hiScore) {
      if (!state.newHiscore) {
        new Alert({
          text: 'NEW HISCORE!',
          fontSize: 1,
          imageFont: engineImageFont,
          col: 'grass',
          outline: 'black'
        })
        config.sfx.play('medal')
      }
      state.newHiscore = true;
      state.hiScore = state.score
      setItem('HiScore', state.score)
    }

    if (!state.gameOver && !state.level.exitReached) {
      state.level.completed += timeDelta
    }
    state.level.percentComplete = (state.level.completed / state.level.distance) * 100

    if (!state.level.complete && !state.gameOver) {
      updateLevelPhases(state.level, timeDelta, spawners);
    }
    this.updateCamera();

    if (state.level.completed >= state.level.distance && !state.level.isFinished) {
      state.level.isFinished = true
      playMusic(1, false)
      this.portal = new Portal()
      console.log('NEW PORTAL', this.portal)
      window.portal = this.portal
    }
  }

  updateCamera() {
    state.shake = Math.max(0, state.shake - timeDelta * 5)

    const camera = render3D.camera;

    const shakeX = state.shake * rand(-.4, .4)
    const shakeY = state.shake * rand(-.3, .3)

    let targetPos;
    let targetLookAt;

    // Find the dead player body
    const ded = engineObjects.find(o => o.name === 'ded');
    if (ded) {
      // Cinematic death camera
      targetPos = vec3(ded.pos3D.x, ded.pos3D.y + 5, 10);
      targetLookAt = vec3(ded.pos3D.x, ded.pos3D.y, ded.pos3D.z);

    } else if (state.level.exitReached) {
      const pos = state.level.portalExitPos;
      if (!pos) return;

      targetPos = vec3(pos.x, pos.y + 2, pos.z + 20);
      targetLookAt = pos.copy();
    }
    else if (state.player) {
      // Normal player tracking
      const runnerX = state.player.pos3D.x;
      const runnerY = state.player.pos3D.y;

      targetPos = vec3(runnerX * .45, 3.7 + runnerY * .25, 7);
      targetLookAt = vec3(runnerX * .5, 1.7, -12);
    }
    else {
      return;
    }

    const smooth = ded ? .015 : state.level.exitReached ? .035 : .1;

    this.cameraPos = vec3(
      lerp(this.cameraPos.x, targetPos.x, smooth),
      lerp(this.cameraPos.y, targetPos.y, smooth),
      state.level.exitReached && !ded
        ? targetPos.z
        : lerp(this.cameraPos.z, targetPos.z, smooth)
    )

    camera.pos = this.cameraPos.add(vec3(shakeX, shakeY, 0))
    this.cameraLookTarget ??= targetLookAt;

    this.cameraLookTarget = vec3(
      lerp(this.cameraLookTarget.x, targetLookAt.x, smooth),
      lerp(this.cameraLookTarget.y, targetLookAt.y, smooth),
      lerp(this.cameraLookTarget.z, targetLookAt.z, smooth)
    );

    camera.lookAt(this.cameraLookTarget);
  }

  spawn() {


  }

  updatePost() {
    this.handleUiInput();
    this.handlePauseInput();

    if (state.gameOver) {
      this.handleGameOverInput();
      return
    }

    if (state.gameOver && time > state.gameOver + 2 && this.skip) {
      this.restartGame();
      return;
    }


    this.pausedPointer = this.clampPointer(
      this.pausedPointer,
      this.uiInput
    );

    if (this.uiInput === 'enter') {
      this.handlePauseMenuSelection();
    }
  }

  handlePauseInput() {
    const pausePressed = keyWasPressed('KeyP') || gamepadWasPressed(9);

    const pauseClicked =
      mouseWasPressed(0) &&
      mousePos.x > 18 &&
      mousePos.y > 9.5;

    if (!state.gameOver && (pausePressed || pauseClicked)) {
      if (paused) {
        if (!state.mute) {
          restartMusic();
        }
      } else {
        stopMusic();
      }
      setPaused(!paused);
    }
  }

  handleGameOverInput() {
    if (time <= state.gameOver + 1) return;

    if (this.uiInput === 'up') {
      this.pointer--;
      config.sfx.play('walk');
      console.log('up')
    } else if (this.uiInput === 'down') {
      this.pointer++;
      config.sfx.play('walk');
      console.log('down')
    } else if (this.uiInput === 'enter' && this.pointer === 0) {
      this.restartGame();
    } else if (this.uiInput === 'enter' && this.pointer === 1) {
      this.quitGame();
    }

    if (this.pointer < 0) this.pointer = 1
    if (this.pointer > 1) this.pointer = 0

  }

  restartGame() {
    this.cleanup();
    const level = state.currentLevel
    resetState();
    state.currentLevel = level
    config.sceneManager.changeScene('Play');
  }

  quitGame() {
    this.cleanup();
    config.sceneManager.changeScene('Splash');
  }


  clampPointer(pointer, input) {
    if (input === 'up') pointer--;
    if (input === 'down') pointer++;

    return (
      pointer + 2
    ) % 2;
  }

  handlePauseMenuSelection() {
    if (!paused) return;

    const actions = [
      () => { state.mute = !state.mute; },
      () => { toggleFullscreen(); }
    ];

    actions[this.pausedPointer]?.();
  }

  render() {
    const font = engineImageFont;

    const score = String(state.score).padStart(5, '0');
    const col = state.newHiscore ? config.palette.yellow.col : WHITE
    font.drawText(
      score,
      vec2(0, 10.9),
      1, true, BLACK
    );
    font.drawText(
      score,
      vec2(0, 11),
      1, true, col
    );

    if (state.gameOver) {
      this.renderGameOver();
    }

    for (let i = 0; i < state.lives; i++) {
      drawTile(
        vec2(-20 + i * 1.5, 11),
        vec2(1.2),
        tile(26, config.tileSize)
      );
    }

    const coins = String(state.coins).padStart(3, '0');
    drawTile(
      vec2(-20, 9.5),
      vec2(1.2),
      tile(36, config.tileSize)
    );
    font.drawText(
      coins,
      vec2(-18, 9.4),
      .8, true, BLACK
    );
    font.drawText(
      coins,
      vec2(-18, 9.5),
      .8, true, WHITE
    );

  }

  renderGameOver() {
    const elapsed = time - state.gameOver;
    const chars = Math.min(
      9,
      Math.floor(elapsed * 12)
    );

    const text = 'GAME OVER'.slice(0, chars);

    const fade = chars === 9
      ? (sin(time * 3) + 1) / 2
      : 1;

    drawText(text, vec2(0.1, 3.9), 4, BLACK.scale(fade / 2));
    drawText(text, vec2(0, 4), 4, YELLOW.scale(fade));

    if (elapsed > 1) {
      const font = engineImageFont;
      font.drawText('CONTINUE?', vec2(0, -5), 1.2, true);
      font.drawText('QUIT', vec2(0, -7), 1.2, true);

      const t = this.pointer === 0 ? 41 : 28;
      drawTile(
        vec2(-6.5, this.yPos[this.pointer]),
        vec2(1),
        tile(t, config.tileSize),
        undefined,
        0,
        false
      );
    }
  }


  renderPost() {

    this.renderProgress();
    this.renderPaused();
  }

  renderProgress() {
    const progress = clamp(state.level.completed / state.level.distance, 0, 1);
    if (!progress) return

    const barWidth = 24;
    const barHeight = .5;
    const width = barWidth * progress;
    const barY = -12;

    // Black background (full width)
    drawRect(
      vec2(0, barY),
      vec2(barWidth, barHeight),
      BLACK
    );

    // Red progress (grows from left to right)
    drawRect(
      vec2(-barWidth / 2 + width / 2, barY),
      vec2(width, barHeight),
      RED
    );
  }

  renderPaused() {
    if (isTouchDevice) {
      const rightX = 20;

      drawRect(vec2(rightX + 0.1, 10.8), vec2(0.5, 1.7), BLACK);
      drawRect(vec2(rightX + 1.1, 10.8), vec2(0.5, 1.7), BLACK);
      drawRect(vec2(rightX, 11), vec2(0.5, 1.7), WHITE);
      drawRect(vec2(rightX + 1, 11), vec2(0.5, 1.7), WHITE);
    }

    if (!paused || state.hitStop) return;

    const wave = Math.sin(
      new Date().getTime() * 0.005
    );

    const font = engineImageFont;

    if (wave > 0) {

      drawText(
        'PAUSED',
        vec2(-0.1, 2.8),
        3.5,
        BLACK
      );

      drawText(
        'PAUSED',
        vec2(0, 3),
        3.5,
        WHITE
      );

    }

    const yPos = -2;

    const isInstalled =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.matchMedia('(display-mode: fullscreen)').matches ||
      navigator.standalone === true;

    drawRect(
      vec2(0, -3),
      vec2(12, 4),
      new Color(0, 0, 0, 0.4)
    );

    drawTile(
      vec2(-5, yPos - this.pausedPointer),
      vec2(0.5),
      0
    );

    font.drawText(
      `MUTE: ${state.mute ? 'ON' : 'OFF'}`,
      vec2(-4, yPos),
      0.6,
      false,
      WHITE
    );

    font.drawText(
      `FULLSCREEN: ${isInstalled ? 'ON' : 'OFF'}`,
      vec2(-4, yPos - 1),
      0.6,
      false,
      WHITE
    );
  }
}
