// RAMEN RUSH — procedural characters.
// Every person is a small rig of primitives with a state machine driven by
// sin/cos animation: idle breathing, eating, chopping, stirring, carrying,
// queue shuffling, happy and sad reactions. No keyframed assets, no prior code.
(function () {
  const RR = (window.RR = window.RR || {});
  const T = THREE;

  function mat(color, opts) {
    return new T.MeshLambertMaterial(Object.assign({ color }, opts || {}));
  }
  function damp(cur, target, lambda, dt) {
    return cur + (target - cur) * Math.min(1, lambda * dt);
  }

  // Build one person. opts: {shirt, skin, hair, hairStyle, role, scale}
  // role: 'chef' (tall white hat) | 'customer' | 'staff'
  function makePerson(opts) {
    opts = opts || {};
    const shirt = opts.shirt !== undefined ? opts.shirt : 0x4a90d9;
    const skin = opts.skin !== undefined ? opts.skin : 0xf2c79b;
    const hair = opts.hair !== undefined ? opts.hair : 0x3a2a1a;
    const g = new T.Group();
    const s = opts.scale || 1;
    g.scale.setScalar(s);

    const body = new T.Mesh(new T.CapsuleGeometry(0.23, 0.42, 4, 10), mat(shirt));
    body.position.y = 0.72;
    g.add(body);

    // apron for chefs / staff
    if (opts.role === 'chef' || opts.role === 'staff') {
      const apron = new T.Mesh(new T.BoxGeometry(0.34, 0.5, 0.06), mat(0xf5f2ea));
      apron.position.set(0, 0.68, 0.2);
      g.add(apron);
    }

    const head = new T.Group();
    head.position.y = 1.28;
    const skull = new T.Mesh(new T.SphereGeometry(0.21, 14, 12), mat(skin));
    head.add(skull);
    // eyes (face looks toward +z)
    const eyeGeo = new T.SphereGeometry(0.028, 8, 6);
    const eyeMat = mat(0x1a1a1a);
    const eL = new T.Mesh(eyeGeo, eyeMat); eL.position.set(-0.075, 0.02, 0.185); head.add(eL);
    const eR = new T.Mesh(eyeGeo, eyeMat); eR.position.set(0.075, 0.02, 0.185); head.add(eR);
    // smile
    const smile = new T.Mesh(new T.TorusGeometry(0.05, 0.012, 6, 12, Math.PI), mat(0x8a4a3a));
    smile.position.set(0, -0.05, 0.19);
    smile.rotation.z = Math.PI;
    head.add(smile);
    g.add(head);

    // hair / hat
    const style = opts.hairStyle || 'hair';
    if (opts.role === 'chef') {
      const hat = new T.Mesh(new T.CylinderGeometry(0.16, 0.18, 0.22, 12), mat(0xffffff));
      hat.position.y = 0.28; head.add(hat);
      const hatTop = new T.Mesh(new T.SphereGeometry(0.17, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), mat(0xffffff));
      hatTop.position.y = 0.38; head.add(hatTop);
    } else if (style === 'bun') {
      const bun = new T.Mesh(new T.SphereGeometry(0.09, 10, 8), mat(hair));
      bun.position.set(0, 0.19, -0.03); head.add(bun);
      const cap = new T.Mesh(new T.SphereGeometry(0.215, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2.4), mat(hair));
      cap.position.y = 0.02; head.add(cap);
    } else if (style === 'cap') {
      const capTop = new T.Mesh(new T.CylinderGeometry(0.2, 0.21, 0.09, 12), mat(opts.capColor || 0xd94f3d));
      capTop.position.y = 0.14; head.add(capTop);
      const brim = new T.Mesh(new T.BoxGeometry(0.24, 0.02, 0.14), mat(opts.capColor || 0xd94f3d));
      brim.position.set(0, 0.1, 0.24); head.add(brim);
    } else if (style === 'band') {
      const band = new T.Mesh(new T.TorusGeometry(0.2, 0.03, 8, 16), mat(opts.bandColor || 0xd94f3d));
      band.position.y = 0.06; band.rotation.x = Math.PI / 2.2; head.add(band);
    } else {
      const cap = new T.Mesh(new T.SphereGeometry(0.215, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2.4), mat(hair));
      cap.position.y = 0.02; head.add(cap);
    }

    // arms: groups pivoted at the shoulder
    function makeArm(side) {
      const arm = new T.Group();
      arm.position.set(0.27 * side, 1.02, 0);
      const sleeve = new T.Mesh(new T.CapsuleGeometry(0.075, 0.3, 4, 8), mat(shirt));
      sleeve.position.y = -0.2;
      arm.add(sleeve);
      const hand = new T.Mesh(new T.SphereGeometry(0.07, 8, 6), mat(skin));
      hand.position.y = -0.42;
      arm.add(hand);
      g.add(arm);
      return arm;
    }
    const armL = makeArm(-1);
    const armR = makeArm(1);

    // legs (visible for standing / queue characters)
    const legGeo = new T.CapsuleGeometry(0.09, 0.22, 4, 8);
    const legMat = mat(0x3a3f4a);
    const legL = new T.Mesh(legGeo, legMat); legL.position.set(-0.11, 0.22, 0); g.add(legL);
    const legR = new T.Mesh(legGeo, legMat); legR.position.set(0.11, 0.22, 0); g.add(legR);

    // props: a small bowl (left hand) and chopsticks (right hand)
    const bowl = new T.Group();
    const bowlMesh = new T.Mesh(new T.CylinderGeometry(0.13, 0.09, 0.09, 12), mat(0x2e6fb0));
    bowl.add(bowlMesh);
    const food = new T.Mesh(new T.SphereGeometry(0.1, 10, 6), mat(0xf2d492));
    food.position.y = 0.05; food.scale.y = 0.5; bowl.add(food);
    bowl.position.set(0, -0.48, 0.05);
    bowl.visible = false;
    armL.add(bowl);
    const sticks = new T.Group();
    const stickGeo = new T.CylinderGeometry(0.012, 0.008, 0.3, 6);
    const stickMat = mat(0x8a5a2a);
    const s1 = new T.Mesh(stickGeo, stickMat); s1.position.set(-0.02, -0.5, 0.08); s1.rotation.x = 0.5; sticks.add(s1);
    const s2 = new T.Mesh(stickGeo, stickMat); s2.position.set(0.03, -0.5, 0.08); s2.rotation.x = 0.5; sticks.add(s2);
    sticks.visible = false;
    armR.add(sticks);
    // serving tray (both hands)
    const tray = new T.Group();
    const trayMesh = new T.Mesh(new T.CylinderGeometry(0.3, 0.3, 0.03, 16), mat(0xc9a06a));
    tray.add(trayMesh);
    const trayBowl = new T.Mesh(new T.CylinderGeometry(0.12, 0.08, 0.09, 12), mat(0xd94f3d));
    trayBowl.position.set(0, 0.06, 0); tray.add(trayBowl);
    tray.position.set(0, -0.48, 0.28);
    tray.visible = false;
    armL.add(tray);

    g.userData = {
      armL, armR, head, body, legL, legR, bowl, sticks, tray,
      state: opts.state || 'idle',
      phase: Math.random() * Math.PI * 2,
      speed: 0.9 + Math.random() * 0.25,
      baseY: 0, baseX: 0, baseZ: 0,
      walkPhase: 0,
      cur: { aLx: 0, aRx: 0, aLz: 0.12, aRz: -0.12, headX: 0, headY: 0, bob: 0 },
    };
    return g;
  }

  function setState(p, state) {
    p.userData.state = state;
    const u = p.userData;
    u.bowl.visible = state === 'eating';
    u.sticks.visible = state === 'eating';
    u.tray.visible = state === 'carrying' || state === 'serve';
  }

  // One frame of procedural life. t = seconds, dt = frame delta.
  function animatePerson(p, t, dt) {
    const u = p.userData;
    const ph = u.phase;
    const sp = u.speed;
    const c = u.cur;
    let aLx = 0, aRx = 0, aLz = 0.12, aRz = -0.12, headX = 0, headY = 0, bob = 0;
    let legSwing = 0;

    switch (u.state) {
      case 'eating': {
        // chopsticks lift to the mouth, head bows, repeat every ~2.2s
        const cyc = (t * sp * 0.45 + ph) % 1;
        const lift = cyc < 0.35 ? cyc / 0.35 : cyc < 0.55 ? 1 : 1 - (cyc - 0.55) / 0.45;
        const e = lift * lift * (3 - 2 * lift);
        aRx = -1.35 * e;
        aRz = -0.5 * e;
        aLx = -0.55 * e;
        headX = 0.28 * e;
        bob = Math.sin(t * 2 * sp + ph) * 0.012;
        break;
      }
      case 'chopping': {
        aRx = -0.7 + Math.sin(t * 9 * sp + ph) * 0.5;
        aRz = -0.25;
        aLx = -0.35;
        headX = 0.22;
        bob = Math.sin(t * 9 * sp + ph) * 0.008;
        break;
      }
      case 'stirring': {
        aRx = -0.95 + Math.sin(t * 5 * sp + ph) * 0.22;
        aRz = -0.3 + Math.cos(t * 5 * sp + ph) * 0.35;
        aLx = -0.4;
        headX = 0.18;
        headY = Math.sin(t * 1.2 * sp + ph) * 0.1;
        break;
      }
      case 'carrying': {
        aLx = -1.25; aRx = -1.25; aLz = 0.35; aRz = -0.35;
        bob = Math.abs(Math.sin(t * 5 * sp + ph)) * 0.03;
        legSwing = Math.sin(t * 5 * sp + ph) * 0.4;
        break;
      }
      case 'serve': {
        aRx = -1.5; aRz = -0.2;
        aLx = -1.2; aLz = 0.3;
        headX = -0.08;
        bob = Math.sin(t * 2 * sp + ph) * 0.01;
        break;
      }
      case 'happy': {
        bob = Math.abs(Math.sin(t * 6 * sp + ph)) * 0.14;
        aLx = -2.5; aRx = -2.5; aLz = 0.5; aRz = -0.5;
        headX = -0.15;
        break;
      }
      case 'sad': {
        headX = 0.5;
        aLx = 0.25; aRx = 0.25;
        bob = 0;
        break;
      }
      case 'queue': {
        // shuffle in place, look around, inch forward now and then
        bob = Math.sin(t * 1.6 * sp + ph) * 0.015;
        headY = Math.sin(t * 0.45 * sp + ph) * 0.5;
        p.position.x = u.baseX + Math.sin(t * 0.5 * sp + ph) * 0.07;
        p.position.z = u.baseZ + Math.max(0, Math.sin(t * 0.22 * sp + ph)) * -0.25;
        legSwing = Math.sin(t * 1.6 * sp + ph) * 0.12;
        break;
      }
      case 'walk': {
        legSwing = Math.sin(t * 6 * sp + ph) * 0.5;
        aLx = Math.sin(t * 6 * sp + ph) * 0.35;
        aRx = -Math.sin(t * 6 * sp + ph) * 0.35;
        bob = Math.abs(Math.sin(t * 6 * sp + ph)) * 0.035;
        break;
      }
      default: { // idle: breathing + small sway + look around
        bob = Math.sin(t * 2 * sp + ph) * 0.015;
        headY = Math.sin(t * 0.4 * sp + ph) * 0.22;
        headX = Math.sin(t * 0.7 * sp + ph * 2) * 0.05;
        aLx = Math.sin(t * 2 * sp + ph) * 0.05;
        aRx = Math.sin(t * 2 * sp + ph + 1) * 0.05;
      }
    }

    const k = Math.min(1, 10 * dt);
    c.aLx = damp(c.aLx, aLx, 10, dt);
    c.aRx = damp(c.aRx, aRx, 10, dt);
    c.aLz = damp(c.aLz, aLz, 10, dt);
    c.aRz = damp(c.aRz, aRz, 10, dt);
    c.headX = damp(c.headX, headX, 8, dt);
    c.headY = damp(c.headY, headY, 8, dt);
    c.bob = damp(c.bob, bob, 12, dt);

    u.armL.rotation.x = c.aLx; u.armL.rotation.z = c.aLz;
    u.armR.rotation.x = c.aRx; u.armR.rotation.z = c.aRz;
    u.head.rotation.x = c.headX; u.head.rotation.y = c.headY;
    u.legL.rotation.x = legSwing; u.legR.rotation.x = -legSwing;
    p.position.y = u.baseY + c.bob;
    u.body.scale.y = 1 + Math.sin(t * 2 * sp + ph) * 0.015; // breathing
  }

  RR.makePerson = makePerson;
  RR.setPersonState = setState;
  RR.animatePerson = animatePerson;
})();
