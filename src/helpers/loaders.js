import { parseGLTF } from "littlejsengine";
import config from "../data/config";

const loadingDiv = document.querySelector(".loading");
const progressDiv = document.querySelector(".progress");

export async function preloadAudio(callback) {
  const trackPaths = config.trackPaths;
  config.tracks = [];
  config.audioLoaded = 0;

  if (!trackPaths.length) {
    if (loadingDiv && loadingDiv.parentNode) {
      loadingDiv.parentNode.removeChild(loadingDiv);
    }
    if (callback) callback();
    return;
  }

  trackPaths.forEach((trackPath, i) => {
    const audio = new Audio();
    audio.preload = "auto";
    audio.src = 'music/' + trackPath;

    audio.addEventListener(
      "canplaythrough",
      () => {
        config.audioLoaded += 1;
        const progress = (config.audioLoaded / trackPaths.length) * 100;
        progressDiv.style.width = `${progress}%`;

        if (config.audioLoaded === trackPaths.length) {
          config.tracksReady = true;
          if (loadingDiv && loadingDiv.parentNode) {
            loadingDiv.parentNode.removeChild(loadingDiv);
          }
          if (callback) callback();
        }
      },
      { once: true },
    ); // Remove listener after firing once

    audio.addEventListener(
      "error",
      (e) => {
        console.error(`Failed to load ${trackPath}:`, e);
        config.audioLoaded += 1; // Count as loaded to prevent hanging
        const progress = (config.audioLoaded / trackPaths.length) * 100;
        progressDiv.style.width = `${progress}%`;

        if (config.audioLoaded === trackPaths.length) {
          if (callback) callback();
        }
      },
      { once: true },
    );

    audio.load();
    config.tracks[i] = audio;
  });
}

export async function preloadModels(models) {
  const loaded = {}
  for (const model of models) {
    const file = await fetch(`models/${model}`)
    if (!file.ok) throw new Error(`HTTP ${file.status}`)
    const buffer = await file.arrayBuffer()
    const gltf = await parseGLTF(buffer)
    loaded[model.replace('.glb', '')] = gltf
  }

  return loaded;
}

export async function preloadFont(font) {
  font = font || config.font
  const fontFace = new FontFace(font, `url('${font}.ttf')`);
  await fontFace.load();
  document.fonts.add(fontFace);
  document.body.style.fontFamily = `"${font}", monospace`;

}

