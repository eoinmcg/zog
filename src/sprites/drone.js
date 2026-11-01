import {
  vec3, Light3D, WHITE,
} from 'littlejsengine';

import Baddie from './baddie';
import config from '../data/config';

export default class Drone extends Baddie {
  constructor(pos) {
    super(pos, {
      animFrames: [48, 49, 50, 51],
      animSpeed: 10,
      health: 0,
      value: 10,
      type: 'drone',
      scale: vec3(2)
    });
    this.emissive = 1
  }
}
