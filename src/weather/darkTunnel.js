import { hsl, vec3, rgb, PI } from 'littlejsengine'
// tunnel - the atmosphere for a tunnel level (use with Tunnel.js, which builds the walls)
//
// Dark, warm light at the far end, fog that fades the tunnel into that light,
// a lens flare from the exit, and dust streaming past the camera.
// There are no stars, clouds or lightning: inside a tunnel there is no sky.

export default
  {
    name: 'darkTunnel',

    // The "horizon" color is what distant things fade into, so a bright warm
    // horizon makes the far end of the tunnel read as daylight.
    sky:
    {
      top: hsl(.58, .4, .03),
      horizon: hsl(.11, .65, .62),    // the light at the end
      bottom: hsl(.58, .4, .03),
      ambient: 1,
      ambientColor: rgb(.07, .08, .11),   // very little light except from the lamps
    },

    // Near things stay dark; the far tunnel melts into the bright exit.
    fog: { start: 20, end: 170 },

    // The exit is straight ahead: it drives the lens flare and lights things from behind
    sun:
    {
      direction: vec3(0, .06, -1),
      color: hsl(.11, .5, .3),
      pos: [0, 14, -230],
      glow: { size: 150, color: rgb(1, .85, .55, .9) },
      disc: { size: 26, color: rgb(1, .97, .85, 1) },
      flare: {
        size: .8, count: 6, intensity: .45, saturation: .25, color: hsl(.1, .6, .85),
        shapes: ['ring', 'glow', 'disc'], seed: 5
      },
    },

    // A weak warm fill from behind the camera so the runner and enemies stay readable
    lights:
      [
        { from: vec3(0, .25, 1), color: hsl(.09, .35, .5), intensity: .6 },
      ],

    sprites: [],
    layers: [],

    // Dust blown toward the camera by the run. The emitter's "up" is turned to
    // point along +Z, and it spawns in a box in front of the player.
    rain:
    {
      position: vec3(0, 4.5, -60),
      area: vec3(11, 7, 6),
      flat: false,                    // a volume, not a sheet
      rotation: vec3(PI / 2, 0, 0),
      rate: 90,
      lifetime: 3.5,
      speed: .3,                      // units per frame (18 per second at 60 fps)
      size: [.07, .05],
      colorStart: [rgb(1, .9, .7, .6), rgb(.9, .85, .8, .5)],
      colorEnd: [rgb(1, .9, .7, .1), rgb(.9, .85, .8, .05)],
      cone: .2,
      additive: true,
      streak: .06,
    },

    lightning: null,
    tunnel: true,
  };
