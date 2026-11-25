// RAMEN RUSH — four cameras, four genuinely different angles.
// 1 = wide from the dining side (whole bar, like the reference)
// 2 = close-up from the side, on the cooking stations
// 3 = title opening screen (big RAMEN RUSH title over the busy bar)
// 4 = low from the dining side, watching the chef serve
(function () {
  const RR = (window.RR = window.RR || {});

  const SHOTS = [
    { name: '1-rush', pos: [0.8, 3.1, 11.3], target: [0.6, 1.25, -1.5] },
    { name: '2-plating', pos: [-8.6, 1.8, 3.6], target: [-3.2, 1.1, -1.6] },
    { name: '3-title', pos: [-3.5, 2.6, 9.0], target: [0, 1.3, -1.0] },
    { name: '4-burnt', pos: [4.6, 1.0, 5.2], target: [2.4, 1.5, -1.0] },
  ];
  RR.SHOTS = SHOTS;

  function setPeople(states) {
    // states: {player, chefs:[...], customers:[...], queue:[...], waiter, diners:[...]}
    const P = RR.people;
    if (!P) return;
    if (states.player) RR.setPersonState(P.player, states.player);
    (states.chefs || []).forEach((s, i) => { if (P.chefs[i]) RR.setPersonState(P.chefs[i], s); });
    (states.customers || []).forEach((s, i) => { if (P.customers[i]) RR.setPersonState(P.customers[i], s); });
    (states.queue || []).forEach((s, i) => { if (P.queue[i]) RR.setPersonState(P.queue[i], s); });
    if (states.waiter && P.waiter) RR.setPersonState(P.waiter, states.waiter);
    (states.diners || []).forEach((s, i) => { if (P.diners && P.diners[i]) RR.setPersonState(P.diners[i], s); });
  }

  function seedTickets(n, states) {
    const G = RR.game;
    G.orders = [];
    for (let i = 0; i < n; i++) {
      const recipe = RR.RECIPES[(i * 2 + 1) % RR.RECIPES.length];
      G.orders.push({
        id: ++G.orderSeq, recipe, seat: 1 + ((i * 3) % 8),
        timeLeft: [34, 22, 44, 41, 18][i] || 30, timeMax: RR.CONFIG.orderTime,
        state: (states && states[i]) || 'new',
      });
    }
    RR.gameApi.updateBoard();
    RR.gameApi.updateOrderCard();
  }

  function stageShot(n) {
    const G = RR.game;
    if (!G.started) RR.gameApi.startGame();
    // title screen only on shot 3 (startGame hides it; show it back here)
    const titleEl = document.getElementById('title-screen');
    if (titleEl) titleEl.style.display = (n === 3) ? 'flex' : 'none';
    G.over = false;
    const P = RR.people;
    if (P) {
      P.player.position.x = 0.5;
      P.player.position.z = RR.CONFIG.chefZ;
      P.player.rotation.y = 0;
    }
    if (n === 1) {
      // Wide: whole bar, busy lunch, chef carrying a tray mid-floor
      seedTickets(4);
      G.score = 1250; G.money = 48; G.combo = 3; G.comboTimer = 10; G.rush = false;
      G.plate = ['Noodle', 'Pork']; G.plateRecipe = RR.RECIPES[0]; G.plateState = 'assembling'; G.plateTimer = 0;
      G.hands = ['Egg', null];
      setPeople({
        player: 'carrying',
        chefs: ['stirring', 'stirring', 'chopping'],
        customers: ['eating', 'eating', 'happy', 'eating', 'idle', 'eating', 'eating', 'happy'],
        queue: ['queue', 'queue', 'queue', 'queue', 'queue', 'queue'],
        waiter: 'carrying',
        diners: ['eating', 'eating'],
      });
    } else if (n === 2) {
      // Side close-up: stations at work, dish mid-assembly on the plating bar
      seedTickets(3, ['cooking', 'new', 'new']);
      G.score = 860; G.money = 31; G.combo = 2; G.comboTimer = 8; G.rush = false;
      G.plate = ['Shrimp', 'Cabbage', 'Egg']; G.plateRecipe = RR.RECIPES[1]; G.plateState = 'cooking'; G.plateTimer = 1.2;
      G.hands = [null, null];
      setPeople({
        player: 'chopping',
        chefs: ['stirring', 'stirring', 'chopping'],
        customers: ['eating', 'idle', 'eating', 'eating', 'happy', 'idle', 'eating', 'eating'],
        queue: ['queue', 'queue', 'queue', 'queue', 'queue', 'queue'],
        waiter: 'carrying',
        diners: ['eating', 'eating'],
      });
      if (P) { P.player.position.x = -1.0; }
    } else if (n === 3) {
      // Title opening: big RAMEN RUSH title over the busy bar, 4 tickets up
      seedTickets(4);
      G.score = 2140; G.money = 58; G.combo = 3; G.comboTimer = 11;
      G.rush = false; G.rushLeft = 0; G.rushTimer = 0;
      G.plate = ['Noodle', 'Shrimp', 'Mushroom']; G.plateRecipe = RR.RECIPES[4]; G.plateState = 'assembling'; G.plateTimer = 0;
      G.hands = ['Chicken', null];
      setPeople({
        player: 'carrying',
        chefs: ['stirring', 'stirring', 'chopping'],
        customers: ['happy', 'eating', 'eating', 'happy', 'eating', 'eating', 'happy', 'eating'],
        queue: ['queue', 'queue', 'queue', 'queue', 'queue', 'queue'],
        waiter: 'carrying',
        diners: ['eating', 'eating'],
      });
      if (P) { P.player.position.x = 1.8; }
    } else {
      // Low dining angle: chef serving at the bell, one burnt dish smoking
      seedTickets(4, ['ready', 'burnt', 'new', 'new']);
      G.score = 1730; G.money = 52; G.combo = 2; G.comboTimer = 9; G.rush = false;
      G.plate = ['Mushroom', 'Chicken', 'Egg']; G.plateRecipe = RR.RECIPES[5]; G.plateState = 'burnt'; G.plateTimer = 8;
      G.hands = [null, null];
      setPeople({
        player: 'serve',
        chefs: ['stirring', 'stirring', 'idle'],
        customers: ['happy', 'happy', 'eating', 'eating', 'happy', 'eating', 'eating', 'sad'],
        queue: ['queue', 'queue', 'queue', 'queue', 'queue', 'queue'],
        waiter: 'carrying',
        diners: ['happy', 'eating'],
      });
      if (P) { P.player.position.x = 2.6; P.player.position.z = -0.9; }
    }
    RR.gameApi.updateHUD();
  }

  function applyShot(n) {
    const s = SHOTS[n - 1];
    if (!s || !RR.camera) return;
    RR.camera.position.set(s.pos[0], s.pos[1], s.pos[2]);
    RR.cameraTarget.set(s.target[0], s.target[1], s.target[2]);
    RR.camera.lookAt(RR.cameraTarget);
    RR.orbit = { yaw: 0, pitch: 0 };
    RR.shotIndex = n;
  }

  window.primeForShot = function (n) {
    window.__gameReady = false;
    try {
      stageShot(n);
      applyShot(n);
      // let two frames settle, then signal ready
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
  RR.applyShot = applyShot;
  RR.stageShot = stageShot;
})();
