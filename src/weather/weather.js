import {
  render3D, Light3D, vec3, vec2,
  TextureInfo, LensFlare3D, DirectionalLight3D,
  ParticleEmitter3D, timeDelta,
  isTouchDevice,
  EngineObject3D, buildBox,
  drawRect, mainCanvas, mainContext, mainCanvasSize,
  Color, BLACK, WHITE, rgb, hsl,
  drawText, drawTile, tile, PI, time
} from 'littlejsengine';

// Weather.js - a swappable weather / sky system for LittleJS 3D
//
// A "preset" (see weather/alienGreen.js) is plain data describing the sky,
// fog, sun, distant layers, rain and lightning. This class reads a preset and
// does all the work, so a new level only needs a new preset:
//
//   gameInit:           weather = new Weather(alienGreen);      // after new Render3DPlugin()
//   gameUpdate:         weather.update();
//   onRenderTransparent: weather.renderTransparent();
//   gameRenderPost:     weather.renderOverlay();
//   changing level:     weather.destroy(); weather = new Weather(otherPreset);
//
// Needs the LittleJS globals (render3D, rgb, vec2, vec3, timeDelta, ...).

const random = (min, max) => min + Math.random() * (max - min);

// ----------------------------------------------------------------------------
// Texture helpers. A "painter" is a function (g, width, height) that draws on
// a 2D canvas context. Presets can use these or bring their own.
// ----------------------------------------------------------------------------

export function makeTexture(painter, width, height) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  painter(canvas.getContext('2d'), width, height);
  return new TextureInfo(canvas);
}

