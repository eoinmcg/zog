import { rand } from 'littlejsengine';

export function updateLevelPhases(level, dt, spawners) {

  if (!level.phases) return

  for (const phase of level.phases) {
    const elapsed = level.percentComplete;

    if (elapsed < phase.start) { continue; }

    if (phase.end !== undefined && elapsed >= phase.end) {
      continue;
    }

    // One-time events: alert, boss, etc.
    if (!phase.freq) {

      if (phase.triggered) {
        continue;
      }

      phase.triggered = true;

      spawnPhaseType(phase, spawners);
      continue;
    }

    // Repeating phases
    phase.timer -= dt;

    if (phase.timer <= 0) {
      spawnPhaseType(phase, spawners);
      phase.timer = rand(phase.freq[0], phase.freq[1]);
    }
  }
}

function spawnPhaseType(phase, spawners) {

  const type = phase.types[
    Math.floor(rand(phase.types.length))
  ];

  const spawn = spawners[type];

  if (!spawn) {
    console.warn(`Unknown spawn type: ${type}`);
    return;
  }

  spawn(phase.props);
}
