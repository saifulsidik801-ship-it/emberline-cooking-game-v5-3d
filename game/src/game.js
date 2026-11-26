// RAMEN RUSH v6 — gameplay: tickets, cooking, serving, combo, rush hour, critic.
// The loop: take ingredients from bins (1-8, click or key) -> plate them (E at
// PLATING) -> cook on the GRILL (E, 3s) -> serve at THE PASS (Space) before it
// burns (7s). Wrong or late orders cost hearts. Named regulars order by name;
// after 5 serves the hidden critic arrives with an Omakase ticket worth 3x.
(function () {
  const RR = (window.RR = window.RR || {});

  const G = {
    score: 0, money: 0, tips: 0, combo: 0, comboTimer: 0, bestCombo: 0, hearts: 3,
    day: 1, dayTime: 0, progress: 0, best: 0, seed: 1740,
    orders: [], orderSeq: 0, queue: [], queueTimer: 6, idleSeats: [],
    spawnTimer: 4, rushTimer: 0, rush: false, rushLeft: 0,
    hands: [null, null], plate: [], plateState: 'empty', plateTimer: 0, plateRecipe: null,
    chefX: 640, chefMoving: false, chefAction: null, chefActionT: 0, chefActionStation: null,
    walkTarget: null, walkInteract: false,
    served: 0, missed: 0, started: false, over: false, paused: false, muted: false, dayWon: false,
    goals: {}, criticActive: false, criticServed: false, criticOffered: false,
    dialogue: { c: RR.REGULARS[0], line: 'Rain or shine, the yatai opens.' }, dialogueTimer: 0,
    toast: '', toastT: 0, hero: '', heroSub: '', heroT: 0,
  };
  RR.game = G;

  // ---- tiny synth (created on first gesture) ----
  let ac = null;
  function beep(f, d, type, vol) {
    if (G.muted) return;
    try {
      ac = ac || new (window.AudioContext || window.webkitAudioContext)();
      const o = ac.createOscillator(), gn = ac.createGain();
      o.type = type || 'sine'; o.frequency.value = f;
      gn.gain.setValueAtTime(vol || 0.08, ac.currentTime);
      gn.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + d);
      o.connect(gn); gn.connect(ac.destination);
      o.start(); o.stop(ac.currentTime + d);
    } catch (e) { /* audio is a garnish, never fatal */ }
  }
  RR.beep = beep;

  function flash(msg) { G.toast = msg; G.toastT = 2.6; }
  function hero(msg, sub) { G.hero = msg; G.heroSub = sub || ''; G.heroT = 1.8; beep(660, 0.25, 'triangle', 0.1); beep(880, 0.3, 'triangle', 0.1); }
  function pickRegular() { return RR.REGULARS[Math.floor(Math.random() * RR.REGULARS.length)]; }

  function newOrder() {
    let customer, recipe, timeMax = RR.CONFIG.orderTime;
    if (!G.criticOffered && G.served >= 5) {
      customer = RR.CRITIC; recipe = RR.RECIPES[4]; // Omakase Platter
      timeMax = 60; G.criticOffered = true; G.criticActive = true;
      hero('THE CRITIC IS HERE!', 'Hana wants Omakase — do not keep her waiting');
    } else {
      const q = G.queue.shift();
      customer = q ? q.c : pickRegular();
      recipe = RR.RECIPES[Math.floor(Math.random() * RR.RECIPES.length)];
    }
    const seat = 1 + Math.floor(Math.random() * RR.SEAT_X.length);
    const o = { id: ++G.orderSeq, recipe, seat, customer, timeLeft: timeMax, timeMax, state: 'new' };
    G.orders.push(o);
    if (G.orders.length > RR.CONFIG.maxTickets) G.orders.shift();
    G.dialogue = { c: customer, line: customer.lines[Math.floor(Math.random() * customer.lines.length)] };
    G.dialogueTimer = 0;
    return o;
  }

  function addIngredient(name) {
    if (G.over || !G.started || G.paused) return false;
    const slot = G.hands.indexOf(null);
    if (slot === -1) { flash('Hands full! Plate them first (E at PLATING).'); beep(160, 0.12, 'square', 0.05); return false; }
    G.hands[slot] = name;
    beep(520, 0.08, 'sine', 0.06);
    return true;
  }

  function nearestStation() {
    let best = null, bd = 1e9;
    RR.STATIONS.forEach((s) => { const d = Math.abs(s.x - G.chefX); if (d < bd) { bd = d; best = s; } });
    return bd < 90 ? best : null;
  }

  function interact() {
    if (G.over || !G.started || G.paused) return;
    const st = nearestStation();
    if (!st) { flash('Move closer to a station (A/D or click it).'); return; }
    if (st.id === 'plating') {
      if (G.plateState !== 'empty' && G.plateState !== 'assembling') { flash('Plate is busy — finish or trash it first.'); return; }
      const carried = G.hands.filter(Boolean);
      if (!carried.length) { flash('Hands empty — take ingredients from the bins (1-8).'); return; }
      if (!G.plateRecipe) {
        G.plateRecipe = RR.RECIPES.find((r) => carried.every((c) => r.needs.includes(c))) || null;
        if (!G.plateRecipe) { flash('Those ingredients match no recipe — trash them (X).'); beep(160, 0.15, 'square', 0.05); return; }
      }
      const bad = carried.filter((c) => !G.plateRecipe.needs.includes(c) || G.plate.includes(c));
      if (bad.length) { flash('Wrong for ' + G.plateRecipe.name + ' — trash the extras (X).'); return; }
      G.plate.push(...carried);
      G.hands = [null, null];
      G.plateState = 'assembling';
      G.chefAction = 'chopping'; G.chefActionT = 0.6; G.chefActionStation = 'plating';
      beep(440, 0.08, 'sine', 0.06);
      if (G.plateRecipe.needs.every((n) => G.plate.includes(n))) flash(G.plateRecipe.name + ' assembled! Cook it at the GRILL (E).');
      return;
    }
    if (st.id === 'grill') {
      if (G.plateState === 'assembling' && G.plateRecipe && G.plateRecipe.needs.every((n) => G.plate.includes(n))) {
        G.plateState = 'cooking'; G.plateTimer = 0;
        G.chefAction = 'stirring'; G.chefActionT = RR.CONFIG.cookTime; G.chefActionStation = 'grill';
        flash('Cooking ' + G.plateRecipe.name + '…');
      } else if (G.plateState === 'cooking') { flash('Still cooking…'); }
      else { flash('Assemble a full dish at PLATING first.'); }
      return;
    }
    if (st.id === 'broth' || st.id === 'noodle' || st.id === 'chop') {
      G.chefAction = st.id === 'chop' ? 'chopping' : 'stirring';
      G.chefActionT = 0.9; G.chefActionStation = st.id;
      flash(st.id === 'chop' ? 'Chop chop! Nice and quick.' : st.id === 'broth' ? 'Broth simmering — smells like 1962.' : 'Noodles boiling — watch the steam!');
      return;
    }
    if (st.id === 'pass') { serve(); return; }
  }

  function trash() {
    if (G.over || !G.started) return;
    G.hands = [null, null];
    if (G.plateState === 'burnt') {
      // A burnt dish is ruined — trash it off the plate too.
      G.plate = []; G.plateRecipe = null; G.plateState = 'empty'; G.plateTimer = 0;
      flash('Burnt dish trashed.');
    } else {
      // Hands only: an in-progress plate (assembling / cooking / ready) is kept.
      flash('Hands cleared.');
    }
  }

  function serve() {
    if (G.over || !G.started || G.paused) return;
    if (G.plateState === 'ready' && G.plateRecipe) {
      const match = G.orders.find((o) => o.recipe.name === G.plateRecipe.name);
      if (match) {
        const isCritic = match.customer === RR.CRITIC;
        const mult = isCritic ? 3 : 1;
        const gained = Math.round(match.recipe.price * (1 + G.combo * 0.5) * mult);
        G.score += gained * 10;
        G.money += gained; G.tips += gained;
        G.combo += 1; G.comboTimer = RR.CONFIG.comboWindow;
        G.bestCombo = Math.max(G.bestCombo, G.combo);
        G.served += 1;
        G.orders.splice(G.orders.indexOf(match), 1);
        G.idleSeats[match.seat - 1] = pickRegular();
        if (isCritic) {
          G.criticServed = true; G.criticActive = false;
          hero('CRITIC SERVED! ★★★★★', 'Hana: “Five stars. I will write about this yatai.”');
        } else {
          hero('ORDER UP! +¥' + gained, match.customer.name + ' · COMBO x' + G.combo);
        }
        beep(880, 0.15, 'triangle', 0.1); beep(1174, 0.2, 'triangle', 0.1);
        if (G.served >= 8) G.goals.serve8 = true;
        if (G.combo >= 5) G.goals.combo5 = true;
        if (G.criticServed) G.goals.critic = true;
      } else {
        G.score += 50;
        flash('Served, but nobody ordered it — small tip.');
        G.combo = 0;
      }
      G.plate = []; G.plateRecipe = null; G.plateState = 'empty'; G.plateTimer = 0;
    } else if (G.plateState === 'burnt') {
      flash('That dish is BURNT — trash it, don\'t serve it!');
      beep(160, 0.15, 'square', 0.05);
    } else {
      flash('Nothing ready to serve — assemble + cook first.');
    }
  }

  function startGame() {
    G.score = 0; G.money = 0; G.tips = 0; G.combo = 0; G.comboTimer = 0; G.bestCombo = 0; G.hearts = 3;
    G.dayTime = 0; G.progress = 0;
    G.orders = []; G.orderSeq = 0; G.queue = []; G.queueTimer = 6;
    G.spawnTimer = 3; G.rushTimer = 0; G.rush = false; G.rushLeft = 0;
    G.hands = [null, null]; G.plate = []; G.plateState = 'empty'; G.plateTimer = 0; G.plateRecipe = null;
    G.chefX = 640; G.chefMoving = false; G.chefAction = null; G.chefActionT = 0; G.chefActionStation = null;
    G.walkTarget = null; G.walkInteract = false;
    G.served = 0; G.missed = 0; G.started = true; G.over = false; G.paused = false; G.dayWon = false;
    G.goals = { serve8: false, combo5: false, critic: false, nowalk: true };
    G.criticActive = false; G.criticServed = false; G.criticOffered = false;
    G.idleSeats = RR.SEAT_X.map(() => pickRegular());
    for (let i = 0; i < 3; i++) G.queue.push({ c: pickRegular(), wait: Math.floor(Math.random() * 20) });
    newOrder(); newOrder();
    G.dialogue = { c: G.orders[0].customer, line: G.orders[0].customer.lines[0] };
    G.seed = 1000 + Math.floor(Math.random() * 9000);
    RR.cam.scale = 1; RR.cam.cx = 640; RR.cam.cy = 380;
  }

  function tick(dt) {
    if (!G.started || G.over || G.paused) return;
    G.dayTime += dt;
    G.progress = Math.min(1, G.dayTime / RR.CONFIG.dayLength);
    // walk-to-click
    if (G.walkTarget !== null) {
      const dx = G.walkTarget - G.chefX;
      const step = Math.sign(dx) * RR.CONFIG.chefSpeed * dt;
      G.chefMoving = true;
      if (Math.abs(dx) <= Math.abs(step)) {
        G.chefX = G.walkTarget; G.walkTarget = null; G.chefMoving = false;
        if (G.walkInteract) { G.walkInteract = false; interact(); }
      } else G.chefX += step;
    }
    // spawn tickets
    G.spawnTimer -= dt;
    if (G.spawnTimer <= 0 && G.orders.length < RR.CONFIG.maxTickets) {
      newOrder();
      G.spawnTimer = G.rush ? 4 : RR.CONFIG.orderSpawnEvery;
    }
    // queue refills + waits
    G.queueTimer -= dt;
    if (G.queueTimer <= 0 && G.queue.length < 3) { G.queue.push({ c: pickRegular(), wait: 0 }); G.queueTimer = 12; }
    G.queue.forEach((q) => { q.wait += dt; });
    // rush hour cycle
    if (!G.rush) {
      G.rushTimer += dt;
      if (G.rushTimer > RR.CONFIG.rushEvery) {
        G.rush = true; G.rushLeft = RR.CONFIG.rushLength; G.rushTimer = 0;
        hero('RUSH HOUR!', 'Orders are coming twice as fast');
        flash('RUSH HOUR! Orders are coming faster!');
      }
    } else {
      G.rushLeft -= dt;
      if (G.rushLeft <= 0) { G.rush = false; flash('Rush hour over — breathe!'); }
    }
    // ticket timers
    for (let i = G.orders.length - 1; i >= 0; i--) {
      const o = G.orders[i];
      o.timeLeft -= dt;
      if (o.timeLeft <= 0) {
        G.orders.splice(i, 1);
        G.hearts -= 1; G.missed += 1; G.combo = 0;
        G.idleSeats[o.seat - 1] = pickRegular();
        if (o.customer === RR.CRITIC) { G.criticActive = false; flash('The critic walked out…'); }
        else flash('Order expired! ' + o.customer.name + ' walked out. ♥ lost');
        beep(140, 0.3, 'sawtooth', 0.06);
        G.goals.nowalk = false;
        if (G.hearts <= 0) {
          G.over = true; G.dayWon = false;
          G.best = Math.max(G.best, G.score);
          flash('DAY OVER — the stall closed! Score ' + G.score);
        }
      }
    }
    // combo decay
    if (G.combo > 0) { G.comboTimer -= dt; if (G.comboTimer <= 0) G.combo = 0; }
    // plate cooking / burning
    if (G.plateState === 'cooking') {
      G.plateTimer += dt;
      if (G.plateTimer >= RR.CONFIG.cookTime) {
        G.plateState = 'ready'; G.plateTimer = 0;
        const o = G.orders.find((x) => x.recipe.name === (G.plateRecipe && G.plateRecipe.name));
        if (o) o.state = 'ready';
        flash('READY — SERVE! Ring the bell (Space).');
        beep(990, 0.12, 'triangle', 0.08);
      }
    } else if (G.plateState === 'ready') {
      G.plateTimer += dt;
      if (G.plateTimer >= RR.CONFIG.burnTime) {
        G.plateState = 'burnt';
        const o = G.orders.find((x) => x.recipe.name === (G.plateRecipe && G.plateRecipe.name));
        if (o) o.state = 'burnt';
        flash('BURNT! The dish is ruined — trash it (X).');
        beep(140, 0.25, 'sawtooth', 0.06);
      }
    }
    // chef action timer
    if (G.chefActionT > 0) { G.chefActionT -= dt; if (G.chefActionT <= 0) { G.chefAction = null; G.chefActionStation = null; } }
    // dialogue rotation
    G.dialogueTimer += dt;
    if (G.dialogueTimer > 7 && G.orders.length) {
      const o = G.orders[Math.floor(Math.random() * G.orders.length)];
      G.dialogue = { c: o.customer, line: o.customer.lines[Math.floor(Math.random() * o.customer.lines.length)] };
      G.dialogueTimer = 0;
    }
    // toast / hero decay
    if (G.toastT > 0) G.toastT -= dt;
    if (G.heroT > 0) G.heroT -= dt;
    // night end
    if (G.progress >= 1) {
      G.over = true;
      G.dayWon = G.money >= RR.CONFIG.dayGoal;
      G.best = Math.max(G.best, G.score);
      if (G.missed === 0) G.goals.nowalk = true;
      flash('NIGHT ' + G.day + ' COMPLETE! Score ' + G.score + ' · Served ' + G.served + ' · Missed ' + G.missed);
    }
  }

  // no-op shims kept for the v5 API shape
  function updateHUD() {}
  function updateBoard() {}
  function updateOrderCard() {}

  RR.gameApi = { newOrder, updateBoard, updateOrderCard, updateHUD, addIngredient, interact, serve, trash, startGame, tick, flash, hero };
})();
