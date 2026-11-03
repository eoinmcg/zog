import {
  keyWasPressed,
  render3D, engineObjectsDestroy, EngineObject3D,
  Light3D, Color, PI,
  vec2, vec3, drawText, drawTile, tile, setPaused, paused,
} from 'littlejsengine';

import config from '../data/config';
import medals from '../data/medals';
import scene from "./scene";

const keys = Object.keys(medals);

export default class Medal extends scene {


  enter() {
    super.enter();
    this.medalpointer = 0;
    this.icons = {};
    this.shown = null;
  }

  get currentKey() { return keys[this.medalpointer % keys.length]; }

  icon() {
    const k = this.currentKey;
    return this.icons[k] ||= makeMedalIcon(medals[k]);
  }

  // keep exactly one icon canvas in the page, swapped when the medal changes
  showPreview() {
    const c = this.icon();
    if (this.shown === c) return;
    this.hidePreview();
    Object.assign(c.style, {
      position: 'fixed',
      left: '50%',
      top: '50%',
      transform: 'translate(-50%, -50%)',
      width: '100px',
      height: '100px',
      pointerEvents: 'none',
      imageRendering: 'pixelated',
    });
    document.body.appendChild(c);
    this.shown = c;
  }

  hidePreview() {
    this.shown?.remove();
    this.shown = null;
  }

  update() {
    super.update();

    if (keyWasPressed('Space')) {
      this.medalpointer = (this.medalpointer + 1) % keys.length;
    }

    if (keyWasPressed('KeyX'))
      downloadCanvas(this.icon(), `${this.currentKey}.png`);
  }

  render() {
    const p = config.palette;
    drawText(this.currentKey, vec2(0, -7), 1, p.grass.col, 0, undefined, 'center', config.font);
    this.showPreview();
  }
}


function makeMedalIcon(m, size = 100) {
  const p = config.palette;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d');

  // red fill for the whole icon, then a black inlay leaving a 2px border
  g.fillStyle = String(p.red.mk);
  g.fillRect(0, 0, size, size);
  g.fillStyle = '#000';
  g.fillRect(2, 2, size - 4, size - 4);

  // emoji
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.font = '44px sans-serif';
  g.fillStyle = '#fff';
  g.fillText(m.icon, size / 2, size * 0.42);

  // title, shrunk until it fits inside the border
  let px = 14;
  do { g.font = `bold ${px}px ${config.font || 'sans-serif'}`; px--; }
  while (g.measureText(m.name).width > size - 12 && px > 6);
  g.fillText(m.name, size / 2, size * 0.82);

  return c;
}

function downloadCanvas(canvas, filename) {
  canvas.toBlob(blob => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
  }, 'image/png');
}
