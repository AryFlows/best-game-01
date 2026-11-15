import { FIELD, PLAYER, ENEMIES, BOSSES, UPGRADES } from './config.js';

const rand = (rng, a, b) => rng.range(a, b);
const dist2 = (a, b) => (a.x - b.x) ** 2 + (a.y - b.y) ** 2;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

export function createPlayer() {
  return { x: FIELD.width / 2, y: FIELD.height / 2, vx: 0, vy: 0, hp: PLAYER.hp, maxHp: PLAYER.hp, hurtCooldown: 0, angle: -Math.PI / 2, fireTimer: 0, dashTimer: 0, dashCooldown: 0, upgrades: {} };
}

export function spawnEnemy(kind, x, y, rng) {
  const spec = ENEMIES[kind] || BOSSES[kind] || ENEMIES.drifter;
  const boss = Boolean(BOSSES[kind]);
  return { kind, x, y, vx: 0, vy: 0, hp: spec.hp, maxHp: spec.hp, radius: spec.radius, speed: spec.speed, score: spec.score, state: 'approach', timer: rand(rng, 0.3, 1.2), target: 'player', bloomIndex: -1 };
}

export function createBullet(x, y, angle, speed, damage, from = 'player') {
  return { x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, angle, speed, damage, from, radius: from === 'player' ? 5 : 7, life: 2.5 };
}

export function createPollen(x, y, value = 1, rng) {
  return { x, y, vx: rand(rng, -55, 55), vy: rand(rng, -55, 55), value, radius: 7 };
}

export function createBulb(x, y) { return { x, y, fireTimer: 0, range: 220, damage: 10 }; }

function firePlayer(player, state, audio) {
  const spreadTier = player.upgrades.spread || 0;
  const twinTier = player.upgrades.twinbolt || 0;
  const spread = UPGRADES.spread[spreadTier - 1];
  const twin = UPGRADES.twinbolt[twinTier - 1];
  const count = Math.max(spread?.projectiles || 1, twin?.projectiles || 1);
  const damage = PLAYER.bulletDamage * (twin?.damageMultiplier || 1);
  for (let i = 0; i < count; i++) {
    const offset = count === 1 ? 0 : (i - (count - 1) / 2) * (spread?.angle || 0.12);
    state.bullets.push(createBullet(player.x, player.y, player.angle + offset, PLAYER.bulletSpeed, damage, 'player'));
    if (state.stats) state.stats.shotsFired++;
  }
  audio?.shoot?.();
}

export function updatePlayer(player, state, input, dt, rng, audio, fx) {
  player.dashCooldown = Math.max(0, player.dashCooldown - dt);
  player.dashTimer = Math.max(0, player.dashTimer - dt);
  player.hurtCooldown = Math.max(0, player.hurtCooldown - dt);
  player.fireTimer -= dt;
  const mx = input.mouse?.x ?? player.x, my = input.mouse?.y ?? player.y;
  if (mx !== player.x || my !== player.y) player.angle = Math.atan2(my - player.y, mx - player.x);
  let dx = Number(input.isDown('KeyD') || input.isDown('ArrowRight')) - Number(input.isDown('KeyA') || input.isDown('ArrowLeft'));
  let dy = Number(input.isDown('KeyS') || input.isDown('ArrowDown')) - Number(input.isDown('KeyW') || input.isDown('ArrowUp'));
  const len = Math.hypot(dx, dy) || 1;
  dx /= len; dy /= len;
  if ((input.consumePressed?.('ShiftLeft') || input.consumePressed?.('ShiftRight')) && player.dashCooldown <= 0) {
    player.dashTimer = PLAYER.dashTime;
    player.dashCooldown = player.upgrades.dash ? UPGRADES.dash[player.upgrades.dash - 1].cooldown : PLAYER.dashCooldown;
    if (dx || dy) { player.vx = dx * PLAYER.dashSpeed; player.vy = dy * PLAYER.dashSpeed; }
    else { player.vx = Math.cos(player.angle) * PLAYER.dashSpeed; player.vy = Math.sin(player.angle) * PLAYER.dashSpeed; }
    fx?.shake?.(0.12);
  }
  const speed = PLAYER.speed * (player.upgrades.wings ? UPGRADES.wings[player.upgrades.wings - 1].speedMultiplier : 1);
  if (player.dashTimer <= 0) { player.vx = dx * speed; player.vy = dy * speed; }
  player.x = clamp(player.x + player.vx * dt, 14, FIELD.width - 14);
  player.y = clamp(player.y + player.vy * dt, 14, FIELD.height - 14);
  if (input.isDown('Space') || input.mouseButtons?.has(0)) {
    if (player.fireTimer <= 0) { firePlayer(player, state, audio); player.fireTimer = PLAYER.fireInterval; }
  }
}

function targetFor(enemy, state) {
  const player = state.player;
  let best = player, bestD = dist2(enemy, player), target = 'player', index = -1;
  (state.blooms || []).forEach((b, i) => { if (b.hp > 0 && b.lit !== false && dist2(enemy, b) < bestD) { best = b; bestD = dist2(enemy, b); target = 'bloom'; index = i; } });
  enemy.target = target; enemy.bloomIndex = index;
  return best;
}

