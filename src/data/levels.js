import {
  EngineObject3D, Color, buildGrid,
  vec2, vec3, PI, WHITE,
} from 'littlejsengine'

import alienGreen from '../weather/alienGreen';
import redDesert from '../weather/redDesert';
import lunarNight from '../weather/lunarNight';
import darkTunnel from '../weather/darkTunnel';
import mushroomTrip from '../weather/mushroomTrip';
import meteorShower from '../weather/meteorShower';
import deepSpace from '../weather/deepSpace';
import spacePort from '../weather/spacePort';

import Grass from "../sprites/grass";
import config from './config';

const bgs = [
  alienGreen,
  lunarNight,
  darkTunnel,
  mushroomTrip,
  meteorShower,
  redDesert,
  deepSpace,
  spacePort
]

// @note: level.phases: start & end are % of distance

export default [
  {
    title: 'ALIENOPOLIS',
    speed: .7,
    distance: 50,
    weather: bgs[0],
    music: 3,
    groundCol: new Color(.1, .5, .5),
    setUp() { makeGround(this.groundCol) },
    phases: [
      { start: 0, end: 95, types: ['coins'], freq: [4, 6] },
      // { start: 0, end: 75, types: ['seeker'], freq: [3, 5] },
      { start: 40, end: 70, types: ['bat'], freq: [.5, 1.5] },
      // { start: 0, end: 75, types: ['crate'], freq: [3, 5] },
      { start: 20, end: 90, types: ['crate'], freq: [2, 4] },
      { start: 10, end: 40, types: ['totem'], freq: [.4, .8] },
      { start: 60, end: 90, types: ['totem'], freq: [.4, .8] },
      // { start: 0, end: 75, types: ['wave.left', 'wave.right', 'wave.center'], freq: [3, 5] },
    ],
  },
  {
    title: 'GOING UNDERGROUND',
    speed: .7,
    distance: 60,
    weather: bgs[2],
    music: 2,
    groundCol: new Color(.1, .4, .4),
    setUp() { makeGround(this.groundCol) },
    phases: [
      { start: 3, end: 90, types: ['crawler'], freq: [1, 2] },
      { start: 0, end: 45, types: ['obstacle.long'], freq: [.5, 1] },
      { start: 50, end: 95, types: ['obstacle.long'], freq: [.4, .9] },
      { start: 0, end: 100, types: ['coins'], freq: [5, 8] },
      { start: 45, end: 50, types: ['crate'], freq: [1, 2] },
    ],
    obstacles: {
      col: 'plum',
      tile: 31
    }
  },
  {
    title: 'A LITTLE SHOWER',
    speed: .7,
    distance: 50,
    weather: bgs[4],
    music: 4,
    groundCol: new Color(.9, .6, .6),
    setUp() { makeGround(this.groundCol) },
    phases: [
      { start: 5, end: 15, types: ['meteor'], freq: [.2, .7] },
      { start: 15, end: 30, types: ['seeker'], freq: [2, 4] },
      { start: 25, end: 30, types: ['meteor'], freq: [.2, .7] },
      { start: 30, end: 50, types: ['seeker'], freq: [1, 3] },
      { start: 50, end: 65, types: ['meteor'], freq: [.2, .7] },
      { start: 65, end: 80, types: ['seeker'], freq: [1, 3] },
      { start: 75, end: 90, types: ['meteor'], freq: [.2, .7] },
      { start: 90, end: 100, types: ['coins'], freq: [.2, .7] },
    ],
  },
  {
    title: 'NIGHT NIGHT',
    speed: .7,
    distance: 50,
    weather: bgs[1],
    music: 5,
    groundCol: new Color(.4, .3, .4),
    setUp() { makeGround(this.groundCol) },
    phases: [
      { start: 3, end: 95, types: ['crawler'], freq: [1, 2] },
      { start: 0, end: 95, types: ['obstacle'], freq: [.5, 1] },
      { start: 0, end: 95, types: ['coins'], freq: [5, 8] },
      // { start: 20, end: 95, types: ['wave.left', 'wave.right', 'wave.center'], freq: [3, 5] },
      { start: 20, end: 95, types: ['skull'], freq: [3, 5] },

    ],
    obstacles: {
      col: 'white',
      tile: 31,
      shape: 'spike'
    }
  },
  {
    title: 'SPACE PORT',
    speed: .7,
    distance: 10,
    weather: bgs[7],
    music: 6,
    groundCol: new Color(.4, .3, .4),
    portal: false,
    setUp() {
      makeGround(this.groundCol)
      this.ufo = new EngineObject3D(
        vec3(6, 10, -200),
        config.models.ufo.mesh,
        null,
        // config.palette.grass.col
      );
      this.ufo.rotation3D.x = -PI * .5
      this.ufo.scale3D = vec3(20);

    },
    phases: [
      { start: 3, end: 55, types: ['crawler'], freq: [1, 2] },
      { start: 0, end: 55, types: ['obstacle'], freq: [.5, 1] },
      { start: 0, end: 75, types: ['coins'], freq: [5, 8] },
    ],
  },
]

function makeGround(col, grassNum = 50, grassTile = 0) {
  new EngineObject3D(vec3(), buildGrid(vec2(300), 1, col));
  for (let i = grassNum; i--;) {
    new Grass(true, col, grassTile)
  }
}
