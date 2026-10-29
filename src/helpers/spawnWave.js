import { rand } from "littlejsengine";
import { wavePatterns } from "../data/wavePatterns";
import Wave from '../sprites/wave';
import state from "../data/state";

export default function spawnWave(pattern = 'left', num = 5) {
  let id = rand().toString(36).substr(2, 9)
  pattern = pattern || Object.keys(wavePatterns).rnd()
  console.log(pattern, id)

  state.waves.set(id, { remaining: num });
  for (let i = 0; i < num; i += 1) {
    state.events.add(.5 * i, () => {
      new Wave(pattern, id)
    })
  }
}

