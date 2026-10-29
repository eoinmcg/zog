
export default class Swiper {
  constructor() {
    if (Swiper.instance) return Swiper.instance;

    Swiper.instance = this;
    this.clear();

    document.addEventListener(
      'touchstart',
      this.start,
      { passive: false }
    );

    document.addEventListener(
      'touchmove',
      this.move,
      { passive: false }
    );

    document.addEventListener(
      'touchend',
      this.end,
      { passive: false }
    );

    document.addEventListener(
      'touchcancel',
      this.cancel,
      { passive: false }
    );
  }


  start = (e) => {
    // Ignore additional fingers.
    if (this.touchId !== null) return;

    const t = e.changedTouches[0];
    if (!t) return;

    // Reset previous gesture.
    this.dir = null;

    this.touchId = t.identifier;

    this.sx = this.lx = t.clientX;
    this.sy = this.ly = t.clientY;

    this.screen =
      t.clientX < window.innerWidth / 2
        ? 'left'
        : 'right';
  }

  move = (e) => {
    if (this.touchId === null) return;

    const t = Array.from(e.changedTouches).find(
      touch => touch.identifier === this.touchId
    );

    if (!t) return;

    this.lx = t.clientX;
    this.ly = t.clientY;
  }

  end = (e) => {
    if (this.touchId === null) return;

    const t = Array.from(e.changedTouches).find(
      touch => touch.identifier === this.touchId
    );

    if (!t) return;

    this.lx = t.clientX;
    this.ly = t.clientY;

    const dx = this.sx - this.lx;
    const dy = this.sy - this.ly;

    const ax = Math.abs(dx);
    const ay = Math.abs(dy);

    this.dir =
      Math.max(ax, ay) < 20
        ? 'tap'
        : ax > ay
          ? (dx > 0 ? 'left' : 'right')
          : (dy > 0 ? 'up' : 'down');

    this.touchId = null;
  }

  cancel = (e) => {
    if (this.touchId === null) return;

    const cancelled = Array.from(e.changedTouches).some(
      touch => touch.identifier === this.touchId
    );

    if (cancelled) {
      this.clear();
    }
  }

  // Read a gesture exactly once.
  consume() {
    if (!this.dir) return null;

    const gesture = {
      dir: this.dir,
      screen: this.screen
    };

    this.dir = null;
    this.screen = null;

    return gesture;
  }

  clear() {
    this.sx = null;
    this.sy = null;

    this.lx = null;
    this.ly = null;

    this.dir = null;
    this.screen = null;

    this.touchId = null;
  }
}
