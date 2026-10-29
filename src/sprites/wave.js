import {
  vec3,
  timeDelta,
  clamp,
} from 'littlejsengine';

import Baddie from './baddie';
import state from '../data/state';
import { wavePatterns } from '../data/wavePatterns';

export default class Wave extends Baddie {

  constructor(patternName, waveId) {
    const path = wavePatterns[patternName];

    if (!path) {
      throw new Error(`Unknown wave pattern: ${patternName}`);
    }

    super(path[0].pos.copy(), {
      animFrames: [28, 29],
      animSpeed: 0,
      health: 0,
      value: 10,
      type: 'skull',
      extrudeBy: .1,
      scale: vec3(2),
    });

    this.waveId = waveId;
    this.path = path;

    // Movement
    this.step = 1;
    this.stepTime = 0;
    this.stepStart = this.pos3D.copy();

    // Prevent the normal Baddie scrolling movement
    this.speedFactor = 0;
    this.velocity3D = vec3();

    // Wave tracking
    this.waveCounted = false;
  }

  update() {
    super.update();

    const target = this.path[this.step];
    if (!target) { return; }

    // Advance the current movement step
    this.stepTime += timeDelta;

    const progress = clamp(this.stepTime / target.duration, 0, 1);

    const eased = this.step === 1
      ? progress * progress * (3 - 2 * progress)
      : progress;

    // Move from the start of this step to its target
    const direction = target.pos.subtract(this.stepStart);

    this.pos3D = this.stepStart.add(
      direction.scale(eased)
    );

    if (this.pos3D.y < 0) this.pos3D.y = 0

    // Move to the next waypoint
    if (progress >= 1) {
      this.stepStart = this.pos3D.copy();
      this.stepTime = 0;
      this.step += 1;
    }
  }

  destroy(o) {
    console.log('REMOVED')
    if (o && o.name === 'laser') {
      this.checkWave();
    }

    super.destroy();
  }

  checkWave() {
    if (this.waveCounted) { return; }
    this.waveCounted = true;

    const wave = state.waves.get(this.waveId);
    if (!wave) { return; }

    wave.remaining -= 1;

    if (wave.remaining === 0) {
      state.waves.delete(this.waveId);
      console.log('WAVE DESTROYED');
    }
  }
}
