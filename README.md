[![make.fun · best-game-01](https://make.fun/badge/best-game-01.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![rank](https://make.fun/badge/best-game-01/AryFlows/best-game-01/rank.svg)](https://make.fun/bounty/best-game-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![reward](https://make.fun/badge/best-game-01/AryFlows/best-game-01/reward.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)

# Glowmoth Grove

A twin-stick arena survival game built original for the make.fun
best-game-01 bounty. No name, art, sound or level is copied from any
commercial game.

## The game

You are Luma, a firefly guardian of a night grove. Five glowblooms light
the grove — and the shadow-moths want them dark. Waves of moths drift in
from the treeline: some chase you, some dive straight for the blooms.
If every bloom goes dark, the grove is lost. If Luma falls, it is lost
too. Survive all 10 waves and burn down the Gloom Moth Queen to win.

- **Move** with WASD or arrow keys, **aim** with the mouse, **hold click**
  (or Space) to shoot light. **Shift** dashes through danger, and **E**
  spends pollen on a nova blast that clears the moths around you. Touch
  a bloom to mend it with pollen.
- **Pollen** is the grove's currency: moths drop it, blooms pay it out.
  Between waves, pick 1 of 3 upgrades — wider light, faster wings,
  thorn bulbs that fight beside you, a pollen magnet, and more.
- **Waves grow**: drifters, darters, spitters, armoured husks, splitters
  that burst into darters when they die, and golden elites from wave 6
  on. A boss comes every 5th wave — the Gloomwing telegraphs a charge,
  the Queen rains aimed fire — and the grove darkens as blooms fall.
- **Score** for every moth burned, with a combo multiplier for quick
  chains. Best score is kept in your browser.

## Play it

Open `game/index.html` in desktop Chrome, or serve the folder with
any static server (`node serve.ts` serves it at http://localhost:8080).
No network request, no build step — the whole game is plain files
under `game/`.

## Files

- `game/` — the playable game (HTML, CSS, ES modules, WebAudio synth
  sound; no libraries)
- `screenshots/` — real renders of the game's own code
- `main.ts` — the make.fun program that hands the entry in
- `vendor/makefun-game.ts` — the kit's dossier library, unchanged
