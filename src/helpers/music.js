import config from "../data/config";
import state from "../data/config";

export function playMusic(track, loop = true) {
  if (state.mute) return
  if (config.music) {
    config.music.pause();
    config.music.currentTime = 0;
  }

  if (!config.tracks[track]) {
    console.warn(`Track ${track} not found`);
    return;
  }

  config.music = config.tracks[track];
  config.music.loop = loop;
  config.music.volume = 0.1;

  config.music.play().catch((e) => {
    console.warn("Failed to play music:", e);
  });
}

export function stopMusic() {
  if (!config.music) return;
  config.music.pause();
}


export function restartMusic() {
  if (!config.music || state.mute) return;
  config.music.play();
}

export function toggleMusic() {
  if (!config.music) return;

  if (config.music.paused) {
    config.music
      .play()
      .catch((e) => console.warn("Failed to resume music:", e));
  } else {
    config.music.pause();
  }
}
