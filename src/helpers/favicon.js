import { textureInfos } from "littlejsengine";
import config from '../data/config';

export default function favIcon(tile = 2) {
  const size = config.tileSize;
  const image = textureInfos[0].image;
  const cols = image.width / size;

  const x = (tile % cols) * size;
  const y = Math.floor(tile / cols) * size;

  const c = document.createElement('canvas');
  const ctx = c.getContext('2d');

  c.width = c.height = 16;
  ctx.imageSmoothingEnabled = false;

  ctx.drawImage(image, x, y, size, size, 0, 0, 16, 16);

  document.head.appendChild(Object.assign(
    document.createElement('link'),
    { rel: 'icon', href: c.toDataURL() }
  ));
}
