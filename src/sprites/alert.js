import {
  EngineObject, vec2, setFontDefault,
  Timer, drawText, timeDelta
} from "littlejsengine";

import config from "../data/config";
import { stopMusic } from '../helpers/music';

export default class Alert extends EngineObject {
  constructor(props = {}) {
    const defaults = {
      text: 'OHAI!',
      pos: vec2(0, 2),
      blink: false,
      fontSize: 2.5,
      col: 'white',
      outline: 'red',
      sfx: null,
      ttl: 3,
      imageFont: null,
      teletype: true,
      typeSpeed: 20
    };

    props = { ...defaults, ...props };

    super(props.pos);

    this.pos = props.pos;
    this.col = config.palette[props.col].col;
    this.fontSize = props.fontSize;
    this.outline = config.palette[props.outline].col;

    this.renderOrder = 1000;

    this.props = props;
    this.blink = props.blink;
    this.text = props.text;
    this.fonts = props.fonts;

    // Image font
    this.imageFont = props.imageFont;

    // Teletype state
    this.teletype = props.teletype;
    this.typeSpeed = props.typeSpeed;
    this.charProgress = 0;
    this.visibleChars = this.teletype
      ? 0
      : this.text.length;

    this.typing = this.teletype && this.text.length > 0;

    // TTL starts after typing completes
    this.ttl = props.ttl;
    this.timer = this.typing
      ? null
      : (this.ttl > 0 ? new Timer(this.ttl) : null);

    if (props.sfx) {
      config.sfx.play(props.sfx);
    }

    if (props.stopMusic) {
      stopMusic();
    }
  }

  update() {
    // Phase 1: Teletype
    if (this.typing) {
      this.charProgress += this.typeSpeed * timeDelta;

      this.visibleChars = Math.min(
        this.text.length,
        Math.floor(this.charProgress)
      );

      if (this.visibleChars >= this.text.length) {
        this.typing = false;

        if (this.ttl > 0) {
          this.timer = new Timer(this.ttl);
        }
      }

      return;
    }

    // Phase 2: Movement
    if (this.timer) {
      this.pos.y += 0.1;

      if (this.timer.elapsed()) {
        this.destroy();
      }
    }
  }

  render() {
    const wave = Math.sin(Date.now() * 0.005);

    if (this.blink && !this.typing && wave > 0) {
      return;
    }

    const text = this.text.slice(0, this.visibleChars);

    if (!text) {
      return;
    }

    if (this.imageFont) {
      // EngineImageFont rendering
      this.imageFont.drawText(text, this.pos.add(vec2(0, -.2)), this.fontSize, true, this.outline);
      this.imageFont.drawText(text, this.pos, this.fontSize, true, this.col);
    } else {
      // Original font rendering
      setFontDefault(config.font);

      drawText(
        text,
        this.pos.add(vec2(0, this.fontSize / -15)),
        this.fontSize,
        this.outline
      );

      drawText(
        text,
        this.pos,
        this.fontSize,
        this.col
      );
    }
  }
}