export const painters =
{
  // Soft cloud blobs. `colorPrefix` is like 'rgba(110,255,190,'.
  // Each blob is drawn 3 times (x - w, x, x + w) so the image wraps
  // seamlessly when it scrolls.
  clouds: (colorPrefix, blobCount) => (g, w, h) => {
    for (let i = 0; i < blobCount; i++) {
      const x = random(0, w);
      const y = random(h * .3, h * .75);
      const radius = random(30, 90);
      for (const wrap of [-w, 0, w]) {
        const blob = g.createRadialGradient(x + wrap, y, 0, x + wrap, y, radius);
        blob.addColorStop(0, colorPrefix + '.85)');
        blob.addColorStop(1, colorPrefix + '0)');
        g.fillStyle = blob;
        g.fillRect(x + wrap - radius, y - radius, radius * 2, radius * 2);
      }
    }
  },

  // Scatter tiles from your loaded spritesheet along a strip, with random gaps.
  // `tiles` is a list of TileInfo, or a function returning one (use the function form in
  // a preset: tile() needs the engine started, and presets are imported before that).
  // Options: scale = canvas pixels per sheet pixel, spacing = [min, max] gap,
  // lift = [min, max] raise above the bottom, flip = randomly mirror tiles.
  tiles: (tiles, { scale = 4, spacing = [0, 8], lift = [0, 0], flip = true } = {}) => (g, w, h) => {
    const list = typeof tiles === 'function' ? tiles() : tiles;
    g.imageSmoothingEnabled = false;                    // keep pixel art sharp
    for (let x = random(0, spacing[1]); x < w;) {
      const t = list[Math.floor(Math.random() * list.length)];
      const image = t.textureInfo.image;
      const dw = t.size.x * scale, dh = t.size.y * scale;
      const y = h - dh - random(lift[0], lift[1]);
      const mirror = flip && Math.random() < .5;
      g.save();
      g.translate(mirror ? x + dw : x, y);
      g.scale(mirror ? -1 : 1, 1);
      g.drawImage(image, t.pos.x, t.pos.y, t.size.x, t.size.y, 0, 0, dw, dh);
      g.restore();
      x += dw + random(spacing[0], spacing[1]);
    }
  },

  // Tiny stars, denser high in the sky; a few big ones get a soft glow.
  stars: (count = 750) => (g, w, h) => {
    for (let i = 0; i < count; i++) {
      const x = random(0, w);
      const y = h * Math.pow(Math.random(), 1.2);
      const big = Math.random() < .04;
      const hue = [215, 50, 0][Math.floor(Math.random() * 3)];
      g.fillStyle = `hsla(${hue}, ${random(30, 70)}%, ${random(80, 100)}%, ${random(.45, 1)})`;
      g.beginPath();
      g.arc(x, y, big ? random(1.6, 2.4) : random(.5, 1.2), 0, Math.PI * 2);
      g.fill();
      if (big) {
        const halo = g.createRadialGradient(x, y, 0, x, y, 10);
        halo.addColorStop(0, 'rgba(200,220,255,.5)');
        halo.addColorStop(1, 'rgba(200,220,255,0)');
        g.fillStyle = halo;
        g.fillRect(x - 10, y - 10, 20, 20);
      }
    }
  },

  // White soft dot, tinted when drawn. Used for glows.
  glow: () => (g, w, h) => {
    const gradient = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    gradient.addColorStop(0, 'rgba(255,255,255,1)');
    gradient.addColorStop(.3, 'rgba(255,255,255,.35)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gradient;
    g.fillRect(0, 0, w, h);
  },

  // Plain lit disc, for moons and the sun's bright center
  moon: (inner = '#ffffff', outer = '#7bd8ff') => (g, w, h) => {
    const gradient = g.createRadialGradient(w * .37, h * .37, 2, w / 2, h / 2, w / 2);
    gradient.addColorStop(0, inner);
    gradient.addColorStop(1, outer);
    g.fillStyle = gradient;
    g.beginPath();
    g.arc(w / 2, h / 2, w / 2 - 2, 0, Math.PI * 2);
    g.fill();
  },
};


// ----------------------------------------------------------------------------
// Weather
// ----------------------------------------------------------------------------

export default class Weather {
  constructor(preset) {
    this.preset = preset;
    this.destroyed = false;
    render3D.weatherOwner = this;       // so an old weather's destroy() cannot wipe a newer one's sky
    this.time = 0;                      // drives cloud drift
    this.flash = 0;                     // lightning flash strength, 1 -> 0

    this.setupSky(preset);
    this.setupLayers(preset);
    this.setupLights(preset.lights);
    this.setupRain(preset.rain);
    this.setupScreenRain(preset.screenRain);
    this.setupMeteors(preset.meteors);
    this.onImpact = null;               // optional: weather.onImpact = (strength) => { ...shake the camera... }
    this.setupLightning(preset.lightning);
    this.hasTunnel = preset.tunnel;
    this.name = preset.name;
  }

  // ---- sky dome, fog, sun light, lens flare -------------------------------
  setupSky(preset) {
    const { sky, fog, sun } = preset;

    // `sky`, `fog` and `sun` are all optional: leave one out and the scene keeps whatever it
    // already has (so a scene can use only meteors or embers on top of its own sky).

    // gradient dome. It also sets the fog color and ambient light.
    if (sky) {
      render3D.setSky(sky.top, sky.horizon, sky.bottom, sky.ambient);
      // optional: set the ambient light directly, for scenes whose sky is too dark to derive it from
      if (sky.ambientColor) render3D.ambientColor = sky.ambientColor.copy();
      if (sky.ambientGround) render3D.ambientGroundColor = sky.ambientGround.copy();
    }
    if (fog) render3D.setFog(fog.start, fog.end);

    // sunDirection points TOWARD the sun. It lights the scene and also
    // places the lens flare.
    if (sun) {
      render3D.sunDirection = sun.direction;
      render3D.sunColor = sun.color;
    }

    // remember the normal lights, so a lightning flash can return to them
    this.baseAmbient = render3D.ambientColor.copy();
    this.baseSun = render3D.sunColor.copy();

    this.glowTexture = makeTexture(painters.glow(), 128, 128);
    // the bright disc can be a custom painter (e.g. a cratered moon) at its own texture size
    const disc = sun?.disc;
    if (disc) {
      const size = disc.texSize ?? 64;
      this.sunDiscTexture = disc.tile
        ? (typeof disc.tile === 'function' ? disc.tile() : disc.tile)
        : makeTexture(disc.paint ?? painters.moon(disc.inner, disc.outer), size, size);
    }

    const flare = sun?.flare;
    this.flare = flare ? new LensFlare3D(flare.size, flare.count, flare.intensity, flare.saturation, flare.color) : undefined;
    if (this.flare) {
      this.flare.shapes = flare.shapes;
      this.flare.seed = flare.seed ?? 1;
    }
  }

  // ---- extra lights: directional fills that light things independently of the sun
  //      (the sun's direction also places the flare, so it can't always be the best light)
  setupLights(lights) {
    this.lights = (lights || []).map(light => new DirectionalLight3D(light.from, light.color, light.intensity ?? 1));
  }

  // ---- scrolling layers and fixed sprites, each with its own texture -------
  setupLayers(preset) {
    // Either `tile` (a TileInfo, or a function returning one) to draw straight from the
    // loaded spritesheet, or `paint` (a canvas painter) with texWidth / texHeight.
    const build = (item) => ({
      ...item, texture: item.tile
        ? (typeof item.tile === 'function' ? item.tile() : item.tile)
        : makeTexture(item.paint, item.texWidth, item.texHeight)
    });
    this.layers = (preset.layers || []).map(build);     // wide, repeating, may drift
    this.sprites = (preset.sprites || []).map(build);   // single billboards (planet, moons)
  }

  // ---- rain: one particle emitter above the road ---------------------------
  setupRain(rain) {
    if (!rain || isTouchDevice) return;
    this.rain = new ParticleEmitter3D(
      rain.position,                  // center of the spawn area
      rain.area,                      // size of the spawn area (vec3)
      0,                              // emit forever
      rain.rate,                      // drops per second
      rain.cone ?? .02,               // spread angle: almost straight by default
      undefined,                      // plain particles, no sprite
      rain.colorStart[0], rain.colorStart[1],
      rain.colorEnd[0], rain.colorEnd[1],
      rain.lifetime,
      rain.size[0], rain.size[1],     // size at start / end
      rain.speed,
      1, 0, .15, .1,
      rain.additive ?? false);                        // true = glowing particles
    this.rain.emitFlat = rain.flat ?? true;             // spawn on a flat sheet (false = a box)
    // The emitter shoots along its own "up". Default: flipped to shoot down, slanted by `tilt`.
    // A preset can pass its own `rotation` instead (e.g. sideways for blowing sand).
    this.rain.rotation3D = rain.rotation ?? vec3(PI - (rain.tilt || 0), 0, 0);
    this.rain.trailTime = rain.streak || 0;              // draw as short streaks (0 = plain dots)
  }

  // ---- screen-space particles: rain, sand or spores on the 2D overlay -------
  // The 3D emitter lives in the world, so it slides sideways when the camera follows the
  // player. These are drawn on the screen itself, so the camera cannot move them.
  // Preset `screenRain` (all optional except rate, life, speed, colors):
  //   rate       particles per second
  //   life       seconds each one lives (it fades in and out)
  //   direction  angle in radians: 0 = straight down, PI/2 = to the right, PI = straight up
  //   speed      [slow, fast] in screen heights per second; bigger ones are faster (depth feel)
  //   length     [short, long] streak length in screen heights, [0, 0] = round glowing dots
  //   size       [small, big] width of a streak / diameter of a dot, in pixels at 540p
  //   colors     [colorA, colorB], each particle picks a mix of the two
  //   alpha      overall opacity
  //   additive   true = glow
  //   wobble     sideways sway, in screen heights per second
  setupScreenRain(config) {
    this.screenRain = config;
    this.screenParticles = [];
    this.spawnCarry = 0;
    if (!config) return;

    // 8 colors between the two preset colors, as css strings and as pre-drawn soft dots
    this.screenColors = [];
    this.dotSprites = [];
    for (let i = 0; i < 8; i++) {
      const c = config.colors[0].lerp(config.colors[1], i / 7);
      const rgbText = `${Math.round(c.r * 255)},${Math.round(c.g * 255)},${Math.round(c.b * 255)}`;
      this.screenColors.push(`rgb(${rgbText})`);

      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = 64;
      const g = canvas.getContext('2d');
      const dot = g.createRadialGradient(32, 32, 0, 32, 32, 32);
      dot.addColorStop(0, `rgba(${rgbText},1)`);
      dot.addColorStop(.4, `rgba(${rgbText},.35)`);
      dot.addColorStop(1, `rgba(${rgbText},0)`);
      g.fillStyle = dot;
      g.fillRect(0, 0, 64, 64);
      this.dotSprites.push(canvas);
    }
  }

  spawnScreenParticle() {
    const config = this.screenRain;
    const aspect = mainCanvasSize.x / mainCanvasSize.y;
    const depth = Math.random();                        // 0 = far and small, 1 = near and big
    const mix = (range) => range[0] + (range[1] - range[0]) * depth;
    const speed = mix(config.speed);
    this.screenParticles.push({
      x: random(-.1, aspect + .1),                    // positions are in screen heights
      y: random(-.1, 1.1),
      speed,
      vx: Math.sin(config.direction) * speed,
      vy: Math.cos(config.direction) * speed,
      length: config.length ? mix(config.length) : 0,
      size: mix(config.size),
      color: Math.floor(Math.random() * 8),
      life: config.life * random(.7, 1.2),
      age: 0,
      phase: random(0, 6.28),
    });
  }

  updateScreenRain(dt) {
    const config = this.screenRain;
    if (!config) return;
    dt = Math.min(dt, .1);                              // no burst after a paused tab

    this.spawnCarry += config.rate * dt;
    while (this.spawnCarry >= 1) {
      this.spawnCarry--;
      this.spawnScreenParticle();
    }

    let alive = 0;                                      // move and compact in place
    for (const p of this.screenParticles) {
      p.age += dt;
      if (p.age >= p.life) continue;
      p.x += p.vx * dt + (config.wobble ? Math.sin(p.age * 2 + p.phase) * config.wobble * dt : 0);
      p.y += p.vy * dt;
      this.screenParticles[alive++] = p;
    }
    this.screenParticles.length = alive;
  }

  drawScreenRain() {
    const config = this.screenRain;
    if (!config) return;

    const height = mainCanvasSize.y;
    const scale = height / 540;
    const ctx = mainContext;
    ctx.save();
    ctx.globalCompositeOperation = config.additive ? 'lighter' : 'source-over';
    ctx.lineCap = 'round';

    for (const p of this.screenParticles) {
      const k = p.age / p.life;
      ctx.globalAlpha = (config.alpha ?? 1) * Math.min(1, k / .12, (1 - k) / .25);   // fade in and out
      const x = p.x * height, y = p.y * height;

      if (p.length > 0)                               // a streak, trailing behind its motion
      {
        ctx.strokeStyle = this.screenColors[p.color];
        ctx.lineWidth = p.size * scale;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x - p.vx / p.speed * p.length * height, y - p.vy / p.speed * p.length * height);
        ctx.stroke();
      }
      else                                            // a soft glowing dot
      {
        const d = p.size * scale;
        ctx.drawImage(this.dotSprites[p.color], x - d / 2, y - d / 2, d, d);
      }
    }
    ctx.restore();
  }

  // ---- meteors: streaks across the sky, some burn out, some hit the horizon ---
  // Preset `meteors`:
  //   rate          single random streaks per second (0 = only showers)
  //   burst         { every: [min, max] seconds, count: [min, max], spread: seconds } a shower
  //   z             [near, far] distance band the meteors fly in
  //   speed         [slow, fast] world units per second
  //   size          [small, big] head size
  //   trail         [short, long] trail length in seconds
  //   colors        [colorA, colorB], each meteor picks a mix
  //   impactChance  0..1 chance a meteor falls all the way to the horizon and hits
  //   flashColor, flashAlpha  full-screen tint on an impact (scaled by its size)
  //   boom          zzfx parameters for the sound after an impact, or null
  // On an impact the game can react (camera shake): weather.onImpact = (strength) => ...
  setupMeteors(config) {
    this.meteors = [];
    this.impacts = [];
    this.booms = [];
    this.impactFlash = 0;
    if (!config) return;
    this.timeToNextMeteor = config.rate ? -Math.log(Math.random()) / config.rate : Infinity;
    this.timeToNextBurst = config.burst ? random(...config.burst.every) : Infinity;
  }

  // `delay` = seconds until it appears, `forceImpact` = true/false to decide instead of chance
  spawnMeteor(delay = 0, forceImpact) {
    const config = this.preset.meteors;
    const direction = Math.random() < .5 ? -1 : 1;              // flies left or right
    const startY = random(60, 130);
    const impact = forceImpact ?? Math.random() < config.impactChance;
    const dx = direction * random(60, 170);
    const dy = impact ? -startY + random(0, 3)                  // all the way down to the horizon
      : -Math.min(random(40, 90), startY - 20); // or burns out partway
    const speed = random(...config.speed);
    const duration = Math.hypot(dx, dy) / speed;
    const z = random(...config.z);
    // an impact lands somewhere on screen (visible half width is roughly 0.45 x distance);
    // a meteor that burns out just starts anywhere to the side
    const x0 = impact ? random(-.4, .4) * -z - dx : -direction * random(40, 150);
    this.meteors.push({
      x0, y0: startY, z,
      vx: dx / duration, vy: dy / duration,
      t: -delay, duration, impact,
      size: random(...config.size), trail: random(...config.trail),
      color: config.colors[0].lerp(config.colors[1], Math.random()),
    });
  }

  updateMeteors(dt) {
    const config = this.preset.meteors;
    if (!config) return;

    this.timeToNextMeteor -= dt;
    if (this.timeToNextMeteor <= 0) {
      this.spawnMeteor();
      this.timeToNextMeteor = -Math.log(Math.random()) / config.rate;
    }
    this.timeToNextBurst -= dt;
    if (this.timeToNextBurst <= 0)                              // a shower: several streaks close together
    {
      const count = Math.round(random(...config.burst.count));
      for (let i = 0; i < count; i++) this.spawnMeteor(random(0, config.burst.spread));
      this.timeToNextBurst = random(...config.burst.every);
    }

    for (const meteor of this.meteors) {
      meteor.t += dt;
      if (meteor.t < meteor.duration || meteor.done) continue;
      meteor.done = true;
      if (!meteor.impact) continue;

      // it hit: a flash on the horizon, a screen tint, the game's camera shake and a late boom
      const strength = Math.min(1, meteor.size / config.size[1]);
      this.impacts.push({ x: meteor.x0 + meteor.vx * meteor.duration, y: 3, z: meteor.z, t: 0, size: meteor.size, color: meteor.color });
      this.impactFlash = Math.max(this.impactFlash, .5 + .5 * strength);
      this.onImpact?.(strength);
      if (config.boom) this.booms.push({ delay: random(.3, 1.1) });
    }
    this.meteors = this.meteors.filter(meteor => !meteor.done);

    for (const impact of this.impacts) impact.t += dt;
    this.impacts = this.impacts.filter(impact => impact.t < .9);

    this.impactFlash = Math.max(0, this.impactFlash - dt * 3);
    for (const boom of this.booms) {
      boom.delay -= dt;
      // if (boom.delay < 0) zzfx(...config.boom);
    }
    this.booms = this.booms.filter(boom => boom.delay >= 0);
  }

  drawMeteors() {
    if (!this.preset.meteors) return;
    const glow = this.glowTexture;
    render3D.additive = true;                                   // light adds to the sky

    for (const m of this.meteors) {
      if (m.t < 0) continue;                                  // not appeared yet
      const fade = Math.min(1, m.t / .15) * (m.impact ? 1 : Math.min(1, (m.duration - m.t) / .5));
      const at = (t) => vec3(m.x0 + m.vx * t, m.y0 + m.vy * t, m.z);

      // trail: short ribbon pieces, fainter and thinner toward the tail
      const steps = 8, step = m.trail / steps;
      for (let k = 0; k < steps; k++) {
        const t0 = Math.max(0, m.t - k * step), t1 = Math.max(0, m.t - (k + 1) * step);
        if (t0 === t1) break;
        const alpha = Math.pow(1 - k / steps, 1.5) * fade * .8;
        render3D.drawRibbon([at(t0), at(t1)], m.size * 2.6 * (1 - k / steps * .8), undefined, rgb(m.color.r, m.color.g, m.color.b, alpha));
      }
      const head = at(m.t);
      render3D.drawBillboard(head, vec2(m.size * 10), glow, rgb(m.color.r, m.color.g, m.color.b, .7 * fade));
      render3D.drawBillboard(head, vec2(m.size * 3.2), glow, rgb(1, 1, .9, fade));
    }

    for (const impact of this.impacts)                          // a bloom on the horizon that swells and fades
    {
      const k = impact.t / .9;
      const alpha = (1 - k) * (1 - k);
      const c = impact.color;
      // a column of light shooting up from the horizon (so it shows above the mountains),
      // with a bloom that swells and fades at its base
      const base = vec3(impact.x, 0, impact.z), top = vec3(impact.x, 55 + 35 * k, impact.z);
      render3D.drawRibbon([base, top], impact.size * 7 * (1 - k * .6), undefined, rgb(c.r, c.g, c.b, alpha * .45));
      render3D.drawRibbon([base, top], impact.size * 2.2 * (1 - k * .6), undefined, rgb(1, 1, .9, alpha * .8));
      render3D.drawBillboard(vec3(impact.x, 12, impact.z), vec2(impact.size * (30 + 60 * k)), glow, rgb(c.r, c.g, c.b, alpha));
      render3D.drawBillboard(vec3(impact.x, 12, impact.z), vec2(impact.size * (12 + 24 * k)), glow, rgb(1, 1, .9, alpha));
    }
    render3D.additive = false;
  }

  // ---- lightning -----------------------------------------------------------
  setupLightning(lightning) {
    this.bolt = [];                     // list of { points, width }
    this.boltTimeLeft = 0;
    this.thunderDelay = -1;             // -1 = no thunder pending
    if (!lightning) return;
    this.timeToNextBolt = random(lightning.minDelay, lightning.maxDelay);
  }

  makeBolt() {
    const config = this.preset.lightning.bolt;
    const z = random(config.z[0], config.z[1]);
    let x = random(config.x[0], config.x[1]);
    let y = config.top;
    this.bolt = [];

    // main trunk: zig-zag from the clouds to the ground
    const trunk = [];
    while (y > 0) {
      trunk.push(vec3(x, y, z));
      x += random(-9, 9);
      y -= random(7, 14);
    }
    trunk.push(vec3(x, 0, z));
    this.bolt.push({ points: trunk, width: 1.6 });

    // branches: start on the trunk, drift sideways while going down
    for (let i = 1; i < trunk.length - 1; i += 2) {
      if (Math.random() > .6) continue;
      const branch = [trunk[i]];
      let bx = trunk[i].x;
      let by = trunk[i].y;
      const direction = Math.random() < .5 ? -1 : 1;
      for (let k = 0; k < 4; k++) {
        bx += direction * random(3, 10);
        by -= random(5, 12);
        branch.push(vec3(bx, by, z));
      }
      this.bolt.push({ points: branch, width: .7 });
    }

    this.boltTimeLeft = .45;
    this.flash = 1;
    if (this.preset.lightning.thunder)
      this.thunderDelay = random(.3, .9);             // sound lags the light
  }

  // ---- call every frame from gameUpdate ------------------------------------
  update() {
    if (this.destroyed) return;
    const dt = timeDelta;
    const lightning = this.preset.lightning;
    this.time += dt;
    this.updateScreenRain(dt);
    this.updateMeteors(dt);

    if (lightning) {
      this.timeToNextBolt -= dt;
      if (this.timeToNextBolt <= 0) {
        this.makeBolt();
        this.timeToNextBolt = random(lightning.minDelay, lightning.maxDelay);
      }
      this.boltTimeLeft -= dt;
      this.flash = Math.max(0, this.flash - dt * lightning.flashDecay);

      if (this.thunderDelay >= 0) {
        this.thunderDelay -= dt;
        // if (this.thunderDelay < 0) zzfx(...lightning.thunder);

      }

      // brighten the scene lights while flashing, then fade back
      const amount = this.flash * .7;
      render3D.ambientColor = this.baseAmbient.lerp(lightning.flashColor, amount);
      render3D.sunColor = this.baseSun.lerp(rgb(1, 1, 1.3), amount);
    }
  }

  // ---- call from render3D.onRenderTransparent -----------------------------
  renderTransparent() {
    if (this.destroyed) return;         // a callback may still call this after destroy()
    const { sun, lightning } = this.preset;
    const brighten = this.flash * .5;           // layers get brighter in a flash
    const tint = ([r, g, b, a]) => rgb(r + brighten, g + brighten, b + brighten, a);

    render3D.blend = true;

    // fixed sprites: planet, moons, galaxy ...
    // optional `spin` = rotation speed in radians per second (positive = counter clockwise)
    for (const sprite of this.sprites)
      render3D.drawBillboard(vec3(...sprite.pos), vec2(...sprite.size), sprite.texture, tint(sprite.tint),
        (sprite.angle || 0) + (sprite.spin || 0) * this.time);

    // scrolling layers: three copies side by side so the screen is always
    // covered; the offset makes them drift (scroll = 0 keeps them still)
    for (const layer of this.layers) {
      const offset = (this.time * layer.scroll) % layer.w;
      for (let i = -2; i <= 1; i++)
        render3D.drawBillboard(vec3(i * layer.w + offset, layer.y, layer.z),
          vec2(layer.w, layer.h), layer.texture, tint(layer.tint));
    }

    // sun: big soft glow behind a small bright disc
    if (sun?.pos && sun.glow)
      render3D.drawBillboard(vec3(...sun.pos), vec2(sun.glow.size, sun.glow.size), this.glowTexture, sun.glow.color);
    if (sun?.pos && sun.disc)
      render3D.drawBillboard(vec3(...sun.pos), vec2(sun.disc.size, sun.disc.size), this.sunDiscTexture, sun.disc.color);

    // lightning bolt: additive blending so it glows
    if (lightning && this.boltTimeLeft > 0) {
      const fade = Math.min(1, this.boltTimeLeft * 4);
      const alpha = fade * (Math.random() < .8 ? 1 : .4);     // random flicker
      const withAlpha = (color, a) => rgb(color.r, color.g, color.b, a);

      render3D.additive = true;
      render3D.drawBillboard(this.bolt[0].points[0], vec2(260, 200), this.glowTexture,
        withAlpha(lightning.haloColor, .5 * alpha));
      for (const part of this.bolt) {
        render3D.drawRibbon(part.points, part.width * 5, undefined, withAlpha(lightning.glowColor, .25 * alpha));
        render3D.drawRibbon(part.points, part.width, undefined, withAlpha(lightning.coreColor, alpha));
      }
      render3D.additive = false;
    }

    this.drawMeteors();

    render3D.blend = false;
  }

  // ---- call from gameRenderPost: full-screen tint during a flash -----------
  renderOverlay() {
    if (this.destroyed) return;
    this.drawScreenRain();                              // screen-space rain / spores, if the preset has them

    const meteors = this.preset.meteors;                // brief tint when a meteor hits
    if (meteors && this.impactFlash > 0) {
      const c = meteors.flashColor;
      drawRect(mainCanvasSize.scale(.5), mainCanvasSize, rgb(c.r, c.g, c.b, this.impactFlash * (meteors.flashAlpha ?? .2)), 0, false, true);
    }
    const lightning = this.preset.lightning;
    if (!lightning || this.flash <= 0) return;
    const c = lightning.flashColor;
    // screen space: pos and size are in pixels, so center on the canvas and cover all of it
    drawRect(mainCanvasSize.scale(.5), mainCanvasSize, rgb(c.r, c.g, c.b, this.flash * lightning.overlayAlpha), 0, false, true);
  }

  // ---- call when leaving the level: removes the weather completely ---------
  // Afterwards nothing of it is drawn, even if your render callbacks still call it, and the
  // 3D renderer is back to its defaults (no sky dome, no fog, plain lighting), unless a
  // newer Weather has already taken over, in which case only this one's objects are removed.
  destroy() {
    if (this.destroyed) return;
    this.destroyed = true;

    // objects in the world
    this.rain?.destroy(true);           // true = immediately, without letting the last drops fall
    this.flare?.destroy();
    this.lights?.forEach(light => light.destroy());
    this.rain = this.flare = undefined;
    this.lights = [];

    // everything drawn by this class
    this.layers = [];
    this.sprites = [];
    this.screenParticles = [];
    this.screenRain = undefined;
    this.meteors = [];
    this.impacts = [];
    this.booms = [];
    this.bolt = [];
    this.impactFlash = this.flash = 0;
    this.onImpact = null;

    // the shared 3D renderer, only if it still belongs to us
    if (render3D.weatherOwner === this) {
      render3D.weatherOwner = undefined;
      render3D.sky?.dispose();
      render3D.sky = undefined;                       // no sky dome
      render3D.fogColor = undefined;                  // no fog
      render3D.fogStart = render3D.fogEnd = 0;
      render3D.sunDirection = vec3(-.3, 1, .5);       // the plugin's own defaults
      render3D.sunColor = WHITE.copy();
      render3D.ambientColor = hsl(0, 0, .3);
      render3D.ambientGroundColor = undefined;
    }
    // (textures are plain canvases and are garbage collected)
  }
}
