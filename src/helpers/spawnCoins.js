import {
  vec3, rand, clamp,
} from 'littlejsengine'

import Coin from '../sprites/coin';


export default function spawnCoins() {
  const patterns = [
    'straight',
    'left',
    'right',
    'jump',
    'arc'
  ];

  const pattern = patterns[rand(0, patterns.length) | 0];

  const count = 6;
  const spacing = 5;
  const startZ = -50;
  const startX = rand(-5, 5);

  for (let i = 0; i < count; i++) {
    let x = startX;
    let y = 1;

    switch (pattern) {
      case 'left':
        x -= i * 1.5;
        break;

      case 'right':
        x += i * 1.5;
        break;

      case 'jump':
        y += i * .45;
        break;

      case 'arc':
        y += Math.sin(i / (count - 1) * Math.PI) * 2.5;
        break;
    }

    // Keep coins within playable area
    x = clamp(x, -10, 10);

    const z = startZ - i * spacing;

    new Coin(vec3(x, y, z));
  }
}

