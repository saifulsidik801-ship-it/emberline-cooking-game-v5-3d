// RAMEN RUSH — bootstrap, render loop, input, live effects.
// The loop keeps every character breathing, chopping, eating and serving.
(function () {
  const RR = (window.RR = window.RR || {});
  const T = THREE;

  let renderer, scene, camera;
  const clock = new T.Clock();
  let elapsed = 0;
  const keys = {};
  let paused = false;
  let dragging = false, lastX = 0, lastY = 0;

  function init() {
    const container = document.getElementById('app');
    renderer = new T.WebGLRenderer({ antialias: true });
    renderer.setSize(1280, 720);
    renderer.setPixelRatio(1);
    renderer.setClearColor(0x1a120a);
    container.appendChild(renderer.domElement);

    scene = new T.Scene();
    scene.background = new T.Color(0x241708);
    scene.fog = new T.Fog(0x241708, 16, 30);
    camera = new T.PerspectiveCamera(58, 1280 / 720, 0.1, 100);
    RR.camera = camera;
    RR.cameraTarget = new T.Vector3(0, 1.2, -1);
    RR.orbit = { yaw: 0, pitch: 0 };
    RR.shotIndex = 1;

    RR.buildWorld(scene);
    buildPeople();
    buildPlateProps();
    bindInput();

    // default camera = shot 1 wide
    RR.applyShot(1);
    RR.gameApi.updateHUD();
    RR.gameApi.updateBoard();

    clock.start();
    requestAnimationFrame(loop);
    setTimeout(() => { window.__gameReady = true; }, 600);
  }

  function buildPeople() {
    const P = { chefs: [], customers: [], queue: [] };
    RR.people = P;

    // player chef (the one you move)
    const player = RR.makePerson({ role: 'chef', shirt: 0xf5f2ea, skin: 0xf2c79b, hair: 0x3a2a1a, scale: 1.12 });
    player.userData.baseY = 0.35; // stands on the raised kitchen floor
    player.position.set(0.5, 0, RR.CONFIG.chefZ);
    scene.add(player);
    P.player = player;
    addShadow(player, 0.45);

    // three working chefs along the workline
    const chefDefs = [
      { x: -4.5, state: 'stirring', shirt: 0xf5f2ea },
      { x: -2.8, state: 'stirring', shirt: 0xe8e2d4 },
      { x: -1.0, state: 'chopping', shirt: 0xf5f2ea },
    ];
    chefDefs.forEach((d) => {
      const c = RR.makePerson({ role: 'chef', shirt: d.shirt, skin: 0xe8b88a, hair: 0x222222, scale: 1.12 });
      c.userData.baseY = 0.35; // raised kitchen floor
      c.position.set(d.x, 0, RR.CONFIG.chefZ);
      RR.setPersonState(c, d.state);
      scene.add(c);
      P.chefs.push(c);
      addShadow(c, 0.45);
    });

    // eight seated customers, varied looks, backs to the front camera
    const looks = [
      { shirt: 0xd94f3d, hairStyle: 'bun', hair: 0x1a1a1a },
      { shirt: 0x4a90d9, hairStyle: 'cap', capColor: 0x2e6b34 },
      { shirt: 0xe8a83e, hairStyle: 'hair', hair: 0x6b4423 },
      { shirt: 0x8a5fd0, hairStyle: 'band', bandColor: 0xd94f8a },
      { shirt: 0x4f9e57, hairStyle: 'hair', hair: 0x111111 },
      { shirt: 0xe88a2e, hairStyle: 'bun', hair: 0x4a2c14 },
      { shirt: 0x2e6b8a, hairStyle: 'cap', capColor: 0xd94f3d },
      { shirt: 0xc96a9a, hairStyle: 'hair', hair: 0x888888 },
    ];
    const eatStates = ['eating', 'eating', 'idle', 'eating', 'happy', 'eating', 'eating', 'idle'];
    RR.SEATS.forEach((x, i) => {
      const c = RR.makePerson(Object.assign({ role: 'customer' }, looks[i]));
      c.position.set(x, 0.55, RR.CONFIG.seatZ);
      c.rotation.y = Math.PI; // face the kitchen
      RR.setPersonState(c, eatStates[i]);
      scene.add(c);
      P.customers.push(c);
    });

    // queue of three standing customers, shifting in line
    const queueLooks = [
      { shirt: 0x7a5a3a, hairStyle: 'hair', hair: 0x222222 },
      { shirt: 0xd9a441, hairStyle: 'cap', capColor: 0x2e6b34 },
      { shirt: 0x5a7d9a, hairStyle: 'bun', hair: 0x111111 },
      { shirt: 0x4f9e57, hairStyle: 'band', bandColor: 0x2e6b34 },
      { shirt: 0x8a9ab0, hairStyle: 'hair', hair: 0x3a2a1a },
      { shirt: 0xd94f3d, hairStyle: 'cap', capColor: 0xd94f3d },
    ];
    RR.QUEUE_SPOTS.forEach((s, i) => {
      const c = RR.makePerson(Object.assign({ role: 'customer' }, queueLooks[i]));
      c.position.set(s.x, 0, s.z);
      c.rotation.y = Math.PI + 0.35; // angled toward the menu board
      c.userData.baseX = s.x;
      c.userData.baseZ = s.z;
      RR.setPersonState(c, 'queue');
      scene.add(c);
      P.queue.push(c);
      addShadow(c, 0.4);
    });

    // one waiter carrying a tray across the dining floor (left side)
    const waiter = RR.makePerson({ role: 'staff', shirt: 0x2e6b8a, skin: 0xe8b88a, hairStyle: 'hair', hair: 0x111111 });
    waiter.position.set(-6.0, 0, 4.2);
    waiter.rotation.y = Math.PI; // facing the kitchen
    RR.setPersonState(waiter, 'carrying');
    scene.add(waiter);
    P.waiter = waiter;
    addShadow(waiter, 0.4);

    // two diners eating at the new side table (right dining area)
    P.diners = [];
    [[7.0, 6.6, 0xd94f8a], [8.0, 6.6, 0x4a90d9]].forEach(([x, z, shirt]) => {
      const d = RR.makePerson({ role: 'customer', shirt, hairStyle: 'hair', hair: 0x222222 });
      d.position.set(x, 0.55, z);
      d.rotation.y = Math.PI; // face the kitchen, like the counter customers
      RR.setPersonState(d, 'eating');
      scene.add(d);
      P.diners.push(d);
    });
  }

  function addShadow(person, r) {
    const m = new T.Mesh(
      new T.CircleGeometry(r, 16),
      new T.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.2, depthWrite: false })
    );
    m.rotation.x = -Math.PI / 2;
    m.position.y = 0.02;
    person.add(m);
  }

  // small props that visualise the plate + carried ingredients
  let plateDots = [], handDots = [], readySign, burntSign;
  function buildPlateProps() {
    const mk = (color) => {
      const m = new T.Mesh(new T.SphereGeometry(0.09, 8, 6), new T.MeshLambertMaterial({ color }));
      m.visible = false;
      scene.add(m);
      return m;
    };
    for (let i = 0; i < 3; i++) plateDots.push(mk(0xffffff));
    for (let i = 0; i < 2; i++) handDots.push(mk(0xffffff));
    function textSign(text, color) {
      const c = document.createElement('canvas');
      c.width = 512; c.height = 128;
      const g = c.getContext('2d');
      g.fillStyle = 'rgba(20,12,6,0.92)'; g.fillRect(0, 0, 512, 128);
      g.fillStyle = color; g.font = 'bold 56px sans-serif'; g.textAlign = 'center';
      g.fillText(text, 256, 84);
      const tex = new T.CanvasTexture(c);
      const m = new T.Mesh(
        new T.PlaneGeometry(1.2, 0.3),
        new T.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false })
      );
      m.visible = false;
      scene.add(m);
      return m;
    }
    readySign = textSign('READY — SERVE!', '#7ddb8a');
    readySign.position.set(2.6, 1.5, -2.6);
    burntSign = textSign('BURNT!', '#ff8a7a');
    burntSign.position.set(2.6, 1.5, -2.6);
  }

  function updatePlateProps() {
    const G = RR.game;
    // dots on the plating bar
    G.plate.forEach((name, i) => {
      const bin = RR.BINS.find((b) => b.name === name);
      if (plateDots[i]) {
        plateDots[i].visible = true;
        plateDots[i].material.color.setHex(bin ? bin.color : 0xffffff);
        plateDots[i].position.set(2.25 + i * 0.35, 1.18, -2.8);
      }
    });
    for (let i = G.plate.length; i < 3; i++) plateDots[i].visible = false;
    // dots in the player's hands
    G.hands.forEach((name, i) => {
      if (handDots[i]) {
        if (name) {
          const bin = RR.BINS.find((b) => b.name === name);
          handDots[i].visible = true;
          handDots[i].material.color.setHex(bin ? bin.color : 0xffffff);
          const px = RR.people.player.position.x;
          handDots[i].position.set(px + (i === 0 ? -0.32 : 0.32), 0.95, RR.CONFIG.chefZ + 0.35);
        } else handDots[i].visible = false;
      }
    });
    // (The floating READY/BURNT 3D signs were cut: from the dining angles
    // they landed on top of the bell label and the menu board. The plate
    // state already shows in the HUD bar and on the order board.)
    readySign.visible = false;
    burntSign.visible = false;
  }

  function bindInput() {
    window.addEventListener('keydown', (e) => {
      keys[e.key.toLowerCase()] = true;
      if (e.key === 'Enter' && !RR.game.started) RR.gameApi.startGame();
      if (e.key.toLowerCase() === 'e') RR.gameApi.interact();
      if (e.key === ' ') { e.preventDefault(); RR.gameApi.serve(); }
      if (e.key.toLowerCase() === 'p') { paused = !paused; }
      if (e.key.toLowerCase() === 'c') {
        RR.shotIndex = (RR.shotIndex % 4) + 1;
        RR.applyShot(RR.shotIndex);
      }
      const bin = RR.BINS.find((b) => b.key === e.key);
      if (bin) RR.gameApi.addIngredient(bin.name);
    });
    window.addEventListener('keyup', (e) => { keys[e.key.toLowerCase()] = false; });
    const cv = renderer.domElement;
    cv.addEventListener('mousedown', (e) => { dragging = true; lastX = e.clientX; lastY = e.clientY; });
    window.addEventListener('mouseup', () => { dragging = false; });
    window.addEventListener('mousemove', (e) => {
      if (!dragging) return;
      RR.orbit.yaw += (e.clientX - lastX) * 0.004;
      RR.orbit.pitch = Math.max(-0.25, Math.min(0.35, RR.orbit.pitch + (e.clientY - lastY) * 0.003));
      lastX = e.clientX; lastY = e.clientY;
    });
    cv.addEventListener('click', (e) => {
      // click a bin bowl to take that ingredient
      const rect = cv.getBoundingClientRect();
      const mouse = new T.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
      );
      const ray = new T.Raycaster();
      ray.setFromCamera(mouse, camera);
      const bowls = Object.values(RR.world.bins).map((b) => b.group);
      const hits = ray.intersectObjects(bowls, true);
      if (hits.length) {
        let o = hits[0].object;
        while (o.parent && o.parent !== scene) o = o.parent;
        const entry = Object.entries(RR.world.bins).find(([, v]) => v.group === o);
        if (entry) RR.gameApi.addIngredient(entry[0]);
      }
    });
    window.addEventListener('resize', () => {
      renderer.setSize(1280, 720);
      camera.aspect = 1280 / 720;
      camera.updateProjectionMatrix();
    });
  }

  function updateCamera() {
    const s = RR.SHOTS[RR.shotIndex - 1];
    if (!s) return;
    const yaw = RR.orbit.yaw, pitch = RR.orbit.pitch;
    const base = new T.Vector3(s.pos[0], s.pos[1], s.pos[2]);
    const target = new T.Vector3(s.target[0], s.target[1], s.target[2]);
    // orbit around the target
    const off = base.clone().sub(target);
    const cosY = Math.cos(yaw), sinY = Math.sin(yaw);
    const x = off.x * cosY - off.z * sinY;
    const z = off.x * sinY + off.z * cosY;
    off.set(x, off.y + pitch * 4, z);
    camera.position.copy(target).add(off);
    camera.lookAt(target);
  }

  function updateEffects(dt) {
    const W = RR.world;
    // steam: rise, swell, fade, recycle
    W.steam.forEach((s) => {
      s.phase += dt * s.speed;
      const cyc = s.phase % 1;
      s.sprite.position.y = s.y + cyc * 1.1;
      s.sprite.position.x = s.x + Math.sin(s.phase * 6) * 0.08;
      const sc = 0.35 + cyc * 0.6;
      s.sprite.scale.set(sc, sc, 1);
      s.sprite.material.opacity = 0.55 * (1 - cyc);
    });
    // flames flicker
    W.flames.forEach((f, i) => {
      const fl = 0.85 + Math.sin(elapsed * 13 + i * 2.4) * 0.25 + Math.sin(elapsed * 29 + i) * 0.08;
      f.scale.set(fl, 0.8 + Math.sin(elapsed * 17 + i * 3) * 0.35, fl);
    });
    if (W.grillLight) W.grillLight.intensity = 1.0 + Math.sin(elapsed * 11) * 0.25;
    // lanterns sway gently and glow
    W.lanternLights.forEach((L) => {
      L.grp.rotation.z = Math.sin(elapsed * 0.8 + L.phase) * 0.03;
      L.light.intensity = 0.85 + Math.sin(elapsed * 2.2 + L.phase) * 0.1;
    });
  }

  function movePlayer(dt) {
    const G = RR.game;
    const P = RR.people.player;
    let dir = 0;
    if (keys['a'] || keys['arrowleft']) dir -= 1;
    if (keys['d'] || keys['arrowright']) dir += 1;
    G.chefMoving = dir !== 0;
    if (dir !== 0) {
      G.chefX = Math.max(RR.CONFIG.chefXMin, Math.min(RR.CONFIG.chefXMax, G.chefX + dir * RR.CONFIG.chefSpeed * dt));
      P.position.x = G.chefX;
      P.rotation.y = dir > 0 ? Math.PI / 2 : -Math.PI / 2;
    } else {
      P.rotation.y = 0;
    }
    // player state follows what he is doing
    if (G.chefAction) RR.setPersonState(P, G.chefAction === 'stirring' ? 'stirring' : 'chopping');
    else if (G.chefMoving) RR.setPersonState(P, 'walk');
    else if (G.hands.some(Boolean)) RR.setPersonState(P, 'carrying');
    else if (P.userData.state === 'walk' || P.userData.state === 'carrying' || P.userData.state === 'chopping' || P.userData.state === 'stirring') RR.setPersonState(P, 'idle');
  }

  function loop() {
    requestAnimationFrame(loop);
    const dt = Math.min(0.05, clock.getDelta());
    if (!paused) {
      elapsed += dt;
      const P = RR.people;
      if (P) {
        RR.animatePerson(P.player, elapsed, dt);
        P.chefs.forEach((c) => RR.animatePerson(c, elapsed, dt));
        P.customers.forEach((c) => RR.animatePerson(c, elapsed, dt));
        P.queue.forEach((c) => RR.animatePerson(c, elapsed, dt));
        if (P.waiter) RR.animatePerson(P.waiter, elapsed, dt);
        if (P.diners) P.diners.forEach((c) => RR.animatePerson(c, elapsed, dt));
      }
      updateEffects(dt);
      movePlayer(dt);
      RR.gameApi.tick(dt);
      updatePlateProps();
      updateCamera();
    }
    renderer.render(scene, camera);
  }

  window.addEventListener('DOMContentLoaded', init);
})();
