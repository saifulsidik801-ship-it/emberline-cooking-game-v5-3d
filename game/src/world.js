// RAMEN RUSH — the 3D room: wooden floor, long counter, cooking stations,
// wall menu board, lanterns, posters, plants. Built from scratch in Three.js.
(function () {
  const RR = (window.RR = window.RR || {});
  const T = THREE;

  function canvasTex(w, h, draw) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    draw(c.getContext('2d'), w, h);
    const tex = new T.CanvasTexture(c);
    tex.anisotropy = 4;
    return { tex, canvas: c, ctx: c.getContext('2d') };
  }
  function lam(color, opts) {
    return new T.MeshLambertMaterial(Object.assign({ color }, opts || {}));
  }
  function box(w, h, d, color, x, y, z, parent) {
    const m = new T.Mesh(new T.BoxGeometry(w, h, d), lam(color));
    m.position.set(x, y, z);
    (parent || RR.world.scene).add(m);
    return m;
  }
  function shadowBlob(x, z, r, parent) {
    const m = new T.Mesh(
      new T.CircleGeometry(r, 20),
      new T.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.22, depthWrite: false })
    );
    m.rotation.x = -Math.PI / 2;
    m.position.set(x, 0.02, z);
    (parent || RR.world.scene).add(m);
    return m;
  }

  function buildWorld(scene) {
    RR.world = { scene, steam: [], flames: [], lanternLights: [], bins: {}, stations: {} };
    const W = RR.world;

    // ---- lights ----
    scene.add(new T.AmbientLight(0xfff1d6, 0.55));
    const sun = new T.DirectionalLight(0xffe8c0, 0.85);
    sun.position.set(4, 8, 6);
    scene.add(sun);
    const warm = new T.PointLight(0xffb066, 0.7, 12);
    warm.position.set(0, 3.4, 1.5);
    scene.add(warm);

    // ---- floor: wooden planks (canvas texture) ----
    const floorTex = canvasTex(512, 512, (g, w, h) => {
      g.fillStyle = '#a4713d'; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 8; i++) {
        g.fillStyle = i % 2 ? '#96622f' : '#b07a45';
        g.fillRect(0, i * 64, w, 62);
        g.fillStyle = 'rgba(60,30,5,0.55)';
        g.fillRect(0, i * 64 + 62, w, 2);
        g.fillRect(((i * 173) % 512), i * 64, 2, 62);
        g.fillStyle = 'rgba(255,220,160,0.08)';
        g.fillRect(0, i * 64 + 6, w, 10);
      }
    });
    floorTex.tex.wrapS = floorTex.tex.wrapT = T.RepeatWrapping;
    floorTex.tex.repeat.set(4, 4);
    const floor = new T.Mesh(new T.PlaneGeometry(20, 17), new T.MeshLambertMaterial({ map: floorTex.tex }));
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, 0, 3);
    scene.add(floor);

    // ---- walls ----
    const wallMat = lam(0xe8d9bd);
    const backWall = new T.Mesh(new T.PlaneGeometry(20, 5.5), wallMat);
    backWall.position.set(0, 2.75, -4.5);
    scene.add(backWall);
    const leftWall = new T.Mesh(new T.PlaneGeometry(17, 5.5), lam(0xdcc49c));
    leftWall.rotation.y = Math.PI / 2;
    leftWall.position.set(-9.5, 2.75, 3);
    scene.add(leftWall);
    const rightWall = new T.Mesh(new T.PlaneGeometry(17, 5.5), lam(0xdcc49c));
    rightWall.rotation.y = -Math.PI / 2;
    rightWall.position.set(9.5, 2.75, 3);
    scene.add(rightWall);
    // wood wainscot strip on the back wall
    box(20, 1.1, 0.08, 0x7a4a22, 0, 0.55, -4.44, scene);
    // ceiling beam
    box(20, 0.35, 0.4, 0x5a3418, 0, 4.6, 0, scene);

    // ---- ceiling (warm wood) so no shot looks up into a black void ----
    const ceil = new T.Mesh(new T.PlaneGeometry(20, 17), lam(0x6b4a26));
    ceil.rotation.x = Math.PI / 2;
    ceil.position.set(0, 5.0, 3);
    scene.add(ceil);

    // ---- menu board (canvas texture, redrawn live by game.js) ----
    const board = canvasTex(1024, 512, (g) => { g.fillStyle = '#2b1d12'; g.fillRect(0, 0, 1024, 512); });
    const boardMesh = new T.Mesh(
      new T.PlaneGeometry(7.0, 3.2),
      new T.MeshLambertMaterial({ map: board.tex })
    );
    boardMesh.position.set(-0.5, 2.7, -4.42);
    scene.add(boardMesh);
    box(7.3, 3.5, 0.08, 0x4a2c14, -0.5, 2.7, -4.48, scene).position.z = -4.48;
    // board frame sits behind the plane; bring plane slightly forward
    boardMesh.position.z = -4.42;
    W.board = board;
    W.drawBoard = function (orders) { drawBoard(board, orders); };

    // ---- posters on the back wall (right side) ----
    function poster(x, y, bg, title, sub, z, rotY) {
      const t = canvasTex(256, 340, (g, w, h) => {
        g.fillStyle = bg; g.fillRect(0, 0, w, h);
        g.fillStyle = '#fff8ea'; g.fillRect(10, 10, w - 20, h - 20);
        g.fillStyle = bg; g.font = 'bold 44px sans-serif'; g.textAlign = 'center';
        g.fillText(title, w / 2, 90);
        g.beginPath(); g.arc(w / 2, 180, 52, 0, Math.PI * 2);
        g.fillStyle = '#d94f3d'; g.fill();
        g.fillStyle = '#f2d492'; g.beginPath(); g.arc(w / 2, 180, 34, 0, Math.PI * 2); g.fill();
        g.fillStyle = '#333'; g.font = 'bold 26px sans-serif';
        g.fillText(sub, w / 2, 290);
      });
      const m = new T.Mesh(new T.PlaneGeometry(1.1, 1.45), new T.MeshLambertMaterial({ map: t.tex }));
      m.position.set(x, y, z === undefined ? -4.44 : z);
      m.rotation.y = rotY || 0;
      scene.add(m);
    }
    poster(3.4, 2.7, '#1d4e89', 'RAMEN', 'SINCE 1987');
    poster(4.8, 2.7, '#7a1f2b', 'SUSHI', 'FRESH DAILY');
    poster(6.2, 2.7, '#2e6b34', 'TEMPURA', 'CRISPY!');
    // more posters: fill the bare ends of the back wall + both side walls
    poster(7.6, 2.7, '#8a5a2e', 'GYOZA', 'PAN-FRIED');
    poster(-8.6, 2.7, '#5a3a6e', 'SAKE', 'HOT & COLD');
    poster(-9.44, 2.7, '#2e6b34', 'EBI', 'CRISPY SHRIMP', -1.0, Math.PI / 2);
    poster(-9.44, 2.7, '#7a1f2b', 'MATCHA', 'GREEN TEA', 1.5, Math.PI / 2);
    poster(9.44, 2.7, '#8a5a2e', 'UDON', 'THICK NOODLE', -1.0, -Math.PI / 2);
    poster(9.44, 2.7, '#1d4e89', 'DONBURI', 'RICE BOWL', 1.5, -Math.PI / 2);

    // ---- small chalkboard menu (back wall, far right) ----
    const chalk = canvasTex(256, 340, (g, w, h) => {
      g.fillStyle = '#20242a'; g.fillRect(0, 0, w, h);
      g.strokeStyle = '#8a6a3a'; g.lineWidth = 10; g.strokeRect(5, 5, w - 10, h - 10);
      g.fillStyle = '#f5f2ea'; g.font = 'bold 30px sans-serif'; g.textAlign = 'center';
      g.fillText("TODAY'S", w / 2, 52);
      g.fillText('SPECIAL', w / 2, 88);
      g.fillStyle = '#ffd27a'; g.font = 'bold 26px sans-serif';
      g.fillText('TONKOTSU ¥850', w / 2, 150);
      g.fillText('GYOZA ¥400', w / 2, 195);
      g.fillText('SAKE ¥600', w / 2, 240);
      g.fillStyle = '#f5f2ea'; g.font = '22px sans-serif';
      g.fillText('— open till late —', w / 2, 300);
    });
    const chalkMesh = new T.Mesh(new T.PlaneGeometry(0.9, 1.2), new T.MeshLambertMaterial({ map: chalk.tex }));
    chalkMesh.position.set(8.9, 2.6, -4.44);
    scene.add(chalkMesh);

    // ---- shelf with bottles (back wall, left) ----
    box(2.4, 0.08, 0.3, 0x6b4423, -6.8, 2.5, -4.35, scene);
    const bottleColors = [0x2e6b34, 0xd9a441, 0xe8e2d4, 0x7a1f2b, 0x2e6b34];
    bottleColors.forEach((c, i) => {
      const b = new T.Mesh(new T.CylinderGeometry(0.09, 0.11, 0.42, 10), lam(c));
      b.position.set(-7.7 + i * 0.45, 2.75, -4.35);
      scene.add(b);
    });
    // wall clock
    const clock = new T.Mesh(new T.CylinderGeometry(0.32, 0.32, 0.06, 20), lam(0xf5f2ea));
    clock.rotation.x = Math.PI / 2;
    clock.position.set(-6.8, 3.9, -4.42);
    scene.add(clock);
    const hand = box(0.03, 0.22, 0.02, 0x222222, -6.8, 3.95, -4.38, scene);
    hand.geometry.translate(0, 0.08, 0);

    // ---- long counter ----
    const slatTex = canvasTex(512, 128, (g, w, h) => {
      g.fillStyle = '#8a5a2e'; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 16; i++) {
        g.fillStyle = i % 2 ? '#7a4a22' : '#96622f';
        g.fillRect(i * 32, 0, 30, h);
        g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(i * 32 + 30, 0, 2, h);
      }
    });
    slatTex.tex.wrapS = T.RepeatWrapping; slatTex.tex.repeat.set(3, 1);
    const counterFront = new T.Mesh(new T.BoxGeometry(12.4, 1.0, 1.5), new T.MeshLambertMaterial({ map: slatTex.tex }));
    counterFront.position.set(0, 0.5, 0);
    scene.add(counterFront);
    const counterTop = new T.Mesh(new T.BoxGeometry(12.8, 0.1, 1.9), lam(0xc99a5b));
    counterTop.position.set(0, 1.05, 0);
    scene.add(counterTop);
    shadowBlob(0, 1.2, 6.4, scene).scale.set(1, 0.35, 1);

    // ---- raised kitchen floor: the chefs stand one step up, so their
    // faces and upper bodies read above the counter from the dining side ----
    const platform = new T.Mesh(new T.BoxGeometry(12.5, 0.35, 1.4), new T.MeshLambertMaterial({ map: slatTex.tex }));
    platform.position.set(0, 0.175, -1.4);
    scene.add(platform);

    // ---- ingredient bins (8 bowls on the counter) ----
    RR.BINS.forEach((bin, i) => {
      const x = -5.6 + i * 1.6;
      const bowl = new T.Group();
      bowl.position.set(x, 1.12, 0.45);
      const cup = new T.Mesh(new T.CylinderGeometry(0.34, 0.24, 0.22, 14), lam(0x3a3f4a));
      bowl.add(cup);
      const fill = new T.Mesh(new T.SphereGeometry(0.28, 12, 8), lam(bin.color));
      fill.position.y = 0.1; fill.scale.y = 0.45;
      bowl.add(fill);
      // a few pieces on top
      for (let k = 0; k < 3; k++) {
        const piece = new T.Mesh(new T.SphereGeometry(0.07, 8, 6), lam(bin.color));
        piece.position.set((k - 1) * 0.12, 0.2, (k % 2 ? 0.08 : -0.08));
        bowl.add(piece);
      }
      scene.add(bowl);
      // label: number + name, faces the dining side
      const lt = canvasTex(256, 96, (g, w, h) => {
        g.fillStyle = 'rgba(20,14,8,0.92)'; g.fillRect(0, 0, w, h);
        g.fillStyle = '#ffd27a'; g.font = 'bold 40px sans-serif'; g.textAlign = 'left';
        g.fillText(bin.key, 14, 62);
        g.fillStyle = '#fff'; g.font = 'bold 30px sans-serif';
        g.fillText(bin.name, 62, 58);
      });
      const label = new T.Mesh(new T.PlaneGeometry(0.62, 0.23), new T.MeshLambertMaterial({ map: lt.tex, transparent: true }));
      label.position.set(x, 1.62, 0.62);
      scene.add(label);
      W.bins[bin.name] = { group: bowl, x };
    });

    // ---- back workline stations ----
    function stationTable(x, w, topColor) {
      const t = new T.Group();
      t.position.set(x, 0, -2.8);
      const top = new T.Mesh(new T.BoxGeometry(w, 0.12, 1.1), lam(topColor || 0xb98a56));
      top.position.y = 0.95; t.add(top);
      const bodyM = new T.Mesh(new T.BoxGeometry(w, 0.9, 1.0), lam(0x6b4423));
      bodyM.position.y = 0.45; t.add(bodyM);
      scene.add(t);
      return t;
    }
    function stationLabel(x, text) {
      const lt = canvasTex(512, 96, (g, w, h) => {
        g.fillStyle = 'rgba(20,14,8,0.9)'; g.fillRect(0, 0, w, h);
        g.fillStyle = '#fff'; g.font = 'bold 44px sans-serif'; g.textAlign = 'center';
        g.fillText(text, w / 2, 64);
      });
      const m = new T.Mesh(new T.PlaneGeometry(1.5, 0.28), new T.MeshLambertMaterial({ map: lt.tex, transparent: true }));
      m.position.set(x, 0.72, -2.24);
      scene.add(m);
    }

    // charcoal grill with flames
    stationTable(-4.5, 1.9);
    stationLabel(-4.5, 'CHARCOAL GRILL');
    const grillTop = box(1.5, 0.08, 0.8, 0x222222, -4.5, 1.05, -2.8, scene);
    const grillLight = new T.PointLight(0xff7733, 1.1, 5);
    grillLight.position.set(-4.5, 1.6, -2.4);
    scene.add(grillLight);
    W.grillLight = grillLight;
    for (let i = 0; i < 3; i++) {
      const flame = new T.Mesh(
        new T.ConeGeometry(0.16, 0.55, 8),
        new T.MeshBasicMaterial({ color: i === 1 ? 0xffd23e : 0xff7a1a, transparent: true, opacity: 0.9 })
      );
      flame.position.set(-4.9 + i * 0.4, 1.35, -2.8);
      scene.add(flame);
      W.flames.push(flame);
    }
    // pans on the grill
    [-4.9, -4.1].forEach((x) => {
      const pan = new T.Mesh(new T.CylinderGeometry(0.3, 0.26, 0.1, 14), lam(0x333333));
      pan.position.set(x, 1.12, -2.8); scene.add(pan);
      const food = new T.Mesh(new T.SphereGeometry(0.2, 10, 6), lam(0xe58aa0));
      food.position.set(x, 1.18, -2.8); food.scale.y = 0.4; scene.add(food);
    });

    // tempura pot with steam
    stationTable(-2.8, 1.7);
    stationLabel(-2.8, 'TEMPURA POT');
    const pot = new T.Mesh(new T.CylinderGeometry(0.5, 0.42, 0.5, 16), lam(0x8a8f96));
    pot.position.set(-2.8, 1.25, -2.8); scene.add(pot);
    const oil = new T.Mesh(new T.CylinderGeometry(0.44, 0.44, 0.04, 16), lam(0xe8a83e));
    oil.position.set(-2.8, 1.48, -2.8); scene.add(oil);
    W.potPos = new T.Vector3(-2.8, 1.55, -2.8);

    // chop board
    stationTable(-1.0, 1.7);
    stationLabel(-1.0, 'CHOP');
    const boardCut = box(1.1, 0.06, 0.7, 0xe8d9b0, -1.0, 1.04, -2.8, scene);
    const knife = box(0.5, 0.03, 0.09, 0xcccccc, -0.9, 1.1, -2.9, scene);
    knife.rotation.y = 0.5;
    const veg = new T.Mesh(new T.SphereGeometry(0.12, 8, 6), lam(0x8fd14f));
    veg.position.set(-1.2, 1.1, -2.7); scene.add(veg);

    // sauce & garnish rack
    stationTable(0.6, 1.7);
    stationLabel(0.6, 'SAUCE & GARNISH');
    const sauceColors = [0xd94f3d, 0xe8a83e, 0x4f9e57, 0x8a5fd0, 0xd94f8a];
    sauceColors.forEach((c, i) => {
      const b = new T.Mesh(new T.CylinderGeometry(0.09, 0.1, 0.34, 10), lam(c));
      b.position.set(0.0 + i * 0.3, 1.2, -2.8);
      scene.add(b);
    });

    // plating bar
    stationTable(2.6, 1.9);
    stationLabel(2.6, 'PLATING BAR');
    W.platingPos = new T.Vector3(2.6, 1.05, -2.8);
    [-0.4, 0.1, 0.6].forEach((dx, i) => {
      const plate = new T.Mesh(new T.CylinderGeometry(0.26, 0.2, 0.08, 14), lam(i === 1 ? 0xd94f3d : 0xf5f2ea));
      plate.position.set(2.6 + dx, 1.06, -2.8);
      scene.add(plate);
    });

    // sink
    stationTable(4.3, 1.4, 0x9fb8c8);
    stationLabel(4.3, 'SINK');
    const sinkBasin = box(0.9, 0.1, 0.6, 0x6fa8c8, 4.3, 1.02, -2.8, scene);
    const tap = new T.Mesh(new T.TorusGeometry(0.18, 0.03, 8, 12, Math.PI), lam(0xcccccc));
    tap.position.set(4.3, 1.15, -3.1); scene.add(tap);

    // trash
    stationTable(5.5, 1.1, 0x4a4a4a);
    stationLabel(5.5, 'TRASH');
    const trashBin = new T.Mesh(new T.CylinderGeometry(0.32, 0.26, 0.6, 12), lam(0x3a3a3a));
    trashBin.position.set(5.5, 1.3, -2.8); scene.add(trashBin);

    // serve bell on the counter
    const bell = new T.Group();
    bell.position.set(2.6, 1.12, 0.55);
    const bellBase = new T.Mesh(new T.CylinderGeometry(0.22, 0.26, 0.05, 14), lam(0x222222));
    bell.add(bellBase);
    const bellTop = new T.Mesh(new T.SphereGeometry(0.18, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2), lam(0xffd23e));
    bellTop.position.y = 0.05; bell.add(bellTop);
    const bellBtn = new T.Mesh(new T.SphereGeometry(0.05, 8, 6), lam(0xd94f3d));
    bellBtn.position.y = 0.2; bell.add(bellBtn);
    scene.add(bell);
    W.bell = bell;
    const bellLabel = canvasTex(256, 64, (g, w, h) => {
      g.fillStyle = 'rgba(20,14,8,0.9)'; g.fillRect(0, 0, w, h);
      g.fillStyle = '#ffd27a'; g.font = 'bold 30px sans-serif'; g.textAlign = 'center';
      g.fillText('RING TO SERVE', w / 2, 42);
    });
    const bl = new T.Mesh(new T.PlaneGeometry(0.7, 0.18), new T.MeshLambertMaterial({ map: bellLabel.tex, transparent: true }));
    bl.position.set(2.6, 1.5, 0.62); scene.add(bl);

    // finished dishes waiting on the counter (right side)
    [3.6, 4.2, 4.8].forEach((x, i) => {
      const plate = new T.Mesh(new T.CylinderGeometry(0.26, 0.2, 0.08, 14), lam(0xf5f2ea));
      plate.position.set(x, 1.14, 0.4); scene.add(plate);
      const food = new T.Mesh(new T.SphereGeometry(0.18, 10, 6), lam([0xf2d492, 0xe58aa0, 0x8fd14f][i]));
      food.position.set(x, 1.2, 0.4); food.scale.y = 0.45; scene.add(food);
      const steam = makeSteam(scene, x, 1.45, 0.4);
      W.steam.push(steam);
    });
    // steam over the tempura pot
    W.steam.push(makeSteam(scene, -2.8, 1.6, -2.8));
    W.steam.push(makeSteam(scene, -2.5, 1.6, -2.8));
    // steam over grill pans
    W.steam.push(makeSteam(scene, -4.5, 1.4, -2.8));

    // ---- hanging paper lanterns (5, warm glow, at the sides so they never
    // block the menu board; the extra three hang at different heights) ----
    const lanternSpots = [[-5.8, 3.6, -2.5], [5.8, 3.6, -2.5], [-8.0, 3.3, -2.5], [8.0, 3.9, -2.5], [7.2, 3.6, 2.0]];
    lanternSpots.forEach(([x, ly, lz]) => {
      const grp = new T.Group();
      grp.position.set(x, ly, lz);
      const cord = new T.Mesh(new T.CylinderGeometry(0.015, 0.015, 0.7, 6), lam(0x333333));
      cord.position.y = 0.35; grp.add(cord);
      const lamp = new T.Mesh(
        new T.SphereGeometry(0.42, 16, 12),
        new T.MeshBasicMaterial({ color: 0xffc27a })
      );
      lamp.scale.y = 0.85; grp.add(lamp);
      const capT = new T.Mesh(new T.CylinderGeometry(0.12, 0.16, 0.08, 10), lam(0x8a2f2f));
      capT.position.y = 0.38; grp.add(capT);
      const capB = new T.Mesh(new T.CylinderGeometry(0.16, 0.12, 0.08, 10), lam(0x8a2f2f));
      capB.position.y = -0.38; grp.add(capB);
      scene.add(grp);
      const light = new T.PointLight(0xffa050, 0.9, 7);
      light.position.set(x, ly - 0.4, lz);
      scene.add(light);
      W.lanternLights.push({ grp, light, phase: x });
    });

    // ---- second shelf with jars (right wall, above the bonsai table) ----
    box(0.3, 0.08, 2.0, 0x6b4423, 9.35, 2.6, 4.0, scene);
    const jarColors = [0xd9a441, 0x2e6b34, 0xd94f3d, 0xe8e2d4];
    jarColors.forEach((c, i) => {
      const j = new T.Mesh(new T.CylinderGeometry(0.11, 0.12, 0.3, 10), lam(c));
      j.position.set(9.35, 2.79, 3.3 + i * 0.47);
      scene.add(j);
      const lid = new T.Mesh(new T.CylinderGeometry(0.12, 0.12, 0.05, 10), lam(0x4a2c14));
      lid.position.set(9.35, 2.96, 3.3 + i * 0.47);
      scene.add(lid);
    });

    // ---- noren curtain over a passage on the left wall ----
    const norenRod = new T.Mesh(new T.CylinderGeometry(0.03, 0.03, 1.9, 8), lam(0x4a2c14));
    norenRod.rotation.x = Math.PI / 2;
    norenRod.position.set(-9.42, 3.15, 5.5);
    scene.add(norenRod);
    [-0.6, 0, 0.6].forEach((dz, i) => {
      const nTex = canvasTex(128, 256, (g, w, h) => {
        g.fillStyle = i === 1 ? '#7a1f2b' : '#2f3a6b'; g.fillRect(0, 0, w, h);
        g.fillStyle = '#f5f2ea'; g.beginPath(); g.arc(w / 2, 90, 42, 0, Math.PI * 2); g.fill();
        g.fillStyle = i === 1 ? '#7a1f2b' : '#2f3a6b'; g.beginPath(); g.arc(w / 2, 90, 26, 0, Math.PI * 2); g.fill();
        g.fillStyle = '#f5f2ea'; g.font = 'bold 34px sans-serif'; g.textAlign = 'center';
        g.fillText('RAMEN', w / 2, 200);
      });
      const panel = new T.Mesh(new T.PlaneGeometry(0.58, 1.4), new T.MeshLambertMaterial({ map: nTex.tex, side: T.DoubleSide }));
      panel.rotation.y = Math.PI / 2;
      panel.position.set(-9.42, 2.42, 5.5 + dz);
      scene.add(panel);
    });

    // ---- stools for customers ----
    RR.SEATS.forEach((x) => {
      const stool = new T.Group();
      stool.position.set(x, 0, RR.CONFIG.seatZ);
      const seat = new T.Mesh(new T.CylinderGeometry(0.3, 0.3, 0.08, 12), lam(0x7a4a22));
      seat.position.y = 0.55; stool.add(seat);
      const leg = new T.Mesh(new T.CylinderGeometry(0.06, 0.08, 0.55, 8), lam(0x4a2c14));
      leg.position.y = 0.27; stool.add(leg);
      scene.add(stool);
      shadowBlob(x, RR.CONFIG.seatZ, 0.4, scene);
    });

    // ---- bonsai on a side table (right) ----
    const table = new T.Group();
    table.position.set(8.3, 0, 3.6);
    const tTop = new T.Mesh(new T.BoxGeometry(1.2, 0.08, 0.8), lam(0x6b4423));
    tTop.position.y = 0.7; table.add(tTop);
    [[-0.5, -0.3], [0.5, -0.3], [-0.5, 0.3], [0.5, 0.3]].forEach(([dx, dz]) => {
      const leg = new T.Mesh(new T.BoxGeometry(0.08, 0.7, 0.08), lam(0x4a2c14));
      leg.position.set(dx, 0.35, dz); table.add(leg);
    });
    const potB = new T.Mesh(new T.CylinderGeometry(0.28, 0.2, 0.22, 12), lam(0x2e4a8a));
    potB.position.y = 0.85; table.add(potB);
    const trunk = new T.Mesh(new T.CylinderGeometry(0.05, 0.08, 0.5, 8), lam(0x5a3a1a));
    trunk.position.y = 1.15; table.add(trunk);
    [[0, 1.5, 0], [-0.2, 1.35, 0.1], [0.2, 1.4, -0.1]].forEach(([dx, dy, dz]) => {
      const leaf = new T.Mesh(new T.SphereGeometry(0.24, 10, 8), lam(0x2e6b34));
      leaf.position.set(dx, dy, dz); leaf.scale.y = 0.7; table.add(leaf);
    });
    scene.add(table);
    shadowBlob(8.3, 3.6, 0.8, scene);

    // ---- side dining table (right) with two stools for the extra diners ----
    const sideTable = new T.Group();
    sideTable.position.set(7.5, 0, 6.6);
    const sTop = new T.Mesh(new T.BoxGeometry(1.4, 0.08, 0.9), lam(0x6b4423));
    sTop.position.y = 0.7; sideTable.add(sTop);
    [[-0.6, -0.35], [0.6, -0.35], [-0.6, 0.35], [0.6, 0.35]].forEach(([dx, dz]) => {
      const leg = new T.Mesh(new T.BoxGeometry(0.08, 0.7, 0.08), lam(0x4a2c14));
      leg.position.set(dx, 0.35, dz); sideTable.add(leg);
    });
    // plates + bowls on the table
    [[-0.35, 0], [0.35, 0]].forEach(([dx, dz]) => {
      const plate = new T.Mesh(new T.CylinderGeometry(0.24, 0.18, 0.07, 14), lam(0xf5f2ea));
      plate.position.set(dx, 0.78, dz); sideTable.add(plate);
      const food = new T.Mesh(new T.SphereGeometry(0.15, 10, 6), lam(0xf2d492));
      food.position.set(dx, 0.83, dz); food.scale.y = 0.45; sideTable.add(food);
    });
    scene.add(sideTable);
    shadowBlob(7.5, 6.6, 0.9, scene);
    // stools for the two side-table diners
    [[7.0, 6.6], [8.0, 6.6]].forEach(([x, z]) => {
      const stool = new T.Group();
      stool.position.set(x, 0, z);
      const seat = new T.Mesh(new T.CylinderGeometry(0.3, 0.3, 0.08, 12), lam(0x7a4a22));
      seat.position.y = 0.55; stool.add(seat);
      const sleg = new T.Mesh(new T.CylinderGeometry(0.06, 0.08, 0.55, 8), lam(0x4a2c14));
      sleg.position.y = 0.27; stool.add(sleg);
      scene.add(stool);
      shadowBlob(x, z, 0.4, scene);
    });

    // ---- potted plants (corners) ----
    [[-8.3, 4.5], [-8.3, -3.2], [8.3, -3.2]].forEach(([x, z]) => {
      const potP = new T.Mesh(new T.CylinderGeometry(0.3, 0.22, 0.4, 12), lam(0x8a4a2a));
      potP.position.set(x, 0.2, z); scene.add(potP);
      for (let i = 0; i < 4; i++) {
        const leaf = new T.Mesh(new T.SphereGeometry(0.22, 8, 6), lam(0x3a7d3a));
        leaf.position.set(x + (Math.sin(i * 2.1) * 0.18), 0.6 + (i % 2) * 0.18, z + (Math.cos(i * 2.1) * 0.18));
        leaf.scale.y = 1.4; scene.add(leaf);
      }
      shadowBlob(x, z, 0.45, scene);
    });

    // (The hanging RAMEN RUSH sign was cut: from the side angles it crossed
    // the menu board. The title already lives in the HUD and on the board.)

    // ---- floor rug: a warm runner in the dining area so the foreground is not bare ----
    const rugTex = canvasTex(512, 256, (g, w, h) => {
      g.fillStyle = '#5a1620'; g.fillRect(0, 0, w, h);
      g.fillStyle = '#6e1f2b'; g.fillRect(14, 14, w - 28, h - 28);
      g.fillStyle = '#c9a06a';
      for (let i = 0; i < 8; i++) {
        const cx = 48 + i * 58, cy = h / 2;
        g.beginPath(); g.moveTo(cx, cy - 12); g.lineTo(cx + 12, cy); g.lineTo(cx, cy + 12); g.lineTo(cx - 12, cy); g.closePath(); g.fill();
      }
    });
    const rug = new T.Mesh(new T.PlaneGeometry(6.5, 3.2), new T.MeshLambertMaterial({ map: rugTex.tex }));
    rug.rotation.x = -Math.PI / 2;
    rug.position.set(0, 0.025, 5.6);
    scene.add(rug);

    // ---- serving cart with bowls on the red carpet (right edge) ----
    // two shelves + wheels + bowls, following the side-table pattern above
    const cart = new T.Group();
    cart.position.set(2.7, 0, 6.3);
    const cTop = new T.Mesh(new T.BoxGeometry(1.1, 0.07, 0.7), lam(0x6b4423));
    cTop.position.y = 0.78; cart.add(cTop);
    const cLow = new T.Mesh(new T.BoxGeometry(1.0, 0.06, 0.6), lam(0x7a4a22));
    cLow.position.y = 0.38; cart.add(cLow);
    [[-0.48, -0.28], [0.48, -0.28], [-0.48, 0.28], [0.48, 0.28]].forEach(([dx, dz]) => {
      const cLeg = new T.Mesh(new T.BoxGeometry(0.06, 0.78, 0.06), lam(0x4a2c14));
      cLeg.position.set(dx, 0.39, dz); cart.add(cLeg);
      const wheel = new T.Mesh(new T.SphereGeometry(0.07, 8, 6), lam(0x222222));
      wheel.position.set(dx, 0.07, dz); cart.add(wheel);
    });
    // bowls of noodles on the top shelf, a plate on the lower shelf
    [[-0.3, 0.82], [0.3, 0.82]].forEach(([dx, y]) => {
      const cBowl = new T.Mesh(new T.CylinderGeometry(0.16, 0.11, 0.1, 12), lam(0xd94f3d));
      cBowl.position.set(dx, y, 0); cart.add(cBowl);
      const cFood = new T.Mesh(new T.SphereGeometry(0.11, 10, 6), lam(0xf2d492));
      cFood.position.set(dx, y + 0.05, 0); cFood.scale.y = 0.5; cart.add(cFood);
    });
    const cPlate = new T.Mesh(new T.CylinderGeometry(0.2, 0.15, 0.06, 14), lam(0xf5f2ea));
    cPlate.position.set(0, 0.44, 0); cart.add(cPlate);
    scene.add(cart);
    shadowBlob(2.7, 6.3, 0.8, scene);
  }

  function makeSteam(scene, x, y, z) {
    const tex = canvasTex(64, 64, (g) => {
      const grad = g.createRadialGradient(32, 32, 4, 32, 32, 30);
      grad.addColorStop(0, 'rgba(255,255,255,0.85)');
      grad.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = grad; g.fillRect(0, 0, 64, 64);
    });
    const s = new T.Sprite(new T.SpriteMaterial({ map: tex.tex, transparent: true, opacity: 0.5, depthWrite: false }));
    s.position.set(x, y, z);
    s.scale.setScalar(0.4);
    scene.add(s);
    return { sprite: s, x, y, z, phase: Math.random() * 6, speed: 0.5 + Math.random() * 0.4 };
  }

  // Draw the wall menu board: title + ticket cards with timer bars.
  function drawBoard(board, orders) {
    const g = board.ctx, w = 1024, h = 512;
    g.fillStyle = '#241708'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#ffd27a'; g.font = 'bold 54px sans-serif'; g.textAlign = 'left';
    g.fillText('RAMEN RUSH', 28, 66);
    g.fillStyle = '#c9a06a'; g.font = 'bold 28px sans-serif';
    g.fillText('ORDER BOARD', 560, 60);
    g.fillStyle = '#d94f3d'; g.fillRect(28, 82, 300, 6);
    const cards = orders || [];
    for (let i = 0; i < 5; i++) {
      const x = 28 + i * 198, y = 110, cw = 182, ch = 380;
      g.fillStyle = i < cards.length ? '#f7ecd4' : 'rgba(247,236,212,0.16)';
      g.fillRect(x, y, cw, ch);
      if (i >= cards.length) {
        g.fillStyle = 'rgba(255,255,255,0.55)'; g.font = 'bold 30px sans-serif'; g.textAlign = 'center';
        g.fillText('WAITING…', x + cw / 2, y + ch / 2);
        continue;
      }
      const o = cards[i];
      const frac = Math.max(0, o.timeLeft / o.timeMax);
      g.fillStyle = '#222'; g.font = 'bold 30px sans-serif'; g.textAlign = 'left';
      g.fillText((i + 1) + '. ' + o.recipe.name, x + 12, y + 42);
      g.fillStyle = '#8a5a2a'; g.font = 'bold 24px sans-serif';
      g.fillText('Seat ' + o.seat + '  •  $' + o.recipe.price, x + 12, y + 78);
      // ingredient dots
      o.recipe.needs.forEach((n, k) => {
        const bin = RR.BINS.find((b) => b.name === n);
        g.fillStyle = bin ? '#' + bin.color.toString(16).padStart(6, '0') : '#999';
        g.beginPath(); g.arc(x + 28 + k * 52, y + 120, 18, 0, Math.PI * 2); g.fill();
        g.fillStyle = '#222'; g.font = 'bold 20px sans-serif'; g.textAlign = 'center';
        g.fillText(n.slice(0, 4), x + 28 + k * 52, y + 158);
      });
      // timer bar
      g.fillStyle = '#ddd'; g.fillRect(x + 12, y + 190, cw - 24, 22);
      g.fillStyle = frac > 0.5 ? '#4f9e57' : frac > 0.25 ? '#e8a83e' : '#d94f3d';
      g.fillRect(x + 12, y + 190, (cw - 24) * frac, 22);
      g.fillStyle = '#222'; g.font = 'bold 30px sans-serif'; g.textAlign = 'left';
      g.fillText(Math.ceil(o.timeLeft) + 's', x + 12, y + 248);
      g.fillStyle = o.state === 'ready' ? '#2e7d32' : o.state === 'burnt' ? '#7a1f2b' : '#666';
      g.font = 'bold 26px sans-serif';
      g.fillText(o.state === 'ready' ? 'READY — SERVE!' : o.state === 'burnt' ? 'BURNT!' : o.state === 'cooking' ? 'COOKING…' : 'NEW ORDER', x + 12, y + 292);
      g.fillStyle = '#999'; g.font = '24px sans-serif';
      g.fillText('press ' + (i + 1), x + 12, y + 340);
    }
    board.tex.needsUpdate = true;
  }

  RR.buildWorld = buildWorld;
})();
