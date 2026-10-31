import { vec3, rand } from 'littlejsengine';

import Obstacle from '../sprites/obstacle';
import Crate from '../sprites/crate';
import Crawler from '../sprites/crawler';
import Seeker from '../sprites/seeker';
import Drone from '../sprites/drone';
import Meteor from '../sprites/meteor';
import Skull from '../sprites/skull';
import Totem from '../sprites/totem';
import Bat from '../sprites/bat';
import spawnCoins from '../helpers/spawnCoins';
import spawnWave from '../helpers/spawnWave';


export default {
  obstacle() { new Obstacle(vec3(rand(-14, 14), -5, -200)); },
  crate() { new Crate(); },
  crawler() { new Crawler(); },
  coins() { spawnCoins(); },
  meteor() { new Meteor(); },
  drone() { new Drone(); },
  seeker() { new Seeker(); },
  totem() { new Totem(); },
  skull() { new Skull(); },
  bat() { new Bat(); },

  wave(dir = 'left') {
    spawnWave(dir);
  },

  'obstacle.long': () => {
    new Obstacle(vec3(rand(-10, 10), -5, -300), 1, 3);
  },
  'wave.left': () => spawnWave('left'),
  'wave.right': () => spawnWave('right'),
  'wave.center': () => spawnWave('center'),

};
