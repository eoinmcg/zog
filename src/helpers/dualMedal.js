import {
  WavedashMedal, newgrounds
} from 'littlejsengine'

export default class DualMedal extends WavedashMedal {
  constructor(a) {
    super(a.id, a.wd, a.name, a.desc, a.icon, a.src);
    this.ngId = a.ng;
  }
  unlock() {
    if (!this.unlocked && this.ngId && newgrounds)
      newgrounds.unlockMedal(this.ngId);
    return super.unlock(); // local save, plus the Wavedash achievement or the engine popup
  }
}
