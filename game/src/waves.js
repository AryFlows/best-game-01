import { FIELD, WAVE } from './config.js';
import { spawnEnemy } from './entities.js';

export function buildWave(n, rng) {
  const spec = WAVE[n] || WAVE[10];
  const queue = [];
  if (spec.boss) queue.push({ kind: spec.boss, delay: 0 });
  const kinds = ['drifter', 'darter', 'spitter', 'husk'];
  let delay = spec.boss ? 6 : 0;
  for (const kind of kinds) for (let i = 0; i < spec[kind]; i++) queue.push({ kind, delay: delay += spec.spawnInterval });
  if (spec.boss) queue.splice(1, queue.length - 1, ...queue.slice(1).map((entry) => ({ ...entry, delay: entry.delay + 6 })));
  void rng;
  return { queue, total: queue.length, isBoss: Boolean(spec.boss) };
}

export function startWave(state, n) {
  const wave = buildWave(n, state.rng);
  state.wave = n; state.waveQueue = wave.queue; state.waveTotal = wave.total; state.waveSpawnTimer = 0; state.waveElapsed = 0; state.isBossWave = wave.isBoss;
  return wave;
}

export function spawnTick(state, dt, rng) {
  if (!state.waveQueue?.length) return;
  state.waveElapsed = (state.waveElapsed || 0) + dt;
  while (state.waveQueue.length && state.waveQueue[0].delay <= state.waveElapsed) {
    const { kind } = state.waveQueue.shift();
    const angle = rng.range(0, Math.PI * 2), edge = rng.int(0, 3), margin = 48;
    const x = edge === 0 ? margin : edge === 1 ? FIELD.width - margin : rng.range(margin, FIELD.width - margin);
    const y = edge === 2 ? margin : edge === 3 ? FIELD.height - margin : rng.range(margin, FIELD.height - margin);
    let sx = x, sy = y;
    if (Math.hypot(x - state.player.x, y - state.player.y) < 220) { sx = Math.max(margin, Math.min(FIELD.width - margin, state.player.x + Math.cos(angle) * 260)); sy = Math.max(margin, Math.min(FIELD.height - margin, state.player.y + Math.sin(angle) * 260)); }
    state.enemies.push(spawnEnemy(kind, sx, sy, rng));
  }
}

export function waveCleared(state) { return Boolean(state.waveQueue && state.waveQueue.length === 0 && (!state.enemies || state.enemies.length === 0)); }
