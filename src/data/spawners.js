import { vec3, rand } from 'littlejsengine';

import Obstacle from '../sprites/obstacle';
import Crate from '../sprites/crate';
import Crawler from '../sprites/crawler';
import Meteor from '../sprites/meteor';
import spawnCoins from '../helpers/spawnCoins';
import spawnWave from '../helpers/spawnWave';


export default {
  obstacle() { new Obstacle(vec3(rand(-14, 14), -5, -300)); },
  crate() { new Crate(); },
  crawler() { new Crawler(); },
  coins() { spawnCoins(); },
  meteor() { new Meteor(); },

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
