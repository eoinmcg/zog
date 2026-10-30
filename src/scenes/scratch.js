import {
  EngineObject3D, render3D, Light3D,
  CameraControl3D, createCanvasContext, TextureInfo,
  vec2, vec3, drawText, drawRect, tile, sin, time,
  keyWasPressed, gamepadWasPressed,
  setPaused, paused, hsl, Color,
  buildCylinder, buildExtrude, buildCone,
  buildBox,
} from 'littlejsengine';

import Totem from '../sprites/totem';
import config from '../data/config';
import Scene from "./scene";



export default class Scratch extends Scene {
  async enter() {
    const navy = config.palette.navy.col;
    const plum = config.palette.plum.col;
    const black = config.palette.black.col;

    new Light3D(vec3(5, 5, 5), 25, new Color(1, 1, 1));
    render3D.setSky(black, navy, plum, .5);
    render3D.camera.pos = vec3(0, 0, 8);
    render3D.camera.lookAt(vec3(0));

    new CameraControl3D(vec3(0, 1, 0), 5, 0);

    let texture = undefined,
      col = config.palette.gray.col,
      shape;

    texture = makeBrickTexture();
    texture = tile(31, config.tileSize)
    // texture = undefined;


    shape = buildCone(1, 3)
    shape = buildCylinder(1, 3)
    shape = buildBox(vec3(1, 3, 1));

    // this.test = new EngineObject3D(vec3(), shape, texture, col)
    // this.masks = [
    //   buildExtrude(tile(60, config.tileSize), vec2(1.2), .1),
    //   buildExtrude(tile(61, config.tileSize), vec2(1.2), .1)
    // ]
    // this.head = this.test.addChild(new EngineObject3D(vec3(0, 1.05, .5), this.masks[0]))

    this.totem = new Totem(vec3(0, 0, -100))

  }

  update() {
    super.update()
    this.handleUiInput()

    // const frame = sin(time * 5) > 0 ? 0 : 1;
    // this.head.mesh = this.masks[frame]

  }

}


function makeBrickTexture() {
  const size = 64, context = createCanvasContext(size);
  context.fillStyle = hsl(.05, .4, .3);
  context.fillRect(0, 0, size, size);
  context.fillStyle = hsl(.05, .5, .5);
  for (let row = 4; row--;)
    for (let col = 5; col--;)
      context.fillRect(col * 32 + (row & 1) * 8 - 8, row * 16, 30, 14);
  return new TextureInfo(context.canvas, true, true); // wrap, so uvs repeat
}
