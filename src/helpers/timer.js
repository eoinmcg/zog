import { timeDelta } from 'littlejsengine';

export class TimerSystem {
  constructor() {
    this.events = [];
  }

  add(delaySeconds, callback, repeat = false) {
    const event = {
      ttl: delaySeconds,
      maxTtl: delaySeconds,
      cb: callback,
      repeat: repeat
    };
    this.events.push(event);
  }

  update(dt = timeDelta) {
    for (let i = this.events.length - 1; i >= 0; --i) {
      const e = this.events[i];
      e.ttl -= dt;

      if (e.ttl <= 0) {
        e.cb();

        if (e.repeat) {
          e.ttl += e.maxTtl;
        } else {
          this.events.splice(i, 1);
        }
      }
    }
  }
}

