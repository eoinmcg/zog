import {
  isTouchDevice, drawTile,
  EngineObject, vec2, mousePos,
  engineObjects,
  tile
} from "littlejsengine";
import config from "../data/config";

export default class Mouse extends EngineObject {
  constructor(size = .75) {
    super(vec2(0), vec2(.1));

    this.setCollision();
    this.drawSize = size;
    this.setCollision();
    this.renderOrder = 5000;
    this.name = 'mouse';
    document.body.style.cursor = 'none';

    this.hover = false;
    this.activeBox = false

  }

  update() {
    super.update();
    this.pos = mousePos.copy();

    // Check if any box object in the engine is currently being hovered
    this.hover = engineObjects.some(o => o.name === 'box' && o.hover);
    this.activeBox = false
  }

  collideWithObject(o) {
    if (o.name === 'box') {
      this.activeBox = o.id
    }
  }

  render() {
    if (isTouchDevice) return;
    const frame = this.hover ? 23 : 22;
    drawTile(this.pos.add(vec2(0, -.5)), vec2(1), tile(frame, config.tileSize));
  }

}
