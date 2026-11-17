export const FIELD = { width: 1280, height: 720 };

export const PLAYER = {
  radius: 14,
  speed: 260,
  hp: 100,
  dashSpeed: 720,
  dashTime: 0.16,
  dashCooldown: 1.5,
  fireInterval: 0.16,
  bulletSpeed: 620,
  bulletDamage: 12,
};

export const ENEMIES = {
  drifter: { hp: 20, speed: 55, radius: 16, score: 50 },
  darter: { hp: 12, speed: 150, radius: 12, score: 80 },
  spitter: { hp: 24, speed: 70, radius: 15, score: 120 },
  husk: { hp: 90, speed: 34, radius: 22, score: 200 },
  splitter: { hp: 26, speed: 75, radius: 15, score: 150 },
};

export const BOSSES = {
  Gloomwing: { hp: 1100, speed: 60, radius: 44, score: 1500 },
  Queen: { hp: 1800, speed: 70, radius: 56, score: 5000 },
};

export const BLOOMS = Array.from({ length: 5 }, (_, i) => {
  const angle = -Math.PI / 2 + (i * Math.PI * 2) / 5;
  return {
    x: 640 + Math.cos(angle) * 220,
    y: 360 + Math.sin(angle) * 220,
    hp: 60,
  };
});

export const WAVE = {
  1: { drifter: 8, darter: 0, spitter: 0, husk: 0, splitter: 0, spawnInterval: 1.0, boss: null },
  2: { drifter: 12, darter: 3, spitter: 0, husk: 0, splitter: 0, spawnInterval: 0.9, boss: null },
  3: { drifter: 12, darter: 6, spitter: 2, husk: 0, splitter: 2, spawnInterval: 0.85, boss: null },
  4: { drifter: 14, darter: 7, spitter: 5, husk: 1, splitter: 3, spawnInterval: 0.8, boss: null },
  5: { drifter: 14, darter: 8, spitter: 6, husk: 2, splitter: 3, spawnInterval: 0.75, boss: 'Gloomwing' },
  6: { drifter: 16, darter: 9, spitter: 7, husk: 4, splitter: 4, spawnInterval: 0.7, boss: null },
  7: { drifter: 18, darter: 10, spitter: 8, husk: 5, splitter: 5, spawnInterval: 0.65, boss: null },
  8: { drifter: 20, darter: 11, spitter: 9, husk: 6, splitter: 6, spawnInterval: 0.6, boss: null },
  9: { drifter: 22, darter: 13, spitter: 11, husk: 7, splitter: 7, spawnInterval: 0.55, boss: null },
  10: { drifter: 22, darter: 15, spitter: 13, husk: 9, splitter: 8, spawnInterval: 0.5, boss: 'Queen' },
};

export const UPGRADES = {
  spread: [
    { tier: 1, angle: 0.12, projectiles: 2 },
    { tier: 2, angle: 0.2, projectiles: 3 },
    { tier: 3, angle: 0.28, projectiles: 4 },
  ],
  wings: [
    { tier: 1, speedMultiplier: 1.12 },
    { tier: 2, speedMultiplier: 1.25 },
    { tier: 3, speedMultiplier: 1.4 },
  ],
  thornbulb: [
    { tier: 1, damage: 4 },
    { tier: 2, damage: 8 },
    { tier: 3, damage: 14 },
  ],
  magnet: [
    { tier: 1, radius: 100 },
    { tier: 2, radius: 180 },
    { tier: 3, radius: 280 },
  ],
  thickglow: [
    { tier: 1, maxHp: 120 },
    { tier: 2, maxHp: 150 },
    { tier: 3, maxHp: 200 },
  ],
  twinbolt: [
    { tier: 1, projectiles: 2, damageMultiplier: 0.75 },
    { tier: 2, projectiles: 2, damageMultiplier: 1 },
    { tier: 3, projectiles: 3, damageMultiplier: 1 },
  ],
  dash: [
    { tier: 1, cooldown: 1.2 },
    { tier: 2, cooldown: 0.9 },
    { tier: 3, cooldown: 0.65 },
  ],
};

export const COLOURS = {
  background: '#17152b',
  backgroundDeep: '#100f20',
  gold: '#ffd77a',
  goldBright: '#fff0b0',
  moth: '#b58be8',
  mothLight: '#e2c7ff',
  mothDark: '#68488f',
  bloom: '#8bd9b2',
  danger: '#f27f9b',
  text: '#f5edff',
};
