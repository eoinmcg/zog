import Sfx from './sfx'
import palette from './palette'
import Swiper from '../helpers/swiper'

export default {
  W: 1422,
  H: 800,
  title: 'ESCAPE FROM ZOG!',
  tileSize: 8,
  palette: palette,
  maxX: 12,
  maxY: 9,
  font: 'Orbitron-ExtraBold',
  startScene: 'Splash',
  swipe: new Swiper(),
  sfx: new Sfx(),
  modelPaths: ['earth.glb', 'ufo.glb'],
  models: {},
  tiles: ['t.png', 'bgs.png', 'logo.png'],
  trackPaths: [
    "gameOver.ogg",
    "levelComplete.ogg",
    "DeepSpace.ogg",
    "GalacticBattle.ogg",
    "MeteorShower.ogg",
    "CosmicClash.ogg",
    "OrbitalAssault.ogg",
  ],
  tracks: [],
  music: null,
}
