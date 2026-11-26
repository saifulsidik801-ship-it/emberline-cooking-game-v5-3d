// RAMEN RUSH — 2D night-market cooking game entrypoint (v6 rebuild).
//
// What this file boots: the game in game/ — a dense 2D illustrated yatai
// (Canvas 2D, no vendor libs, no network at grade time). The player runs a
// rainy night-market ramen stall: take 3-ingredient tickets from named
// regulars, cook at the broth pot / noodle boil / chop board / grill, serve
// at the pass before the ticket timer burns, keep the COMBO alive through
// rush hour — and impress the hidden critic, who arrives after 5 serves.
// Every corner of the frame is busy: 6 tickets, recipe book, goals, dialogue,
// queue, steam, rain, lanterns. The four screenshots in screenshots/ are
// four different moments (and two different camera zooms) of that same stall.
//
// This program hands the entry in: it copies game/ and screenshots/ from beside
// this file to /output and writes /output/dossier.json, the summary the judge
// reads, with the vendored make.fun library.
//
// Serve it locally with `node serve.ts`, then open http://localhost:8080.
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(here, 'game'), join(out, 'game'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });

// The scorer's own caps (reference/gate.json): only text_max_bytes shapes the bytes; the others refuse an entry the
// scorer would refuse (more than 4 screenshots or one over 256 KiB; more than 993 files in game/ or 48 MiB of game
// files, in all, or a path under game/ over 1000 bytes: game/ counts beside /output's own 1000-entry cap, its
// screenshots/ and dossier.json).
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);
