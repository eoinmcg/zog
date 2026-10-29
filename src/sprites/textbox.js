import {
  EngineObject, vec2, mousePos,
  Color, BLACK, WHITE, YELLOW,
  drawText, drawRect, time, sin,
  engineImageFont,
  engineObjects,
} from "littlejsengine";
import config from "../data/config";

export default class TextBox extends EngineObject {
  constructor(parent, pos, size, text, link, textColor, flash = false) {
    super(pos, size);

    this.setCollision();
    this.mass = 0;

    this.id = engineObjects.length

    this.text = text;
    this.link = link;
    this.textColor = textColor || WHITE;
    this.hoverColor = YELLOW;

    this.hover = false;
    this.selected = false;
    this.name = 'box';
    this.color = new Color(1, 1, 1, 0);
    this.active = new Color(1, 1, 1, 0.15);
    this.flash = flash;
    this.parent = parent
    this.mouse = this.parent?.mouse
  }

  update() {
    const m = mousePos;
    this.hover =
      Math.abs(m.x - this.pos.x) < this.size.x / 2 &&
      Math.abs(m.y - this.pos.y) < this.size.y / 2;

    if ((this.hover || this.selected) && mouseWasPressed(0)) {
      this.handleClick();
    }

    super.update();
  }

  render() {
    const isActive = this.hover || this.selected;
    const wave = sin(time * 5);

    drawRect(this.pos, this.size.add(vec2(4, 1)), isActive ? this.active : this.color);

    if (this.flash && wave > 0) return;

    if (this.text) {
      const font = engineImageFont;
      const col = isActive ? this.hoverColor : this.textColor;
      font.drawText(this.text, this.pos.add(vec2(.1, -.1)), .6, true, BLACK);
      font.drawText(this.text, this.pos, .6, true, col);
    }
  }

  handleClick() {
    if (!this.link) return;

    const isScene = this.link.includes('scene:');

    if (this.mouse?.activeBox && !this.isHovered()) {
      return
    }


    if (isScene) {
      const scene = this.link.split(':').pop();
      config.sceneManager.changeScene(scene);
    } else {
      const a = document.createElement('a');
      a.href = this.link;
      a.target = '_blank';
      a.click();
    }
  }

  isHovered() {
    return (this.mouse
      && this.mouse.activeBox
      && this.mouse.activeBox === this.id)
  }
}
