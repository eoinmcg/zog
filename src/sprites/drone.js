import {
  vec3,
} from 'littlejsengine';
import Baddie from './baddie';

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
  }
}
