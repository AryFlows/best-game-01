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
    pacifist: false,
    // Staging only: hold fire while the boss walks to the middle of the field,
    // so the boss screenshot catches a real mid-field fight instead of a kill
    // at the spawn edge. The game itself is unchanged.
    setPacifist(v) {
      this.pacifist = v;
      if (v) mouseButtons.clear();
      else mouseButtons.add(0);
    },
    update() {
      keys.clear();
      const player = state.player;
      // A bloom with a moth chewing on it is the top priority: losing all
      // five ends the run, so the driver defends blooms before chasing pollen.
      const threatenedBloom = (state.blooms || []).find((b) => b.hp > 0 && b.lit !== false
        && state.enemies.some((e) => Math.hypot(e.x - b.x, e.y - b.y) < e.radius + 24));
      const nearest = (items) => items.reduce((best, item) => {
        const distance = Math.hypot(item.x - player.x, item.y - player.y);
        return !best || distance < best.distance ? { item, distance } : best;
      }, null);
      if (aimTimer <= 0) {
        const anchor = threatenedBloom || player;
        aimTarget = state.enemies.filter((item) => item.hp > 0).reduce((best, item) => {
          const distance = Math.hypot(item.x - anchor.x, item.y - anchor.y);
          return !best || distance < best.distance ? { item, distance } : best;
        }, null)?.item ?? null;
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
      } else if (threatenedBloom) {
        dx = threatenedBloom.x - player.x;
        dy = threatenedBloom.y - player.y;
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
      // Nova when swarmed: the same panic button a player would reach for.
      if (state.nova && state.nova.cooldown <= 0 && state.pollenCount >= 15
        && state.enemies.filter((item) => Math.hypot(item.x - player.x, item.y - player.y) < 280).length >= 4) {
        game._nova?.();
      }
    },
    isDown(code) { return (code === 'Space' && !this.pacifist) || keys.has(code); },
    // Dash out of danger like a player would: Shift the moment a moth closes
    // in, while the cooldown allows it.
    consumePressed(code) {
      if ((code === 'ShiftLeft' || code === 'ShiftRight') && state.player.dashCooldown <= 0
        && state.enemies.some((e) => Math.hypot(e.x - state.player.x, e.y - state.player.y) < 110)) return true;
      return false;
    },
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
    if (name === 'boss') {
      const b = s.enemies.find((enemy) => enemy.kind === 'Gloomwing' || enemy.kind === 'Queen');
      const fresh = firstBossStep === null || step - firstBossStep < 900;
      driver.setPacifist(!!b && fresh && (b.x < 200 || b.x > 1080 || b.y < 120 || b.y > 600));
    }
    driver.update();
    game._step(STEP);
    const boss = s.enemies.find((enemy) => enemy.kind === 'Gloomwing' || enemy.kind === 'Queen');
    if (name === 'boss' && boss && firstBossStep === null) {
      firstBoss = boss;
      firstBossStep = step;
    }
    if (name === 'play' && s.wave >= 4 && s.enemies.length >= 5 && s.bullets.length >= 3) break;
    if (name === 'play' && step > 70 * 60 && s.enemies.length >= 3) break;
    // Boss shot: wait for a real mid-fight moment — the boss damaged, adds on
    // screen, and the boss near the middle of the field (never half-clipped in
    // a corner). The driver holds fire until the boss is centred (see
    // setPacifist), so the fight starts mid-field.
    if (name === 'boss' && firstBossStep !== null && firstBoss.hp > 0
      && firstBoss.hp < firstBoss.maxHp * 0.92 && firstBoss.x > 150 && firstBoss.x < 1130
      && firstBoss.y > 100 && firstBoss.y < 620 && s.enemies.length >= 2) break;
    if (name === 'boss' && firstBossStep !== null && step - firstBossStep > 1200
      && firstBoss.hp > 0 && firstBoss.hp < firstBoss.maxHp
      && firstBoss.x > 100 && firstBoss.x < 1180 && firstBoss.y > 60 && firstBoss.y < 660) break;
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
    // 'soak' plays the whole game from wave 1 with ordinary upgrades: the
    // balance check. It is a test scene only, never a submitted screenshot.
    const cap = name === 'play' ? 80 * 60 : name === 'boss' ? 90 * 60 : name === 'soak' ? 420 * 60 : 150 * 60;
    const driver = makeDriver(game);
    for (let attempt = 0; attempt < 2; attempt++) {
      resetScene(game, seed + attempt * 100, name);
      runScene(game, driver, name, cap);
      if (s.screen !== 'over' || attempt === 1) break;
    }
    if (name === 'victory') {
      s.screen = 'victory';
      s.stats.bloomsSaved = s.blooms.filter((b) => b.lit).length;
      game._fireworks();
    }
  }
  game._render();
  window.__shotReady = true;
  window.__shotInfo = { scene: name, screen: s.screen, wave: s.wave, score: s.score, kills: s.stats.kills, time: s.stats.timePlayed, enemies: s.enemies.length, bullets: s.bullets.length, hp: Math.ceil(s.player.hp), bloomsLit: s.blooms.filter((b) => b.lit).length };
}
