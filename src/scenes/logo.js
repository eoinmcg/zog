
import {
  keyWasPressed, gamepadWasPressed,
  vec2, drawText, setPaused, paused,
  setFontDefault,
} from 'littlejsengine';

import config from '../data/config';
import Scene from "./scene";

import { preloadFont } from '../helpers/loaders';


export default class Logo extends Scene {
  async enter() {
    this.font = 'SfFedora'
    await preloadFont(this.font)
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

    if (keyWasPressed('KeyS')) {
      this.saveLogo();
    }

  }

  renderPost() {
    setFontDefault(this.font)
    const title = config.title.replace(' ', '\n')
    drawText(title, vec2(-20.2, 3.8), 4, config.palette.orange.col, 0, undefined, 'left', this.font)
    drawText(title, vec2(-20, 4), 4, config.palette.red.col, 0, undefined, 'left', this.font)
  }

  saveLogo() {
    const title = config.title.replace(' ', '\n');
    const font = this.font;

    const fontSize = 160;
    const lineHeight = fontSize * 1.1;
    const offset = 8;
    const padding = 20;

    const lines = title.split('\n');

    // Temporary canvas for measuring text
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    ctx.font = `${fontSize}px "${font}"`;

    const textWidth = Math.max(
      ...lines.map(line => ctx.measureText(line).width)
    );

    const textHeight = lines.length * lineHeight;

    // Square canvas, rounded up to the next power of two
    const requiredSize = Math.ceil(
      Math.max(textWidth, textHeight) + padding * 2 + offset * 2
    );

    const size = 2 ** Math.ceil(Math.log2(requiredSize));

    canvas.width = size;
    canvas.height = size;

    // Canvas resizing resets context state
    ctx.font = `${fontSize}px "${font}"`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    // Transparent background by default
    lines.forEach((line, i) => {
      const x = padding;
      const y = padding + i * lineHeight;

      // Orange layer (slightly offset)
      ctx.fillStyle = config.palette.orange.col;
      ctx.fillText(line, x - offset, y - offset);

      // Red foreground
      ctx.fillStyle = config.palette.red.col;
      ctx.fillText(line, x, y);
    });

    // Download PNG
    canvas.toBlob(blob => {
      if (!blob) return;

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');

      link.href = url;
      link.download = 'logo.png';
      link.click();

      URL.revokeObjectURL(url);
    }, 'image/png');
  }
}

