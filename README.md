# RAMEN RUSH — 3D Cooking Game

[![make.fun · best-cooking-game-20261125-0137](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/saifulsidik801-ship-it/emberline-cooking-game-v5-3d/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/saifulsidik801-ship-it/emberline-cooking-game-v5-3d/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)

**RAMEN RUSH** — a real 3D cooking game (Three.js/WebGL) set in a crowded little ramen bar. The room is alive: eight customers eating at the counter, a queue shuffling by the door, three chefs chopping and stirring behind the counter, steam over the tempura pot, flames on the charcoal grill, paper lanterns glowing warm. You are the head chef. Take tickets off the wall order board, grab ingredients from the bins, build each dish on the plating bar, cook it on the grill, and ring the bell to serve before the ticket walks out — a finished dish burns 7 seconds after it is done.

## How it plays

- **6 recipes**: Tonkotsu Ramen ($14), Ebi Tempura ($11), Yakitori Don ($13), Sunomono Salad ($8), Omakase Platter ($18), Kinoko Don ($10). Every order needs exactly 3 ingredients.
- **Two-hand carry**: the chef holds up to 2 ingredients at a time — plan the route, don't just grab.
- **Cook & burn**: a full plate cooks on the grill in 3 seconds, then stays ready for 7 seconds before it is BURNT and must be trashed.
- **Combo**: serve dishes back-to-back to build the multiplier; a missed ticket breaks it and costs a heart.
- **Rush hour**: every minute the bar floods — tickets arrive twice as fast for 14 seconds.
- **Characters react**: customers eat, nod, cheer when served and slump when their order expires; chefs chop, stir and carry all shift long.

## Controls

- **WASD / arrows** — move the chef along the counter
- **1–8** or **click a bin** — take an ingredient
- **E** — use the nearest station (plate / grill / chop / sink / trash)
- **Space** — ring the bell and serve
- **C** — switch camera angle · **drag** — look around · **P** — pause · **Enter** — start

## Run it

Serve the repo root over HTTP and open `game/index.html` (all files are local, no network needed):

```sh
node serve.ts
# open http://localhost:8080
```

## Tech

- Three.js r152 (vendored as `game/vendor/three.min.js`, no CDN)
- Plain static files under `game/` — no build step
- Procedural characters: every person is a small primitive rig animated with sin/cos state machines (idle breathing, eating, chopping, stirring, carrying, queue shuffle, happy/sad reactions)
- Staged screenshots via `window.primeForShot(n)` + `window.__gameReady` — four cameras, four different angles