export function updateEnemies(state, dt, rng, audio, fx) {
  const player = state.player;
  for (const e of state.enemies || []) {
    e.timer -= dt;
    const target = targetFor(e, state);
    const angle = Math.atan2(target.y - e.y, target.x - e.x);
    let speed = e.speed;
    if (e.kind === 'darter' && e.timer <= 0) { e.state = 'lunge'; e.timer = 0.65; e.vx = Math.cos(angle) * speed * 2.5; e.vy = Math.sin(angle) * speed * 2.5; }
    else if (e.kind === 'darter' && e.state === 'lunge') { /* retain lunge velocity */ }
    else if (e.kind === 'spitter') {
      const d = Math.sqrt(dist2(e, target));
      speed = d < 230 ? -e.speed : d > 290 ? e.speed : 0;
      if (e.timer <= 0 && target === player) { const b = createBullet(e.x, e.y, angle, 260, 10, 'enemy'); state.bullets.push(b); e.timer = 2.1; }
      e.vx = Math.cos(angle) * speed; e.vy = Math.sin(angle) * speed;
    } else if (e.kind === 'Gloomwing' || e.kind === 'Queen') {
      if (e.timer <= 0) {
        if (e.kind === 'Queen' && e.state !== 'burst') { for (let i = 0; i < 2; i++) state.enemies.push(spawnEnemy('darter', e.x + rand(rng, -50, 50), e.y + rand(rng, -50, 50), rng)); e.timer = 8; }
        else { const n = 12; for (let i = 0; i < n; i++) state.bullets.push(createBullet(e.x, e.y, i * Math.PI * 2 / n, 210, 12, 'enemy')); e.timer = e.kind === 'Queen' ? 5 : 6; e.state = 'burst'; audio?.bossRoar?.(); }
      }
      if (e.kind === 'Gloomwing' && e.state !== 'charge') e.state = 'charge';
    } else { e.vx = Math.cos(angle) * speed; e.vy = Math.sin(angle) * speed; }
    e.x = clamp(e.x + e.vx * dt, e.radius, FIELD.width - e.radius);
    e.y = clamp(e.y + e.vy * dt, e.radius, FIELD.height - e.radius);
    if (e.target === 'bloom' && Math.sqrt(dist2(e, target)) < e.radius + 18) target.hp = Math.max(0, target.hp - 6 * dt);
    if (e.target === 'player' && Math.sqrt(dist2(e, player)) < e.radius + 14 && !player.dashTimer && player.hurtCooldown <= 0) { player.hp -= 12 * dt; player.hurtCooldown = 0.5; audio?.playerHurt?.(); }
  }
  void fx;
}

export function updateBullets(state, dt, rng, audio, fx) {
  const bullets = state.bullets || [];
  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i]; b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt;
    let remove = b.life <= 0 || b.x < -20 || b.y < -20 || b.x > FIELD.width + 20 || b.y > FIELD.height + 20;
    if (!remove && b.from === 'player') for (const e of state.enemies || []) if (e.hp > 0 && dist2(b, e) < (b.radius + e.radius) ** 2) {
      e.hp -= b.damage; remove = true; audio?.hit?.(); fx?.damageNumber?.(e.x, e.y - e.radius, b.damage, '#fff0b0');
      if (e.hp <= 0) {
        if (state.comboTimer > 0) state.combo = Math.min(5, (state.combo || 1) + 1);
        else state.combo = 1;
        state.comboTimer = 2.5;
        state.score = (state.score || 0) + e.score * state.combo;
        if (state.stats) state.stats.kills++;
        state.pollen?.push(createPollen(e.x, e.y, e.kind === 'Queen' ? 8 : e.kind === 'Gloomwing' ? 5 : 1, rng)); audio?.enemyDie?.(); fx?.burst?.(e.x, e.y, '#b58be8', 12, 110);
      }
      break;
    }
    if (!remove && b.from === 'enemy' && dist2(b, state.player) < (b.radius + 14) ** 2) { state.player.hp -= b.damage; remove = true; audio?.playerHurt?.(); }
    if (remove) bullets.splice(i, 1);
  }
  state.enemies = (state.enemies || []).filter((e) => e.hp > 0);
}

export function updatePollen(state, dt, rng, audio, fx) {
  const p = state.player, radius = 100 * (p.upgrades.magnet ? 1.6 ** p.upgrades.magnet : 1);
  for (let i = (state.pollen || []).length - 1; i >= 0; i--) {
    const item = state.pollen[i], d = Math.sqrt(dist2(item, p));
    if (d < radius && d > 0) { item.vx += (p.x - item.x) / d * 420 * dt; item.vy += (p.y - item.y) / d * 420 * dt; }
    item.vx *= Math.pow(0.08, dt); item.vy *= Math.pow(0.08, dt); item.x += item.vx * dt; item.y += item.vy * dt;
    if (dist2(item, p) < 22 ** 2) { state.pollenCount = (state.pollenCount || 0) + item.value; state.pollenTotal = state.pollenCount; state.pollen.splice(i, 1); audio?.pickup?.(); fx?.pollenBurst?.(p.x, p.y, 4); }
  }
}

export function updateBulbs(state, dt, rng, audio) {
  for (const bulb of state.bulbs || []) {
    bulb.fireTimer -= dt;
    if (bulb.fireTimer > 0) continue;
    let target = null, nearest = bulb.range ** 2;
    for (const enemy of state.enemies || []) if (enemy.hp > 0 && dist2(bulb, enemy) < nearest) { target = enemy; nearest = dist2(bulb, enemy); }
    if (target) { state.bullets.push(createBullet(bulb.x, bulb.y, Math.atan2(target.y - bulb.y, target.x - bulb.x), 460, bulb.damage, 'player')); bulb.fireTimer = 0.7; audio?.shoot?.(); }
  }
  void rng;
}
