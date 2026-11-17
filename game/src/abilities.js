// Nova bomb: Luma's panic button. Spend pollen to blast every moth nearby.
// A real choice, not a free win: it costs the same pollen that mends blooms,
// and the cooldown is long enough that timing it matters.

export const NOVA = {
  cooldown: 18,
  cost: 15,
  radius: 280,
  damage: 70,
};

export function createNovaState() {
  return { cooldown: 0 };
}

export function updateNova(nova, dt) {
  if (!nova) return;
  nova.cooldown = Math.max(0, nova.cooldown - dt);
}

export function novaReady(state) {
  return state.nova && state.nova.cooldown <= 0 && state.pollenCount >= NOVA.cost;
}

// Detonates the nova if it is ready. Returns true when it fired.
export function tryNova(state, audio, fx) {
  if (!novaReady(state)) return false;
  state.pollenCount -= NOVA.cost;
  state.nova.cooldown = NOVA.cooldown;
  const player = state.player;
  for (const enemy of state.enemies || []) {
    const d = Math.hypot(enemy.x - player.x, enemy.y - player.y);
    if (d > NOVA.radius + enemy.radius) continue;
    enemy.hp -= NOVA.damage;
    fx?.damageNumber?.(enemy.x, enemy.y - enemy.radius, NOVA.damage, '#ffd77a');
  }
  // The kills themselves are scored by updateBullets' death path on the next
  // step; enemies reduced to 0 hp here die there, so the combo and pollen
  // rewards stay consistent with gun kills.
  fx?.burst?.(player.x, player.y, '#ffd77a', 48, 320);
  fx?.burst?.(player.x, player.y, '#fff0b0', 30, 200);
  fx?.burst?.(player.x, player.y, '#b58be8', 24, 150);
  fx?.shake?.(0.55);
  audio?.nova?.();
  return true;
}
