import {
  EngineObject3D, render3D, Light3D, buildExtrude,
  vec2, vec3, drawText, drawRect, tile, sin, time,
  engineImageFont, Color, BLACK, isTouchDevice,
} from "littlejsengine";

import Scene from "./scene";
import config from "../data/config";
import state from "../data/state";
import { boom, buy } from "../helpers/particles";

const OPTIONS = {
  jetpack: {
    name: 'JetPack',
    equipment: 'jetpack',
    props: { tile: 24, size: 1, extrude: .2 },
    mesh: null,
    model: null,
    pos: vec3(-4.5, 0, 0),
    textPos: vec2(-12, 3),
  },
  raygun: {
    name: 'RayGun',
    equipment: 'raygun',
    props: { tile: 8, size: 1.4, extrude: .2 },
    mesh: null,
    model: null,
    pos: vec3(0, 0, 0),
    textPos: vec2(0, 3),
  },
  surprise: {
    name: 'Surprise!',
    props: { tile: 27, size: 1, extrude: .8 },
    mesh: null,
    model: null,
    pos: vec3(4.5, 0, 0),
    textPos: vec2(12, 3)
  },
}

export default class Shop extends Scene {

  enter() {
    super.enter()

    this.initItems()

    const navy = config.palette.navy.col;
    const plum = config.palette.plum.col;
    const black = config.palette.black.col;

    new Light3D(vec3(5, 5, 5), 25, new Color(1, 1, 1));
    render3D.setSky(black, navy, plum, .5);
    render3D.camera.pos = vec3(0, 0, 8);
    render3D.camera.lookAt(vec3(0));

    this.active = 0
    this.exitSelected = false
    this.finished = false
  }

  update() {
    super.update()

    this.handleInput()
    this.rotateModels()

    const maxOptions = this.items.length - 1

    if (this.active < 0) this.active = maxOptions
    if (this.active > maxOptions) this.active = 0
  }

  render() {
    const text = 'ZOGGYS DODGY MERCH'
    drawText(text, vec2(0, 9.9), 2, BLACK)
    drawText(text, vec2(0, 10), 2)

    const font = engineImageFont;
    const numCoins = state.coins.toString().padStart(3, '0')
    font.drawText('COINS: ' + numCoins, vec2(0, 6.9), .8, true, config.palette.black.col)
    font.drawText('COINS: ' + numCoins, vec2(0, 7), .8, true, config.palette.yellow.col)

    const activeCol = config.palette.red.col,
      col = config.palette.gray.col

    this.items.forEach((o, i) => {
      const selected = !this.exitSelected && i === this.active;

      if (selected) {
        drawRect(o.textPos.add(vec2(0, -3.5)), vec2(8, 10), config.palette.black.mk(.1));
      }

      font.drawText(o.name.toUpperCase(), o.textPos.add(vec2(0, -.1)), .7, true, BLACK)
      font.drawText(o.name.toUpperCase(), o.textPos, .7, true, selected ? activeCol : col)
      this.drawUpgradeBar(o)
    })

    const exitCol = this.exitSelected ? activeCol : col
    const exitPos = vec2(0, -6)

    if (this.exitSelected) {
      drawRect(exitPos, vec2(8, 1.5), config.palette.black.mk(.3))
    }

    font.drawText('EXIT', exitPos.add(vec2(0, -.1)), .8, true, BLACK)
    font.drawText('EXIT', exitPos, .8, true, exitCol)

    const uiHint = isTouchDevice
      ? this.exitSelected
        ? 'SWIPE UP: CANCEL | TAP: EXIT'
        : 'SWIPE L&R: SELECT | DOWN: EXIT | TAP: BUY'
      : this.exitSelected
        ? 'UP: CANCEL | ENTER: EXIT'
        : 'LEFT/RIGHT: SELECT | DOWN: EXIT | ENTER: BUY';

    engineImageFont.drawText(uiHint, vec2(0, -9), .6, true, config.palette.grass.col);
  }

  drawUpgradeBar(o) {
    if (o.stats?.current === undefined || !o.stats.max) return

    const size = vec2(1.4, .35)
    const gap = .15
    const width = o.stats.max * size.x + (o.stats.max - 1) * gap
    const start = o.textPos.x - width / 2 + size.x / 2
    const y = o.textPos.y - 7

    for (let i = 0; i < o.stats.max; i++) {
      const pos = vec2(start + i * (size.x + gap), y)
      const col = i < o.stats.current
        ? config.palette.grass.col
        : config.palette.gray.col

      drawRect(pos, size, col)
    }
  }
  handleInput() {
    if (this.finished) return
    this.handleUiInput();

    if (this.uiInput === 'left') {
      if (this.exitSelected) {
        this.exitSelected = false
      } else {
        this.active -= 1
      }
      config.sfx.play('walk')
    } else if (this.uiInput === 'right') {
      if (this.exitSelected) {
        this.exitSelected = false
      } else {
        this.active += 1
      }
      config.sfx.play('walk')
    } else if (this.uiInput === 'down') {
      this.exitSelected = true
      config.sfx.play('walk')
    }
    else if (this.uiInput === 'up') {
      this.exitSelected = false
      config.sfx.play('walk')
    } else if (this.uiInput === 'enter') {
      if (this.exitSelected) {
        config.sceneManager.changeScene('Play');
      } else {
        this.handlePurchase()
      }
    }

  }

  handlePurchase() {
    const o = this.items[this.active]
    const cost = 10

    if (this.finished) return

    if (state.coins < cost) {
      config.sfx.play('blip')
      return
    }

    if (o.name === 'Surprise!') {
      this.purchaseSurprise(o, cost)
      return
    }

    if (!o.stats || o.stats.current >= o.stats.max) {
      config.sfx.play('blip')
      return
    }

    state.coins -= cost
    o.stats.current += 1
    o.stats.owned = true
    config.sfx.play('score')
    buy(o.pos)
  }

  purchaseSurprise(o, cost) {
    state.coins -= cost
    config.sfx.play('smash')
    boom(o.pos, 0)

    let tileIndex

    if (!state.equipment.glasses.owned) {
      state.equipment.glasses.owned = true
      o.name = 'sunglasses'
      tileIndex = state.equipment.glasses.tile
    } else {
      const hats = state.equipment.hat.tiles
      const available = hats.filter((i) => i !== state.equipment.hat.tile)

      if (!available.length) return

      const index = Math.floor(Math.random() * available.length)
      tileIndex = available[index]
      o.name = 'new hat'
      state.equipment.hat.tile = tileIndex
    }

    o.mesh = buildExtrude(
      tile(tileIndex, config.tileSize),
      vec2(1),
      .2
    )

    o.model.mesh = o.mesh
  }
  rotateModels() {
    this.items.forEach((o, i) => {
      if (!o.model) return
      const selected = !this.exitSelected && i === this.active;
      o.model.rotation3D.y += selected ? .02 : .005
    })
  }

  initItems() {
    this.items = Object.values(OPTIONS).map((o) => {
      const mesh = buildExtrude(
        tile(o.props.tile, config.tileSize),
        vec2(o.props.size),
        o.props.extrude
      )

      return {
        ...o,
        mesh,
        model: new EngineObject3D(o.pos, mesh),
        stats: o.equipment ? state.equipment[o.equipment] : null
      }
    })
  }

}
