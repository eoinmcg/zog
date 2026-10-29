import { TimerSystem } from "../helpers/timer";
import equipment from "./equipment";
import { getItem } from "../helpers/store";

const createState = () => ({
  mute: false,
  plays: 0,
  score: 0,
  coins: 20,
  lives: 2,
  shake: 0,
  speed: 1,
  currentLevel: 1,
  level: {},
  waves: new Map(),
  player: null,
  gameOver: false,
  levelExitReached: false,
  hitStop: false,
  newHiscore: false,
  plays: getItem("plays", 0),
  hiScore: getItem("HiScore", 500),
  equipment: structuredClone(equipment),
  events: new TimerSystem(),
  fade: 0,
});


const state = createState();

export function resetState(keepEquipment = true) {
  const equipment = keepEquipment ? state.equipment : null

  Object.assign(state, createState())

  if (keepEquipment) {
    state.equipment = equipment
  }
}

export function resetEvents() {
  state.events = new TimerSystem()
}

export default state;
