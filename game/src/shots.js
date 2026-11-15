import { createRng } from './random.js';
import { startWave } from './waves.js';
import { createPlayer } from './entities.js';

const STEP = 1 / 60;
const CENTER = { x: 640, y: 360 };

export function makeDriver(game) {
  const state = game.state;
  const keys = new Set();
  const mouseButtons = new Set([0]);
  let aimTarget = null;
  let aimTimer = 0;
  let aimOffsetX = 0;
  let aimOffsetY = 0;
  const driver = {
    mouse: { ...CENTER },
    mouseButtons,
    update() {
      keys.clear();
      const player = state.player;
      const nearest = (items) => items.reduce((best, item) => {
        const distance = Math.hypot(item.x - player.x, item.y - player.y);
        return !best || distance < best.distance ? { item, distance } : best;
      }, null);
      if (aimTimer <= 0) {
        aimTarget = nearest(state.enemies.filter((item) => item.hp > 0))?.item ?? null;
        aimOffsetX = aimTarget ? state.rng.range(-35, 35) : 0;
        aimOffsetY = aimTarget ? state.rng.range(-35, 35) : 0;
        aimTimer = 30;
      }
      aimTimer--;
      const enemy = aimTarget ? {
        item: aimTarget,
        distance: Math.hypot(aimTarget.x - player.x, aimTarget.y - player.y),
      } : null;
      const pollen = nearest(state.pollen);
      let dx = 0, dy = 0;
      if (enemy?.distance < 150) {
        dx = player.x - enemy.item.x;
        dy = player.y - enemy.item.y;
      } else if (pollen?.distance < 420) {
        dx = pollen.item.x - player.x;
        dy = pollen.item.y - player.y;
      } else {
        dx = CENTER.x - player.x;
        dy = CENTER.y - player.y;
      }
      if (Math.abs(dx) > 1) keys.add(dx > 0 ? 'KeyD' : 'KeyA');
      if (Math.abs(dy) > 1) keys.add(dy > 0 ? 'KeyS' : 'KeyW');
      this.mouse.x = enemy ? enemy.item.x + aimOffsetX : CENTER.x;
      this.mouse.y = enemy ? enemy.item.y + aimOffsetY : CENTER.y;
    },
    isDown(code) { return code === 'Space' || keys.has(code); },
    consumePressed() { return false; },
  };
  return driver;
}

function resetScene(game, seed, name) {
  const s = game.state;
  Object.assign(s, {
    screen: 'play', wave: 0, score: 0, combo: 1, comboTimer: 0, pollenCount: 0,
    pollen: [], enemies: [], bullets: [], enemyBullets: [], pollenOrbs: [], bulbs: [],
    blooms: s.blooms.map((b) => ({ ...b, hp: 60, lit: true })), waveQueue: [], boss: null,
    stats: { kills: 0, bloomsSaved: 0, shotsFired: 0, timePlayed: 0 }, choices: [],
    rng: createRng(seed), player: createPlayer(),
  });
  if (name === 'victory') {
    for (const id of ['spread', 'wings', 'thornbulb', 'magnet', 'thickglow', 'twinbolt', 'dash']) s.player.upgrades[id] = 3;
    s.player.hp = s.player.maxHp = 200;
    startWave(s, 10);
  } else startWave(s, name === 'boss' ? 5 : 1);
}

function runScene(game, driver, name, cap) {
  const s = game.state;
  game.setDriver(driver);
  let firstBossStep = null;
  let firstBoss = null;
  for (let step = 0; step < cap; step++) {
    if (s.screen === 'over' || s.screen === 'victory') break;
    if (s.screen === 'upgrade') game._pick(0);
    if (s.screen !== 'play') break;
    driver.update();
    game._step(STEP);
    const boss = s.enemies.find((enemy) => enemy.kind === 'Gloomwing' || enemy.kind === 'Queen');
    if (name === 'boss' && boss && firstBossStep === null) {
      firstBoss = boss;
      firstBossStep = step;
    }
    if (name === 'play' && s.wave >= 2 && s.enemies.length >= 4 && s.score > 0) break;
    if (name === 'boss' && firstBossStep !== null && step - firstBossStep >= 60
      && firstBoss.hp > 0 && firstBoss.hp < firstBoss.maxHp) break;
    if (name === 'victory' && s.screen === 'victory') break;
  }
}

export function stageShot(name, game) {
  const params = new URLSearchParams(location.search);
  const seed = Number(params.get('seed') || 7);
  const s = game.state;
  if (name === 'title') {
    s.screen = 'title';
    for (let i = 0; i < 300; i++) game._step(STEP);
  } else {
    const cap = name === 'play' ? 45 * 60 : name === 'boss' ? 90 * 60 : 150 * 60;
    const driver = makeDriver(game);
    for (let attempt = 0; attempt < 2; attempt++) {
      resetScene(game, seed + attempt * 100, name);
      runScene(game, driver, name, cap);
      if (s.screen !== 'over' || attempt === 1) break;
    }
    if (name === 'victory') {
      s.screen = 'victory';
      s.stats.bloomsSaved = s.blooms.filter((b) => b.lit).length;
    }
  }
  game._render();
  window.__shotReady = true;
  window.__shotInfo = { scene: name, wave: s.wave, score: s.score, kills: s.stats.kills, time: s.stats.timePlayed };
}
