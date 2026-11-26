// RAMEN RUSH v6 — bootstrap, render loop, input (keyboard + mouse).
// Canvas 2D only: no WebGL, no vendor libs. The whole game is one <canvas>.
(function () {
  const RR = (window.RR = window.RR || {});
  const W = 1280, H = 720;

  let canvas, ctx;
  let last = 0, elapsed = 0;
  const keys = {};
  const CAM_VIEWS = [
    { scale: 1, cx: 640, cy: 380 },
    { scale: 1.5, cx: 780, cy: 300 },
    { scale: 1.5, cx: 790, cy: 335 },
  ];
  let camView = 0;

  function init() {
    canvas = document.getElementById('game');
    ctx = canvas.getContext('2d');
    RR.canvas = canvas;
    bindInput();
    requestAnimationFrame(loop);
    setTimeout(() => { window.__gameReady = true; }, 400);
  }

  function toCanvas(e) {
    const r = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - r.left) / r.width) * W,
      y: ((e.clientY - r.top) / r.height) * H,
    };
  }

  function clickAt(x, y) {
    const G = RR.game;
    // trash chip (bottom bar)
    if (x >= 1150 && x <= 1264 && y >= 660 && y <= 690) { RR.gameApi.trash(); return; }
    if (!G.started || G.over || G.paused) return;
    // bins on the counter
    if (y >= 446 && y <= 498) {
      for (let i = 0; i < RR.BINS.length; i++) {
        const bx = 232 + i * 102;
        if (x >= bx - 42 && x <= bx + 42) { RR.gameApi.addIngredient(RR.BINS[i].name); return; }
      }
    }
    // stations (back row)
    if (y >= 190 && y <= 320) {
      for (const st of RR.STATIONS) {
        if (x >= st.x - st.w / 2 && x <= st.x + st.w / 2) {
          G.walkTarget = st.x; G.walkInteract = true;
          return;
        }
      }
    }
  }

  function bindInput() {
    window.addEventListener('keydown', (e) => {
      const k = e.key.toLowerCase();
      keys[k] = true;
      const G = RR.game;
      if (e.key === 'Enter') {
        if (!G.started || G.over) {
          const wasOver = G.over;
          RR.gameApi.startGame();
          if (wasOver) G.day += 1;
        }
        return;
      }
      if (!G.started || G.over) return;
      if (k === 'e') RR.gameApi.interact();
      if (e.key === ' ') { e.preventDefault(); RR.gameApi.serve(); }
      if (k === 'x') RR.gameApi.trash();
      if (k === 'p') { G.paused = !G.paused; }
      if (k === 'm') { G.muted = !G.muted; }
      if (k === 'c') {
        camView = (camView + 1) % CAM_VIEWS.length;
        RR.cam.scale = CAM_VIEWS[camView].scale;
        RR.cam.cx = CAM_VIEWS[camView].cx;
        RR.cam.cy = CAM_VIEWS[camView].cy;
      }
      const bin = RR.BINS.find((b) => b.key === e.key);
      if (bin) RR.gameApi.addIngredient(bin.name);
    });
    window.addEventListener('keyup', (e) => { keys[e.key.toLowerCase()] = false; });
    canvas.addEventListener('click', (e) => { const p = toCanvas(e); clickAt(p.x, p.y); });
    canvas.addEventListener('mousemove', (e) => {
      const p = toCanvas(e);
      canvas.style.cursor = (p.y >= 446 && p.y <= 498) || (p.y >= 190 && p.y <= 320) ? 'pointer' : 'default';
    });
  }

  function movePlayer(dt) {
    const G = RR.game;
    if (!G.started || G.over || G.paused || G.walkTarget !== null) return;
    let dir = 0;
    if (keys['a'] || keys['arrowleft']) dir -= 1;
    if (keys['d'] || keys['arrowright']) dir += 1;
    G.chefMoving = dir !== 0;
    if (dir !== 0) {
      G.chefX = Math.max(RR.CONFIG.chefXMin, Math.min(RR.CONFIG.chefXMax, G.chefX + dir * RR.CONFIG.chefSpeed * dt));
    }
  }

  function loop(ts) {
    requestAnimationFrame(loop);
    // FIXED-STEP SIM: in a slow renderer (SwiftShader ~1 FPS) a raw per-frame
    // dt would run the game at 1/20 speed. Advance game time by WALL time in
    // 0.05s slices (up to 1.0s of game time per frame) so the game always runs
    // at real-time speed no matter how slow the frames are.
    const wallDt = Math.min(1.0, (ts - last) / 1000 || 0.016);
    last = ts;
    const G = RR.game;
    if (!G.paused) {
      elapsed += wallDt;
      let sim = wallDt, guard = 0;
      while (sim > 0 && guard < 20) {
        const step = Math.min(0.05, sim);
        movePlayer(step);
        RR.gameApi.tick(step);
        sim -= step;
        guard++;
      }
      RR.updateFx(wallDt, elapsed);
    }
    RR.draw(ctx, elapsed);
  }

  window.addEventListener('DOMContentLoaded', init);
})();
