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

import Grass from "../sprites/grass";
import config from './config';

const bgs = [
  alienGreen,
  lunarNight,
  darkTunnel,
  mushroomTrip,
  meteorShower,
  redDesert,
  deepSpace
]

// @note: level.phases: start & end are % of distance

export default [
  {
    title: 'ALIENOPOLIS',
    speed: .7,
    distance: 10,
    weather: bgs[0],
    music: 3,
    groundCol: new Color(.1, .5, .5),
    setUp() { makeGround(this.groundCol) },
    phases: [
      // { start: 3, end: 55, types: ['crawler'], freq: [1, 2] },
      // { start: 0, end: 75, types: ['seeker'], freq: [3, 5] },
      { start: 0, end: 75, types: ['bat'], freq: [3, 5] },
      // { start: 0, end: 75, types: ['crate'], freq: [3, 5] },
      { start: 0, end: 90, types: ['totem'], freq: [.5, .8] },
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
      { start: 3, end: 55, types: ['crawler'], freq: [1, 2] },
      { start: 0, end: 55, types: ['obstacle.long'], freq: [.5, 1] },
      { start: 0, end: 75, types: ['coins'], freq: [5, 8] },
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
      { start: 10, end: 55, types: ['meteor'], freq: [.1, .7] },
    ],
  },
  {
    title: 'NIGHT NIGHT',
    speed: .7,
    distance: 10,
    weather: bgs[1],
    music: 5,
    groundCol: new Color(.4, .3, .4),
    setUp() { makeGround(this.groundCol) },
    phases: [
      { start: 3, end: 55, types: ['crawler'], freq: [1, 2] },
      { start: 0, end: 55, types: ['obstacle'], freq: [.5, 1] },
      { start: 0, end: 75, types: ['coins'], freq: [5, 8] },
    ],
  },
  {
    title: 'SPACE PORT',
    speed: .7,
    distance: 10,
    weather: bgs[6],
    music: 6,
    groundCol: new Color(.4, .3, .4),
    setUp() {
      makeGround(this.groundCol)
      this.ufo = new EngineObject3D(
        vec3(6, 10, -200),
        config.models.ufo.mesh,
        null,
        config.palette.grass.col
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
