# RAMEN RUSH — 2D Night-Market Cooking Game (v6 rebuild)

[![make.fun · best-cooking-game-20261125-0137](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/saifulsidik801-ship-it/emberline-cooking-game-v5-3d/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/saifulsidik801-ship-it/emberline-cooking-game-v5-3d/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)

**RAMEN RUSH** — a dense 2D illustrated cooking game (Canvas 2D, no libraries) set in a rainy night-market ramen yatai. The v5 3D entry finished #2220/5,848 because its screenshots were an empty floor with capsule customers; v6 rebuilds it the way the top entries play: a whole kitchen visible at once, 6 tickets with timers, named regulars with dialogue, cooking verbs mid-action, goals, and a hidden critic.

You are the head chef. Take tickets off the order board, grab ingredients from the bins, build each dish on the plating bar, cook it on the charcoal grill, and ring the bell at the pass before the ticket walks out — a finished dish burns 7 seconds after it is done. After 5 serves the hidden critic Hana arrives with an Omakase ticket worth 3×.

## How it plays

- **6 recipes**: Tonkotsu Ramen ($14), Ebi Tempura ($11), Yakitori Don ($13), Sunomono Salad ($8), Omakase Platter ($18), Kinoko Don ($10). Every order needs exactly 3 ingredients.
- **Two-hand carry**: the chef holds up to 2 ingredients at a time — plan the route, don't just grab.
- **Cook & burn**: a full plate cooks on the grill in 3 seconds, then stays ready for 7 seconds before it is BURNT and must be trashed.
- **Combo**: serve dishes back-to-back to build the multiplier; a missed ticket breaks it and costs a heart.
- **Rush hour**: every minute the stall floods — tickets arrive twice as fast for 14 seconds.
- **Named regulars**: Grandma Yuki, Ken the taxi driver, Aoi the student, Ren the salaryman, Mika the nurse, Old Sato — each with lines, moods, and a seat at the counter.
- **The critic**: serve 5 dishes and Hana arrives. Serve her Omakase for 3× pay and five stars.
- **Goals**: serve 8, reach COMBO x5, serve the critic, no walkouts — and clear the ¥400 night goal.

## Controls

- **WASD / arrows** — move the chef along the counter
- **1–8** or **click a bin** — take an ingredient
- **E** — use the nearest station (plate / grill / chop / broth / noodle) · **click a station** — walk there and use it
- **Space** — ring the bell and serve · **X** — trash hands + plate
- **C** — switch camera zoom · **P** — pause · **M** — mute · **Enter** — start

## Run it

Serve the repo root over HTTP and open `game/index.html` (all files are local, no network needed):

```sh
node serve.ts
# game/ is on http://localhost:8080
```

## Tech

- Plain Canvas 2D, no libraries — every pixel is drawn in code (`game/src/render.js`)
- Plain static files under `game/` — no build step
- Staged screenshots via `window.primeForShot(n)` + `window.__gameReady` — four moments, two camera zooms
