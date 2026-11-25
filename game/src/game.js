// RAMEN RUSH — gameplay: tickets, cooking, serving, combo, rush hour.
// The loop: take ingredients from bins (1-8) -> plate them (E at PLATING) ->
// cook on the grill (E at GRILL, 3s) -> serve at the bell (Space) before it
// burns (7s). Wrong or late orders cost hearts.
(function () {
  const RR = (window.RR = window.RR || {});

  const G = {
    score: 0, money: 0, combo: 0, comboTimer: 0, hearts: 3,
    day: 1, dayTime: 0, progress: 0,
    orders: [], orderSeq: 0,
    spawnTimer: 4, rushTimer: 0, rush: false, rushLeft: 0,
    hands: [null, null], // two-hand carry
    plate: [], // ingredients on the plating bar
    plateState: 'empty', // empty | assembling | cooking | ready | burnt
    plateTimer: 0, plateRecipe: null,
    chefX: 0.5, chefMoving: false, chefAction: null, chefActionT: 0,
    served: 0, missed: 0, started: false, over: false,
  };
  RR.game = G;

  function el(id) { return document.getElementById(id); }
  function fmtMoney(n) { return '¥' + n; }

  function newOrder() {
    const recipe = RR.RECIPES[Math.floor(Math.random() * RR.RECIPES.length)];
    const seat = 1 + Math.floor(Math.random() * 8);
    const o = {
      id: ++G.orderSeq, recipe, seat,
      timeLeft: RR.CONFIG.orderTime, timeMax: RR.CONFIG.orderTime,
      state: 'new', // new | cooking | ready | burnt
    };
    G.orders.push(o);
    if (G.orders.length > RR.CONFIG.maxTickets) G.orders.shift();
    updateBoard();
    updateOrderCard();
    return o;
  }

  function updateBoard() {
    if (RR.world && RR.world.drawBoard) RR.world.drawBoard(G.orders);
  }

  function currentOrder() {
    return G.orders[0] || null;
  }

  function updateOrderCard() {
    const card = el('order-card');
    if (!card) return;
    const o = currentOrder();
    if (!o) {
      card.innerHTML = '<div class="oc-title">No orders yet</div><div class="oc-sub">Tickets will appear on the board…</div>';
      return;
    }
    const chips = o.recipe.needs.map((n) => {
      const have = G.plate.includes(n) || G.hands.includes(n);
      return '<span class="chip' + (have ? ' done' : '') + '">' + n + (have ? ' ✓' : '') + '</span>';
    }).join('');
    const stateLine = o.state === 'ready' ? '<span style="color:#7ddb8a">READY — ring the bell!</span>'
      : o.state === 'burnt' ? '<span style="color:#ff8a8a">BURNT! Trash it!</span>'
      : o.state === 'cooking' ? '<span style="color:#ffd27a">COOKING…</span>' : 'Seat ' + o.seat + ' · ' + Math.ceil(o.timeLeft) + 's';
    card.innerHTML =
      '<div class="oc-title">' + o.recipe.name + ' <span class="oc-price">$' + o.recipe.price + '</span></div>' +
      '<div class="oc-sub">' + stateLine + '</div>' +
      '<div class="oc-chips">' + chips + '</div>';
  }

  function updateHUD() {
    const set = (id, v) => { const n = el(id); if (n) n.textContent = v; };
    set('hud-score', G.score);
    set('hud-combo', 'COMBO x' + G.combo);
    set('hud-money', fmtMoney(G.money));
    set('hud-day', 'DAY ' + G.day);
    set('hud-hearts', '♥'.repeat(Math.max(0, G.hearts)) + '♡'.repeat(Math.max(0, 3 - G.hearts)));
    const bar = el('hud-progress');
    if (bar) bar.style.width = Math.round(G.progress * 100) + '%';
    const banner = el('rush-banner');
    if (banner) banner.style.display = G.rush ? 'block' : 'none';
    const plate = el('plate-state');
    if (plate) {
      plate.textContent = G.plateState === 'empty' ? 'PLATE: empty — grab ingredients (1-8)'
        : G.plateState === 'assembling' ? 'PLATE: ' + G.plate.join(' + ') + ' — need: ' + (G.plateRecipe ? G.plateRecipe.needs.filter((n) => !G.plate.includes(n)).join(', ') : '')
        : G.plateState === 'cooking' ? 'COOKING… ' + Math.ceil(RR.CONFIG.cookTime - G.plateTimer) + 's'
        : G.plateState === 'ready' ? 'READY — SERVE! (burns in ' + Math.ceil(RR.CONFIG.burnTime - G.plateTimer) + 's)'
        : 'BURNT! Press E at TRASH to clear';
      plate.className = 'plate-state ' + G.plateState;
    }
  }

  function addIngredient(name) {
    if (G.over) return false;
    const slot = G.hands.indexOf(null);
    if (slot === -1) { flash('Hands full! Plate them first (E at PLATING).'); return false; }
    G.hands[slot] = name;
    updateOrderCard();
    return true;
  }

  function nearestStation() {
    let best = null, bd = 1e9;
    RR.STATIONS.forEach((s) => {
      const d = Math.abs(s.x - G.chefX);
      if (d < bd) { bd = d; best = s; }
    });
    return bd < 1.3 ? best : null;
  }

  function interact() {
    if (G.over) return;
    const st = nearestStation();
    if (!st) { flash('Move closer to a station (WASD / arrows).'); return; }
    if (st.id === 'plating') {
      if (G.plateState !== 'empty' && G.plateState !== 'assembling') { flash('Plate is busy — finish or trash it first.'); return; }
      const carried = G.hands.filter(Boolean);
      if (!carried.length) { flash('Hands empty — take ingredients from the bins (1-8).'); return; }
      // figure out which recipe the plate is building
      if (!G.plateRecipe) {
        G.plateRecipe = RR.RECIPES.find((r) => carried.every((c) => r.needs.includes(c))) || null;
        if (!G.plateRecipe) { flash('Those ingredients match no recipe — trash them.'); return; }
      }
      const bad = carried.filter((c) => !G.plateRecipe.needs.includes(c) || G.plate.includes(c));
      if (bad.length) { flash('Wrong for ' + G.plateRecipe.name + ' — trash the extras.'); return; }
      G.plate.push(...carried);
      G.hands = [null, null];
      G.plateState = 'assembling';
      if (G.plateRecipe.needs.every((n) => G.plate.includes(n))) {
        flash(G.plateRecipe.name + ' assembled! Cook it at the GRILL (E).');
      }
      updateOrderCard(); updateHUD();
      return;
    }
    if (st.id === 'grill') {
      if (G.plateState === 'assembling' && G.plateRecipe && G.plateRecipe.needs.every((n) => G.plate.includes(n))) {
        G.plateState = 'cooking'; G.plateTimer = 0;
        G.chefAction = 'stirring'; G.chefActionT = RR.CONFIG.cookTime;
        flash('Cooking ' + G.plateRecipe.name + '…');
      } else if (G.plateState === 'cooking') {
        flash('Still cooking…');
      } else { flash('Assemble a full dish at PLATING first.'); }
      return;
    }
    if (st.id === 'trash') {
      G.hands = [null, null];
      G.plate = []; G.plateRecipe = null; G.plateState = 'empty'; G.plateTimer = 0;
      flash('Cleared.');
      updateOrderCard(); updateHUD();
      return;
    }
    if (st.id === 'sink') {
      G.hands = [null, null];
      flash('Hands washed.');
      updateOrderCard();
      return;
    }
    if (st.id === 'bell') { serve(); return; }
    if (st.id === 'tempura' || st.id === 'chop' || st.id === 'sauce') {
      G.chefAction = st.id === 'chop' ? 'chopping' : 'stirring';
      G.chefActionT = 0.9;
      flash(st.name + ' — nice and quick!');
      return;
    }
  }

  function serve() {
    if (G.plateState === 'ready' && G.plateRecipe) {
      const match = G.orders.find((o) => o.recipe.name === G.plateRecipe.name);
      if (match) {
        const gained = match.recipe.price * (1 + G.combo * 0.5);
        G.score += Math.round(gained * 10);
        G.money += Math.round(gained);
        G.combo += 1; G.comboTimer = RR.CONFIG.comboWindow;
        G.served += 1;
        G.orders.splice(G.orders.indexOf(match), 1);
        reactCustomer(match.seat, 'happy');
        flash('Served ' + match.recipe.name + ' +$' + Math.round(gained) + ' — COMBO x' + G.combo + '!');
      } else {
        G.score += 5;
        flash('Served, but nobody ordered it — small tip.');
        G.combo = 0;
      }
      G.plate = []; G.plateRecipe = null; G.plateState = 'empty'; G.plateTimer = 0;
    } else if (G.plateState === 'burnt') {
      flash('That dish is BURNT — trash it, don\'t serve it!');
    } else {
      flash('Nothing ready to serve — assemble + cook first.');
    }
    updateBoard(); updateOrderCard(); updateHUD();
  }

  function reactCustomer(seat, mood) {
    if (RR.people && RR.people.customers) {
      const c = RR.people.customers[seat - 1];
      if (c) {
        RR.setPersonState(c, mood);
        setTimeout(() => { if (c.userData.state === mood) RR.setPersonState(c, 'eating'); }, 2600);
      }
    }
  }

  let flashTimer = null;
  function flash(msg) {
    const n = el('toast');
    if (!n) return;
    n.textContent = msg;
    n.style.opacity = '1';
    clearTimeout(flashTimer);
    flashTimer = setTimeout(() => { n.style.opacity = '0'; }, 2600);
  }

  function startGame() {
    G.started = true;
    G.orders = [];
    newOrder(); newOrder();
    updateHUD(); updateBoard(); updateOrderCard();
    const title = el('title-screen');
    if (title) title.style.display = 'none';
  }

  function tick(dt) {
    if (!G.started || G.over) return;
    G.dayTime += dt;
    G.progress = Math.min(1, G.dayTime / RR.CONFIG.dayLength);
    // spawn tickets
    G.spawnTimer -= dt;
    if (G.spawnTimer <= 0 && G.orders.length < RR.CONFIG.maxTickets) {
      newOrder();
      G.spawnTimer = G.rush ? 4 : RR.CONFIG.orderSpawnEvery;
    }
    // rush hour cycle
    if (!G.rush) {
      G.rushTimer += dt;
      if (G.rushTimer > RR.CONFIG.rushEvery) { G.rush = true; G.rushLeft = RR.CONFIG.rushLength; G.rushTimer = 0; flash('RUSH HOUR! Orders are coming faster!'); }
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
        reactCustomer(o.seat, 'sad');
        flash('Order expired! A customer walked out. ♥-' + (3 - G.hearts) + ' lost');
        if (G.hearts <= 0) { G.over = true; flash('DAY OVER — the shop closed! Score ' + G.score); }
      }
    }
    // combo decay
    if (G.combo > 0) {
      G.comboTimer -= dt;
      if (G.comboTimer <= 0) G.combo = 0;
    }
    // plate cooking / burning
    if (G.plateState === 'cooking') {
      G.plateTimer += dt;
      if (G.plateTimer >= RR.CONFIG.cookTime) {
        G.plateState = 'ready'; G.plateTimer = 0;
        const o = G.orders.find((x) => x.recipe.name === (G.plateRecipe && G.plateRecipe.name));
        if (o) o.state = 'ready';
        flash('READY — SERVE! Ring the bell (Space).');
        updateBoard();
      }
    } else if (G.plateState === 'ready') {
      G.plateTimer += dt;
      if (G.plateTimer >= RR.CONFIG.burnTime) {
        G.plateState = 'burnt';
        const o = G.orders.find((x) => x.recipe.name === (G.plateRecipe && G.plateRecipe.name));
        if (o) o.state = 'burnt';
        flash('BURNT! The dish is ruined — trash it (E at TRASH).');
        updateBoard();
      }
    }
    // chef action timer
    if (G.chefActionT > 0) {
      G.chefActionT -= dt;
      if (G.chefActionT <= 0) G.chefAction = null;
    }
    // day end
    if (G.progress >= 1) {
      G.over = true;
      flash('DAY ' + G.day + ' COMPLETE! Score ' + G.score + ' · Served ' + G.served + ' · Missed ' + G.missed);
    }
    updateHUD();
    if (Math.floor(G.dayTime * 2) !== Math.floor((G.dayTime - dt) * 2)) updateBoard();
  }

  RR.gameApi = { newOrder, updateBoard, updateOrderCard, updateHUD, addIngredient, interact, serve, startGame, tick, flash, currentOrder };
})();
