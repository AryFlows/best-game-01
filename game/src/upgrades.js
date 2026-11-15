import { UPGRADES } from './config.js';
import { createBulb } from './entities.js';

export const UPGRADE_DEFS = [
  { id: 'spread', name: 'Pollen Fan', desc: 'Fire more bolts in a wider spread.', icon: 'SPREAD', maxTier: 3, apply: (p) => { p.upgrades.spread = (p.upgrades.spread || 0) + 1; } },
  { id: 'wings', name: 'Swift Wings', desc: 'Move faster.', icon: 'WINGS', maxTier: 3, apply: (p) => { p.upgrades.wings = (p.upgrades.wings || 0) + 1; } },
  { id: 'thornbulb', name: 'Thorn Bulb', desc: 'Place a turret beside a lit bloom.', icon: 'BULB', maxTier: 3, apply: (p) => { p.upgrades.thornbulb = (p.upgrades.thornbulb || 0) + 1; } },
  { id: 'magnet', name: 'Moon Magnet', desc: 'Collect pollen from farther away.', icon: 'MAGNET', maxTier: 3, apply: (p) => { p.upgrades.magnet = (p.upgrades.magnet || 0) + 1; } },
  { id: 'thickglow', name: 'Thick Glow', desc: 'Gain maximum health and heal.', icon: 'GLOW', maxTier: 3, apply: (p) => { p.upgrades.thickglow = (p.upgrades.thickglow || 0) + 1; p.maxHp += 25; p.hp = Math.min(p.maxHp, p.hp + 25); } },
  { id: 'twinbolt', name: 'Twin Bolt', desc: 'Fire parallel bolts.', icon: 'TWIN', maxTier: 3, apply: (p) => { p.upgrades.twinbolt = (p.upgrades.twinbolt || 0) + 1; } },
  { id: 'dash', name: 'Quick Dash', desc: 'Reduce dash cooldown.', icon: 'DASH', maxTier: 3, apply: (p) => { p.upgrades.dash = (p.upgrades.dash || 0) + 1; } },
];

export function rollChoices(rng, ownedTiers = {}) {
  const pool = UPGRADE_DEFS.filter((u) => (ownedTiers[u.id] || 0) < u.maxTier);
  for (let i = pool.length - 1; i > 0; i--) { const j = rng.int(0, i); [pool[i], pool[j]] = [pool[j], pool[i]]; }
  return pool.slice(0, 3);
}

export function applyUpgrade(state, id) {
  const def = UPGRADE_DEFS.find((item) => item.id === id);
  if (!def || (state.player.upgrades[id] || 0) >= def.maxTier) return false;
  def.apply(state.player);
  if (id === 'thornbulb') {
    const blooms = (state.blooms || []).filter((b) => b.hp > 0 && b.lit !== false);
    if (blooms.length) { const bloom = blooms[Math.floor((state.rng?.next?.() || 0) * blooms.length)]; const bulb = createBulb(bloom.x + 32, bloom.y); bulb.damage = UPGRADES.thornbulb[state.player.upgrades[id] - 1].damage; state.bulbs.push(bulb); }
  }
  return true;
}
