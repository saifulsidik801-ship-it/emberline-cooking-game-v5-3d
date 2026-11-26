// RAMEN RUSH v6 — four staged moments, four genuinely different framings.
// 1 = wide: the whole yatai on a rush night, 6 tickets, critic at the counter
// 2 = zoomed on the stations: plating mid-assembly + grill cooking (camera 1.5x)
// 3 = title opening: big RAMEN RUSH over the busy stall
// 4 = zoomed on the pass: ORDER UP! with the critic served (camera 1.6x)
// Shots differ in game state AND camera, so no two look alike.
(function () {
  const RR = (window.RR = window.RR || {});

  function seedTickets(n, states) {
    const G = RR.game;
    G.orders = [];
    for (let i = 0; i < n; i++) {
      const recipe = RR.RECIPES[(i * 2 + 1) % RR.RECIPES.length];
      const customer = RR.REGULARS[i % RR.REGULARS.length];
      G.orders.push({
        id: ++G.orderSeq, recipe, seat: 1 + ((i * 3) % 5),
        customer, timeLeft: [34, 22, 44, 41, 18, 52][i] || 30, timeMax: RR.CONFIG.orderTime,
        state: (states && states[i]) || 'new',
      });
    }
    G.dialogue = { c: G.orders[0].customer, line: G.orders[0].customer.lines[0] };
  }
  function seedQueue(names) {
    const G = RR.game;
    G.queue = names.map((n, i) => ({ c: RR.REGULARS.find((r) => r.name === n) || RR.REGULARS[i], wait: [6, 14, 23][i] || 10 }));
  }

  function stageShot(n) {
    const G = RR.game;
    if (!G.started) RR.gameApi.startGame();
    G.over = false; G.paused = false;
    G.rush = false; G.rushLeft = 0; G.rushTimer = 0;
    G.chefAction = null; G.chefActionT = 0; G.chefActionStation = null;
    G.walkTarget = null; G.walkInteract = false;
    G.toastT = 0; G.heroT = 0;
    RR.cam.scale = 1; RR.cam.cx = 640; RR.cam.cy = 380;
    if (n === 1) {
      // Wide rush night: 6 tickets, critic at the counter, combo alive
      seedTickets(6);
      G.orders[5].customer = RR.CRITIC; G.orders[5].recipe = RR.RECIPES[4];
      G.criticActive = true; G.criticOffered = true;
      G.score = 12480; G.money = 412; G.tips = 96; G.combo = 5; G.comboTimer = 9; G.bestCombo = 5;
      G.served = 7; G.missed = 0; G.hearts = 3; G.dayTime = 62; G.progress = 0.41;
      G.rush = true; G.rushLeft = 9;
      G.goals = { serve8: false, combo5: true, critic: false, nowalk: true };
      G.plate = ['Noodle', 'Pork']; G.plateRecipe = RR.RECIPES[0]; G.plateState = 'assembling'; G.plateTimer = 0;
      G.hands = ['Egg', null];
      G.chefX = 684; G.chefAction = 'stirring'; G.chefActionT = 2.4; G.chefActionStation = 'grill';
      G.dialogue = { c: RR.CRITIC, line: 'I write for the city paper. Impress me.' };
      seedQueue(['Ken · Taxi', 'Mika · Nurse', 'Old Sato']);
    } else if (n === 2) {
      // Zoom on stations: full plate cooking on the grill, chop mid-action
      seedTickets(4);
      G.score = 9860; G.money = 318; G.tips = 74; G.combo = 3; G.comboTimer = 8; G.bestCombo = 4;
      G.served = 5; G.missed = 1; G.hearts = 2; G.dayTime = 88; G.progress = 0.59;
      G.goals = { serve8: false, combo5: false, critic: false, nowalk: false };
      G.plate = ['Shrimp', 'Cabbage', 'Egg']; G.plateRecipe = RR.RECIPES[1]; G.plateState = 'cooking'; G.plateTimer = 1.6;
      G.hands = [null, null];
      G.chefX = 684; G.chefAction = 'stirring'; G.chefActionT = 1.4; G.chefActionStation = 'grill';
      G.dialogue = { c: RR.REGULARS[1], line: 'Quick! My meter is running.' };
      seedQueue(['Aoi · Student', 'Ren · Salaryman', 'Grandma Yuki']);
      // window chop->pass (x 489-1071): noodle + broth fully out, every
      // station label fully in frame (a half-cut label at the edge reads
      // as a defect — the old cx=755 left the noodle label's tail showing)
      RR.cam.scale = 1.5; RR.cam.cx = 780; RR.cam.cy = 300;
    } else if (n === 3) {
      // Title opening: big title over the busy stall, 4 tickets up
      seedTickets(4);
      G.score = 2140; G.money = 58; G.tips = 12; G.combo = 2; G.comboTimer = 10; G.bestCombo = 2;
      G.served = 2; G.missed = 0; G.hearts = 3; G.dayTime = 24; G.progress = 0.16;
      G.goals = { serve8: false, combo5: false, critic: false, nowalk: true };
      G.plate = ['Noodle', 'Shrimp']; G.plateRecipe = RR.RECIPES[4]; G.plateState = 'assembling'; G.plateTimer = 0;
      G.hands = ['Mushroom', null];
      G.chefX = 812; G.chefAction = 'chopping'; G.chefActionT = 0.5; G.chefActionStation = 'plating';
      G.dialogue = { c: RR.REGULARS[0], line: 'The broth tastes like 1962.' };
      seedQueue(['Old Sato', 'Ken · Taxi', 'Mika · Nurse']);
      G.started = false; // title overlay shows; stageShot caller re-shows it
    } else {
      // Zoom on the pass: critic served, ORDER UP! banner, big score
      seedTickets(5);
      G.orders[0].customer = RR.CRITIC; G.orders[0].recipe = RR.RECIPES[4];
      G.score = 18240; G.money = 486; G.tips = 132; G.combo = 6; G.comboTimer = 11; G.bestCombo = 6;
      G.served = 9; G.missed = 0; G.hearts = 3; G.dayTime = 121; G.progress = 0.81;
      G.goals = { serve8: true, combo5: true, critic: true, nowalk: true };
      G.criticServed = true; G.criticActive = false; G.criticOffered = true;
      G.plate = []; G.plateRecipe = null; G.plateState = 'empty'; G.plateTimer = 0;
      G.hands = [null, null];
      G.chefX = 950; G.chefAction = null;
      G.hero = 'ORDER UP! +¥54'; G.heroSub = 'Hana · Critic — COMBO x6'; G.heroT = 99;
      G.dialogue = { c: RR.CRITIC, line: 'Five stars. I will write about this yatai.' };
      seedQueue(['Ren · Salaryman', 'Aoi · Student', 'Grandma Yuki']);
      // window chop->pass (x 499-1081, y 186-484): chop label fully in
      // (the old cx=820 left it half-cut as "OP BOARD"), stations +
      // counter + bin tops in frame, so the bottom is busy
      RR.cam.scale = 1.5; RR.cam.cx = 790; RR.cam.cy = 335;
    }
  }

  window.primeForShot = function (n) {
    window.__gameReady = false;
    try {
      stageShot(n);
      // title screen only on shot 3
      const G = RR.game;
      if (n === 3) G.started = false;
      requestAnimationFrame(() => {
        requestAnimationFrame(() => { window.__gameReady = true; });
      });
    } catch (e) {
      window.__shotError = String(e && e.stack || e);
      window.__gameReady = true;
    }
    return true;
  };
  window.__gameReady = false;
  RR.stageShot = stageShot;
})();
