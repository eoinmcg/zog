import {
  render3D, engineObjectsDestroy, EngineObject3D,
  Light3D, PI, rand, lerp,
  vec2, vec3, time,
  buildExtrude, tile, hsl,
  DirectionalLight3D, CameraControl3D, ParticleEmitter3D
} from 'littlejsengine';

import config from '../data/config';
import state, { resetState } from '../data/state';
import { playMusic } from '../helpers/music';
import Scene from "./scene";
import meteorShower from '../weather/meteorShower';
import Alert from '../sprites/alert';
import { getAnalyser, getBass } from '../helpers/analyser';

let audioApi;
let pulse = 0;
let camZ = 300;

let skull;
let showFire = false
const zTarget = 5;
let analyser, audioDataArray;

export default class Victory extends Scene {
  enter() {

    const light = { from: vec3(-.25, .25, 1), color: hsl(.6, .4, .65), intensity: .8 };
    new DirectionalLight3D(light.from, light.color, light.intensity);
    new DirectionalLight3D(vec3(-.25, .25, -1), light.color, light.intensity);

    // new CameraControl3D(vec3(0, 0, 0), 50, 0, 0);

    skull = new EngineObject3D(
      vec3(0),
      buildExtrude(tile(79, config.tileSize), vec2(3), 1)
    )
    skull.emissive = .1

    render3D.camera.pos = vec3(0,0,300)

    state.events.add('5', () => {
      showFire = true
      playMusic(5, false)
      window.setTimeout(() => {
        console.log(config.music, config.music instanceof HTMLMediaElement);
        audioApi = getAnalyser(config.music);
      }, 100)
    })

    state.events.add('2', () => {
      new Alert({
        pos: vec2(0,-9),
        text: 'eoinmcg presents',
        col: 'grass',
        outline: 'forest',
        typeSpeed: 10,
        yVel: 0,
      })
    })

  }


  update() {
    super.update();

    // camera zoom, independent of the audio
    camZ = lerp(camZ, zTarget, 0.05);
    render3D.camera.pos.z = camZ;

    // skull pulse
    let bass = getBass(audioApi) * 20;
    // fast attack, slow release so it feels punchy rather than jittery
    pulse = bass > pulse ? lerp(pulse, bass, 0.5) : lerp(pulse, bass, 0.1);


    const s = 1 + pulse * 0.4;
    skull.size = vec3(s);               // see note below
    // skull.emissive = 0.1 + pulse * 0.6; // glow on the beat
    skull.angle = Math.sin(time * 2) * 0.1 * pulse; // optional sway
    console.log(bass, pulse)

    showFire = true
    if (showFire && rand() > .4) {
      flames(skull.pos3D.add(vec3(0, 0, -5)));
    }
  }

}


function flames(pos, gravity = .02) {
  const p = config.palette
  const colA = p.red.col,
  colB = p.orange.col,
  colAEnd = p.red.mk(.5),
  colBEnd = p.orange.mk(.5);
  new ParticleEmitter3D(
    pos,                  // pos
    .02, .1,                         // emitSize, emitTime
    600, PI, undefined,            // rate, cone, tileInfo
    colA, colB, // colorStartA, colorStartB
    colAEnd, colBEnd,   // colorEndA, colorEndB
    1, 1.5, 0,                     // time, sizeStart, sizeEnd
    .4, .95, gravity,                 // speed, damping, gravity
    .1, .5, false                   // fade, randomness, additive
  );
}
