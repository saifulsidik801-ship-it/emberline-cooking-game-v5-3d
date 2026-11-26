// RAMEN RUSH v6 — all drawing: 2D illustrated night-market yatai.
// Canvas 1280x720. Scene is drawn through a camera (scale/center) so shots can
// zoom in on the stations or the pass; the HUD is always drawn unzoomed.
(function () {
  const RR = (window.RR = window.RR || {});
  const W = 1280, H = 720;

  RR.cam = { scale: 1, cx: 640, cy: 380 };
  RR.fx = { steam: [], rain: [], embers: [] };
  for (let i = 0; i < 90; i++) RR.fx.rain.push({ x: Math.random() * W, y: Math.random() * H, s: 0.6 + Math.random() * 0.9 });
  for (let i = 0; i < 30; i++) RR.fx.steam.push({ x: 0, y: 0, ph: Math.random(), sp: 0.5 + Math.random() * 0.7, sx: 0 });
  for (let i = 0; i < 10; i++) RR.fx.embers.push({ x: 684, y: 190, ph: Math.random(), sp: 0.6 + Math.random() * 0.8 });

  function rr(g, x, y, w, h, r) {
    g.beginPath();
    g.moveTo(x + r, y);
    g.arcTo(x + w, y, x + w, y + h, r);
    g.arcTo(x + w, y + h, x, y + h, r);
    g.arcTo(x, y + h, x, y, r);
    g.arcTo(x, y, x + w, y, r);
    g.closePath();
  }
  function txt(g, s, x, y, size, color, align, weight, font) {
    g.fillStyle = color;
    g.font = (weight || '800') + ' ' + size + 'px ' + (font || "'Segoe UI', Arial, sans-serif");
    g.textAlign = align || 'left';
    g.textBaseline = 'alphabetic';
    g.fillText(s, x, y);
  }
  function circle(g, x, y, r, color) { g.fillStyle = color; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); }
  function shade(g, x, y, w, h, c1, c2) {
    const gr = g.createLinearGradient(x, y, x, y + h);
    gr.addColorStop(0, c1); gr.addColorStop(1, c2);
    g.fillStyle = gr; g.fillRect(x, y, w, h);
  }

  // ---- ingredient mini-icons: real food, drawn, no images ----
  // Each icon must read as the actual ingredient at a glance, even at r=5-6
  // (ticket dots, recipe-book dots) and at r=10-11 (bins, plate, hands).
  function ingIcon(g, name, x, y, r) {
    g.save();
    g.translate(x, y);
    g.lineCap = 'round'; g.lineJoin = 'round';
    if (name === 'Noodle') {
      // wavy yellow noodle bundle + gloss strand
      g.strokeStyle = '#f2d492'; g.lineWidth = Math.max(1.5, r * 0.26);
      for (let i = -1; i <= 1; i++) {
        g.beginPath(); g.moveTo(-r + 2, i * r * 0.42);
        g.bezierCurveTo(-r * 0.35, i * r * 0.42 - r * 0.45, r * 0.35, i * r * 0.42 + r * 0.45, r - 2, i * r * 0.42);
        g.stroke();
      }
      g.strokeStyle = '#fff3c9'; g.lineWidth = Math.max(1, r * 0.1);
      g.beginPath(); g.moveTo(-r + 4, -r * 0.42); g.bezierCurveTo(-r * 0.3, -r * 0.85, r * 0.3, -r * 0.05, r - 4, -r * 0.42); g.stroke();
    } else if (name === 'Cabbage') {
      // layered green leaves
      g.fillStyle = '#a8e063'; g.beginPath(); g.ellipse(0, r * 0.1, r * 0.95, r * 0.7, 0, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#7cc242'; g.beginPath(); g.ellipse(-r * 0.3, -r * 0.15, r * 0.6, r * 0.45, -0.4, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#c4ec8a'; g.beginPath(); g.ellipse(r * 0.25, -r * 0.25, r * 0.5, r * 0.4, 0.4, 0, Math.PI * 2); g.fill();
      g.strokeStyle = '#5d9430'; g.lineWidth = Math.max(1, r * 0.08);
      g.beginPath(); g.moveTo(-r * 0.6, r * 0.1); g.quadraticCurveTo(0, -r * 0.5, r * 0.6, r * 0.1); g.stroke();
    } else if (name === 'Negi') {
      // scallion rings: green rims, white centres, pale core
      const ring = (dx, dy, q) => {
        circle(g, dx, dy, q, '#3f8f46');
        circle(g, dx, dy, q * 0.55, '#f5f2ea');
        circle(g, dx, dy, q * 0.22, '#9ed69a');
      };
      ring(-r * 0.42, r * 0.1, r * 0.42); ring(r * 0.38, -r * 0.28, r * 0.4); ring(r * 0.15, r * 0.45, r * 0.36);
    } else if (name === 'Pork') {
      // chashu slice: pink meat, white fat ring, darker core + gloss
      g.fillStyle = '#e58aa0'; g.beginPath(); g.ellipse(0, 0, r * 0.95, r * 0.8, -0.3, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#f7d9de'; g.beginPath(); g.ellipse(0, 0, r * 0.62, r * 0.5, -0.3, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#d96a84'; g.beginPath(); g.ellipse(0, 0, r * 0.34, r * 0.26, -0.3, 0, Math.PI * 2); g.fill();
      g.fillStyle = 'rgba(255,255,255,0.5)'; g.beginPath(); g.ellipse(-r * 0.3, -r * 0.35, r * 0.25, r * 0.12, -0.5, 0, Math.PI * 2); g.fill();
    } else if (name === 'Chicken') {
      // golden yakitori piece with char stripes + gloss
      g.fillStyle = '#e8a54b'; rr(g, -r * 0.85, -r * 0.7, r * 1.7, r * 1.4, r * 0.45); g.fill();
      g.fillStyle = '#f6c177'; rr(g, -r * 0.6, -r * 0.5, r * 1.2, r * 0.8, r * 0.35); g.fill();
      g.strokeStyle = '#8a5a2e'; g.lineWidth = Math.max(1.2, r * 0.12);
      g.beginPath(); g.moveTo(-r * 0.4, -r * 0.55); g.lineTo(-r * 0.1, r * 0.55); g.stroke();
      g.beginPath(); g.moveTo(r * 0.25, -r * 0.55); g.lineTo(r * 0.55, r * 0.55); g.stroke();
      g.fillStyle = 'rgba(255,255,255,0.45)'; g.beginPath(); g.ellipse(-r * 0.25, -r * 0.3, r * 0.3, r * 0.12, -0.4, 0, Math.PI * 2); g.fill();
    } else if (name === 'Shrimp') {
      // orange curved shrimp: segmented body + tail fan
      g.strokeStyle = '#f08a5c'; g.lineWidth = Math.max(2, r * 0.5);
      g.beginPath(); g.arc(0, r * 0.12, r * 0.6, Math.PI * 0.85, Math.PI * 2.1); g.stroke();
      g.strokeStyle = '#ffbe8a'; g.lineWidth = Math.max(1.2, r * 0.22);
      g.beginPath(); g.arc(0, r * 0.12, r * 0.6, Math.PI * 1.15, Math.PI * 1.75); g.stroke();
      g.fillStyle = '#e86a3d';
      g.save(); g.translate(-r * 0.55, -r * 0.35); g.rotate(-0.7);
      g.beginPath(); g.moveTo(0, 0); g.lineTo(-r * 0.35, -r * 0.25); g.lineTo(-r * 0.3, r * 0.2); g.closePath(); g.fill();
      g.restore();
      g.strokeStyle = '#c25a2e'; g.lineWidth = Math.max(1, r * 0.09);
      g.beginPath(); g.moveTo(-r * 0.1, -r * 0.5); g.lineTo(-r * 0.05, -r * 0.28); g.stroke();
      g.beginPath(); g.moveTo(r * 0.42, -r * 0.32); g.lineTo(r * 0.3, -r * 0.12); g.stroke();
    } else if (name === 'Mushroom') {
      // shiitake: brown cap, cream stem, pale star cut + gloss
      g.fillStyle = '#8f6b3a'; g.beginPath(); g.arc(0, -r * 0.1, r * 0.75, Math.PI, 0); g.fill();
      g.fillStyle = '#a87c46'; g.beginPath(); g.arc(0, -r * 0.1, r * 0.6, Math.PI * 1.05, Math.PI * 1.95); g.fill();
      g.fillStyle = '#f5ead2'; g.fillRect(-r * 0.2, -r * 0.15, r * 0.4, r * 0.8);
      g.strokeStyle = '#f5ead2'; g.lineWidth = Math.max(1, r * 0.1);
      g.beginPath(); g.moveTo(-r * 0.25, -r * 0.55); g.lineTo(0, -r * 0.3); g.lineTo(r * 0.25, -r * 0.55); g.stroke();
      g.fillStyle = 'rgba(255,255,255,0.35)'; g.beginPath(); g.ellipse(-r * 0.3, -r * 0.5, r * 0.2, r * 0.1, -0.5, 0, Math.PI * 2); g.fill();
    } else { // Egg — ajitama half: white oval, glossy orange yolk
      g.fillStyle = '#fffdf5'; g.beginPath(); g.ellipse(0, 0, r * 0.9, r * 0.75, 0, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#ff9d2e'; g.beginPath(); g.arc(0, r * 0.05, r * 0.48, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#ffc93d'; g.beginPath(); g.arc(-r * 0.1, -r * 0.05, r * 0.3, 0, Math.PI * 2); g.fill();
      g.fillStyle = 'rgba(255,255,255,0.85)'; g.beginPath(); g.arc(-r * 0.18, -r * 0.12, r * 0.1, 0, Math.PI * 2); g.fill();
    }
    g.restore();
  }
  // A real ramen bowl: lacquered bowl + glossy broth + noodle swirls +
  // recognisable toppings from the recipe + narutomaki + nori + steam.
  function bowlIcon(g, recipe, x, y, r) {
    g.save(); g.translate(x, y);
    const tops = recipe.needs || [];
    const isRamen = recipe.name && /ramen|omakase/i.test(recipe.name);
    // steam wisps
    g.strokeStyle = 'rgba(255,255,255,0.75)'; g.lineWidth = Math.max(1.2, r * 0.08); g.lineCap = 'round';
    g.beginPath(); g.moveTo(-r * 0.3, -r * 1.15); g.quadraticCurveTo(-r * 0.1, -r * 1.45, -r * 0.3, -r * 1.7); g.stroke();
    g.beginPath(); g.moveTo(r * 0.25, -r * 1.1); g.quadraticCurveTo(r * 0.45, -r * 1.4, r * 0.25, -r * 1.65); g.stroke();
    // nori sheet standing at the back (ramen only)
    if (isRamen) {
      g.fillStyle = '#1d3a1d'; rr(g, r * 0.42, -r * 1.25, r * 0.34, r * 0.85, 2); g.fill();
      g.fillStyle = '#2a5230'; g.fillRect(r * 0.46, -r * 1.2, r * 0.1, r * 0.7);
    }
    // table shadow + bowl body
    g.fillStyle = '#1d1208'; g.beginPath(); g.ellipse(0, r * 0.62, r * 0.9, r * 0.26, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = recipe.bowl || '#c0392b';
    g.beginPath(); g.moveTo(-r, -r * 0.1);
    g.quadraticCurveTo(-r, r * 0.75, 0, r * 0.78);
    g.quadraticCurveTo(r, r * 0.75, r, -r * 0.1);
    g.closePath(); g.fill();
    // rim highlight
    g.strokeStyle = 'rgba(255,255,255,0.35)'; g.lineWidth = Math.max(1, r * 0.06);
    g.beginPath(); g.ellipse(0, -r * 0.1, r * 0.96, r * 0.3, 0, Math.PI, Math.PI * 2); g.stroke();
    // broth surface: warm amber + lighter pool + gloss arc
    g.fillStyle = '#c98f3f'; g.beginPath(); g.ellipse(0, -r * 0.08, r * 0.88, r * 0.34, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#e0aa58'; g.beginPath(); g.ellipse(-r * 0.15, -r * 0.14, r * 0.55, r * 0.18, 0, 0, Math.PI * 2); g.fill();
    g.strokeStyle = 'rgba(255,255,255,0.55)'; g.lineWidth = Math.max(1, r * 0.07);
    g.beginPath(); g.ellipse(0, -r * 0.08, r * 0.7, r * 0.24, 0, Math.PI * 1.15, Math.PI * 1.6); g.stroke();
    // noodle swirls on the broth
    g.strokeStyle = '#f2d492'; g.lineWidth = Math.max(1.2, r * 0.1);
    for (let i = -1; i <= 1; i++) {
      g.beginPath(); g.moveTo(-r * 0.55, r * 0.02 + i * r * 0.12);
      g.bezierCurveTo(-r * 0.2, r * 0.02 + i * r * 0.12 - r * 0.14, r * 0.2, r * 0.02 + i * r * 0.12 + r * 0.14, r * 0.55, r * 0.02 + i * r * 0.12);
      g.stroke();
    }
    // toppings from the recipe, arranged on the broth
    const pos = [[-r * 0.5, -r * 0.28], [r * 0.45, -r * 0.3], [0, -r * 0.42], [-r * 0.1, r * 0.1], [r * 0.2, r * 0.12]];
    tops.forEach((n, i) => { const p = pos[i % pos.length]; ingIcon(g, n, p[0], p[1], r * 0.34); });
    // narutomaki — white disc with pink spiral (ramen signature)
    if (isRamen) {
      g.save(); g.translate(r * 0.55, r * 0.05);
      circle(g, 0, 0, r * 0.26, '#fff');
      g.strokeStyle = '#ff7fa5'; g.lineWidth = Math.max(1, r * 0.07);
      g.beginPath(); g.arc(0, 0, r * 0.16, 0.3, Math.PI * 1.8); g.stroke();
      g.beginPath(); g.arc(0, 0, r * 0.07, Math.PI, Math.PI * 2.6); g.stroke();
      g.restore();
    }
    g.restore();
  }

  // ---- people ----
  function drawChef(g, x, y, s, opts) {
    // y = feet baseline. opts: {action, t, carrying, flip}
    const bob = opts.action === 'walk' ? Math.sin(opts.t * 14) * 2 * s : 0;
    const armSwing = opts.action === 'chopping' ? Math.sin(opts.t * 16) * 14 * s
      : opts.action === 'stirring' ? Math.sin(opts.t * 6) * 8 * s : 0;
    g.save(); g.translate(x, y + bob); g.scale(s, s);
    // legs
    g.fillStyle = '#3a2a1a';
    g.fillRect(-13, -26, 10, 26); g.fillRect(3, -26, 10, 26);
    // body: white shirt + green apron
    g.fillStyle = '#f5f2ea'; rr(g, -20, -62, 40, 40, 10); g.fill();
    g.fillStyle = '#2e6b34'; rr(g, -16, -52, 32, 32, 6); g.fill();
    g.fillStyle = '#ffd27a'; g.fillRect(-16, -52, 32, 5);
    // arms
    g.strokeStyle = '#f5f2ea'; g.lineWidth = 9; g.lineCap = 'round';
    g.beginPath(); g.moveTo(-18, -52);
    if (opts.action === 'carrying') { g.lineTo(-30, -34); g.lineTo(-6, -30); }
    else if (opts.action === 'chopping') { g.lineTo(-30, -58 + armSwing); }
    else if (opts.action === 'stirring') { g.lineTo(-26, -36 + armSwing * 0.4); g.lineTo(-8, -30); }
    else { g.lineTo(-24, -28); }
    g.stroke();
    g.beginPath(); g.moveTo(18, -52);
    if (opts.action === 'carrying') { g.lineTo(30, -34); g.lineTo(6, -30); }
    else if (opts.action === 'chopping') { g.lineTo(30, -58 - armSwing); }
    else if (opts.action === 'stirring') { g.lineTo(26, -36 - armSwing * 0.4); g.lineTo(8, -30); }
    else { g.lineTo(24, -28); }
    g.stroke();
    if (opts.carrying) { bowlIcon(g, { needs: opts.carrying, bowl: '#c0392b' }, 0, -32, 11); }
    // head + toque
    circle(g, 0, -72, 14, '#f2c79b');
    g.fillStyle = '#fff';
    g.beginPath(); g.arc(-9, -84, 7, 0, Math.PI * 2); g.arc(0, -88, 8, 0, Math.PI * 2); g.arc(9, -84, 7, 0, Math.PI * 2); g.fill();
    g.fillRect(-14, -86, 28, 8);
    g.fillStyle = '#222';
    circle(g, -5, -73, 1.8, '#222'); circle(g, 5, -73, 1.8, '#222');
    g.strokeStyle = '#7a4a21'; g.lineWidth = 1.6;
    g.beginPath(); g.arc(0, -68, 5, 0.15 * Math.PI, 0.85 * Math.PI); g.stroke();
    g.restore();
  }
  function drawCustomerBack(g, x, y, c, mood) {
    // y = stool baseline, back to viewer
    g.save(); g.translate(x, y);
    g.fillStyle = '#5a3a22'; g.fillRect(-16, -8, 32, 8); g.fillRect(-13, 0, 5, 14); g.fillRect(8, 0, 5, 14);
    g.fillStyle = c.color; rr(g, -19, -52, 38, 46, 12); g.fill();
    circle(g, 0, -62, 14, '#f2c79b');
    // hair from behind
    g.fillStyle = c.hair;
    if (c.style === 'bun') { g.beginPath(); g.arc(0, -66, 13, Math.PI, 0); g.fill(); circle(g, 0, -78, 6, c.hair); }
    else if (c.style === 'cap') { g.beginPath(); g.arc(0, -64, 13, Math.PI, 0); g.fill(); g.fillStyle = c.cap || '#2e6b34'; g.fillRect(-14, -70, 28, 7); }
    else if (c.style === 'band') { g.beginPath(); g.arc(0, -64, 13, Math.PI, 0); g.fill(); g.fillStyle = c.band || '#d94f8a'; g.fillRect(-14, -68, 28, 5); }
    else { g.beginPath(); g.arc(0, -64, 14, Math.PI * 0.9, Math.PI * 2.1); g.fill(); }
    // mood bubble
    g.fillStyle = 'rgba(20,12,6,0.92)'; circle(g, 20, -84, 13, 'rgba(20,12,6,0.92)');
    g.strokeStyle = '#ffd27a'; g.lineWidth = 2; g.beginPath(); g.arc(20, -84, 13, 0, Math.PI * 2); g.stroke();
    txt(g, mood, 20, -79, 15, '#fff', 'center');
    g.restore();
  }
  function drawQueuePerson(g, x, y, c, t, i) {
    const bob = Math.sin(t * 2 + i * 1.7) * 2;
    g.save(); g.translate(x, y + bob);
    // umbrella
    g.fillStyle = c.color; g.beginPath(); g.arc(0, -78, 26, Math.PI, 0); g.fill();
    g.strokeStyle = '#3a2a1a'; g.lineWidth = 2; g.beginPath(); g.moveTo(0, -78); g.lineTo(0, -48); g.stroke();
    // body + head
    g.fillStyle = c.color; rr(g, -13, -52, 26, 34, 9); g.fill();
    circle(g, 0, -60, 11, '#f2c79b');
    g.fillStyle = c.hair; g.beginPath(); g.arc(0, -62, 11, Math.PI, 0); g.fill();
    g.fillStyle = '#3a2a1a'; g.fillRect(-9, -18, 7, 18); g.fillRect(2, -18, 7, 18);
    g.restore();
  }

  // ---- stations ----
  function stationBox(g, st, t, active, near) {
    const x = st.x, y = 196, w = st.w, h = 96;
    g.save();
    if (near) { // cheap glow: translucent halo rect, no shadowBlur (SwiftShader is ~seconds per blurred frame)
      g.fillStyle = 'rgba(255,210,122,0.22)'; rr(g, x - w / 2 - 6, y - 6, w + 12, h + 12, 14); g.fill();
    }
    g.fillStyle = '#4a2c14'; rr(g, x - w / 2, y, w, h, 10); g.fill();
    g.fillStyle = '#6b4423'; rr(g, x - w / 2, y, w, 12, 10); g.fill();
    g.restore();
    // equipment per station
    const cx = x, cy = y + 52;
    if (st.id === 'broth' || st.id === 'noodle') {
      g.fillStyle = '#2b2b2b'; g.beginPath(); g.ellipse(cx, cy + 16, 42, 12, 0, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#3d3d3d'; rr(g, cx - 42, cy - 18, 84, 36, 8); g.fill();
      g.fillStyle = st.id === 'broth' ? '#8a5a2e' : '#e8c87a';
      g.beginPath(); g.ellipse(cx, cy - 16, 38, 9, 0, 0, Math.PI * 2); g.fill();
      // gloss on the liquid
      g.strokeStyle = 'rgba(255,255,255,0.45)'; g.lineWidth = 2;
      g.beginPath(); g.ellipse(cx - 8, cy - 18, 18, 4, 0, Math.PI * 1.1, Math.PI * 1.7); g.stroke();
      for (let i = 0; i < 3; i++) {
        const bx = cx - 22 + i * 22 + Math.sin(t * 3 + i * 2) * 3;
        circle(g, bx, cy - 18 - ((t * 14 + i * 9) % 10), 3.5, 'rgba(255,220,150,0.85)');
      }
      if (st.id === 'broth') {
        // noodle swirls lying in the rich broth + chashu and negi on top
        g.strokeStyle = '#f2d492'; g.lineWidth = 2.5; g.lineCap = 'round';
        for (let i = -1; i <= 1; i++) {
          g.beginPath(); g.moveTo(cx + i * 15 - 10, cy - 18 + i * 2.5);
          g.bezierCurveTo(cx + i * 15 - 3, cy - 24 + i * 2.5, cx + i * 15 + 3, cy - 12 + i * 2.5, cx + i * 15 + 10, cy - 18 + i * 2.5);
          g.stroke();
        }
        ingIcon(g, 'Pork', cx + 20, cy - 20, 7);
        ingIcon(g, 'Negi', cx - 20, cy - 20, 6);
      } else {
        // noodle boil: a lifted bundle on chopsticks
        g.strokeStyle = '#8a5a2e'; g.lineWidth = 3; g.lineCap = 'round';
        g.beginPath(); g.moveTo(cx - 6, cy - 52); g.lineTo(cx + 26, cy - 40); g.stroke();
        g.beginPath(); g.moveTo(cx - 2, cy - 48); g.lineTo(cx + 30, cy - 36); g.stroke();
        g.strokeStyle = '#f2d492'; g.lineWidth = 3;
        for (let i = -2; i <= 2; i++) { g.beginPath(); g.moveTo(cx + i * 7 - 4, cy - 24); g.quadraticCurveTo(cx + i * 7, cy - 40, cx + i * 7 + 4, cy - 24); g.stroke(); }
        g.strokeStyle = '#fff3c9'; g.lineWidth = 1.2;
        g.beginPath(); g.moveTo(cx - 12, cy - 28); g.quadraticCurveTo(cx, cy - 36, cx + 12, cy - 28); g.stroke();
      }
    } else if (st.id === 'chop') {
      g.fillStyle = '#d9b380'; rr(g, cx - 40, cy - 8, 80, 16, 5); g.fill();
      const ch = active ? Math.sin(t * 16) * 10 : 0;
      g.fillStyle = '#c9c9c9'; g.save(); g.translate(cx + 18, cy - 26 + ch); g.rotate(-0.5); g.fillRect(-16, -3, 32, 6); g.fillStyle = '#3a2a1a'; g.fillRect(14, -2, 12, 4); g.restore();
      // chopped negi rings scattered on the board
      [[-26, -12], [-14, -16], [-4, -11]].forEach(([dx, dy]) => {
        circle(g, cx + dx, cy + dy, 4.5, '#3f8f46');
        circle(g, cx + dx, cy + dy, 2.4, '#f5f2ea');
        circle(g, cx + dx, cy + dy, 1, '#9ed69a');
      });
      // cabbage shreds
      g.strokeStyle = '#8fd14f'; g.lineWidth = 3; g.lineCap = 'round';
      g.beginPath(); g.moveTo(cx + 8, cy - 16); g.lineTo(cx + 22, cy - 10); g.stroke();
      g.beginPath(); g.moveTo(cx + 12, cy - 8); g.lineTo(cx + 26, cy - 14); g.stroke();
      g.strokeStyle = '#c4ec8a'; g.lineWidth = 2;
      g.beginPath(); g.moveTo(cx + 6, cy - 5); g.lineTo(cx + 18, cy - 11); g.stroke();
      // a sliced mushroom
      ingIcon(g, 'Mushroom', cx + 32, cy - 12, 6);
    } else if (st.id === 'grill') {
      g.fillStyle = '#222'; rr(g, cx - 40, cy - 6, 80, 22, 6); g.fill();
      // glowing coals under the grate
      for (let i = 0; i < 4; i++) {
        circle(g, cx - 28 + i * 18, cy + 8, 4, i % 2 ? '#ff6a2a' : '#ffb03d');
      }
      for (let i = 0; i < 3; i++) {
        const fh = 14 + Math.sin(t * 11 + i * 2.4) * 6;
        g.fillStyle = i % 2 ? '#ff8a3d' : '#ffc93d';
        g.beginPath(); g.moveTo(cx - 28 + i * 24, cy - 6); g.lineTo(cx - 20 + i * 24, cy - 6 - fh); g.lineTo(cx - 12 + i * 24, cy - 6); g.fill();
      }
      g.strokeStyle = '#8a6a3a'; g.lineWidth = 3;
      g.beginPath(); g.moveTo(cx - 34, cy - 12); g.lineTo(cx + 34, cy - 12); g.stroke();
      ingIcon(g, 'Chicken', cx - 12, cy - 16, 8); ingIcon(g, 'Pork', cx + 14, cy - 16, 8);
      // smoke wisp
      g.strokeStyle = 'rgba(255,255,255,0.55)'; g.lineWidth = 2; g.lineCap = 'round';
      g.beginPath(); g.moveTo(cx + 26, cy - 30); g.quadraticCurveTo(cx + 32, cy - 40, cx + 26, cy - 48); g.stroke();
    } else if (st.id === 'plating') {
      const G = RR.game;
      g.fillStyle = '#f5f2ea'; g.beginPath(); g.ellipse(cx, cy + 6, 44, 13, 0, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#d9d2c2'; g.beginPath(); g.ellipse(cx, cy + 6, 30, 8, 0, 0, Math.PI * 2); g.fill();
      if (G.plate.length) {
        // a composed bowl: glossy broth + noodle swirls + the plated toppings
        const rec = G.plateRecipe || { name: 'Bowl', needs: G.plate.slice(), bowl: '#c0392b' };
        bowlIcon(g, rec, cx, cy - 2, 24);
        if (G.plateState === 'cooking' || G.plateState === 'ready') {
          const p = G.plateState === 'ready' ? 1 : G.plateTimer / RR.CONFIG.cookTime;
          g.strokeStyle = G.plateState === 'ready' ? '#7ddb8a' : '#ffd27a'; g.lineWidth = 5;
          g.beginPath(); g.arc(cx, cy - 2, 32, -Math.PI / 2, -Math.PI / 2 + p * Math.PI * 2); g.stroke();
        }
      } else {
        txt(g, 'EMPTY PLATE', cx, cy + 2, 11, '#8a7a5a', 'center');
      }
    } else if (st.id === 'pass') {
      const G = RR.game;
      g.fillStyle = '#7a1f2b'; rr(g, cx - 44, cy - 26, 88, 44, 8); g.fill();
      g.fillStyle = '#ffd27a'; g.beginPath(); g.arc(cx, cy - 8, 13, Math.PI, 0); g.fill();
      g.fillRect(cx - 13, cy - 8, 26, 4);
      circle(g, cx + 2, cy - 26, 3, '#ffd27a');
      if (G.plateState === 'ready') {
        g.fillStyle = '#7ddb8a'; rr(g, cx - 40, cy + 24, 80, 20, 8); g.fill();
        txt(g, 'ORDER UP!', cx, cy + 38, 13, '#12340f', 'center');
      } else {
        txt(g, 'RING THE BELL', cx, cy + 34, 11, '#e8dcc8', 'center');
      }
    }
    // label plate
    g.fillStyle = '#241708'; rr(g, x - w / 2 + 4, y + h + 4, w - 8, 22, 6); g.fill();
    g.strokeStyle = near ? '#ffd27a' : '#8a6a3a'; g.lineWidth = near ? 2.5 : 1.5;
    rr(g, x - w / 2 + 4, y + h + 4, w - 8, 22, 6); g.stroke();
    txt(g, st.name, x, y + h + 20, 12, near ? '#ffd27a' : '#e8dcc8', 'center');
    if (active) {
      txt(g, '● ' + st.verb, x, y - 8, 13, '#ffd27a', 'center');
    }
  }

  // ---- scene ----
  function drawScene(g, t) {
    const G = RR.game;
    // night sky + market lane behind the stall
    shade(g, 0, 0, W, H, '#1a1030', '#3a1c10');
    // distant neon signs
    // neon signs on the dark roof bar (y 158-184) so no text is cut by a
    // station box — the old y=196 signs hid behind the boxes and only their
    // tops peeked out as fragments
    const signs = [['居酒屋', '#ff5a7a', 250], ['BAR', '#4ad9ff', 700], ['24h', '#ffd27a', 1010]];
    signs.forEach(([s, c, x]) => {
      g.save(); g.globalAlpha = 0.85;
      txt(g, s, x + 2, 178, 26, c, 'left', '900'); // fake glow: offset copy in translucent color
      g.globalAlpha = 0.4; txt(g, s, x, 176, 26, c, 'left', '900');
      g.restore();
    });
    // rain streaks (behind stall)
    g.strokeStyle = 'rgba(180,200,255,0.35)'; g.lineWidth = 1.5;
    RR.fx.rain.forEach((r) => {
      g.beginPath(); g.moveTo(r.x, r.y); g.lineTo(r.x - 6, r.y + 16); g.stroke();
    });
    // stall roof + noren
    g.fillStyle = '#2b1a0e'; g.fillRect(180, 158, 920, 26);
    g.fillStyle = '#7a1f2b'; g.fillRect(560, 184, 160, 34);
    txt(g, 'ラーメン · RAMEN', 640, 208, 20, '#ffd27a', 'center', '900');
    // string lights sagging under the roof + hanging dried goods
    g.strokeStyle = '#3a2a1a'; g.lineWidth = 2;
    g.beginPath(); g.moveTo(210, 186); g.quadraticCurveTo(640, 214, 1070, 186); g.stroke();
    for (let i = 0; i < 13; i++) {
      const lx = 230 + i * 66, ly = 186 + Math.sin((i / 12) * Math.PI) * 20;
      const lc = ['#ffd27a', '#ff8a7a', '#7ddb8a', '#4ad9ff'][i % 4];
      g.save(); g.globalAlpha = 0.35; circle(g, lx, ly + 4, 9, lc); g.restore();
      circle(g, lx, ly + 4, 4, lc);
    }
    [[352, 'chili'], [928, 'garlic']].forEach(([hx, kind]) => {
      g.strokeStyle = '#3a2a1a'; g.lineWidth = 2;
      g.beginPath(); g.moveTo(hx, 184); g.lineTo(hx, 226); g.stroke();
      for (let i = 0; i < 4; i++) {
        if (kind === 'chili') { g.fillStyle = '#d94f3d'; g.beginPath(); g.ellipse(hx - 6 + (i % 2) * 12, 196 + i * 9, 4, 6, 0.3, 0, Math.PI * 2); g.fill(); }
        else { circle(g, hx - 6 + (i % 2) * 12, 196 + i * 9, 4.5, '#f5f2ea'); }
      }
    });
    // paper lanterns
    [[250, 210], [1030, 210]].forEach(([x, y], i) => {
      const sw = Math.sin(t * 0.8 + i * 2) * 4;
      g.save(); g.translate(x + sw, y);
      g.strokeStyle = '#3a2a1a'; g.lineWidth = 2; g.beginPath(); g.moveTo(0, -26); g.lineTo(0, -8); g.stroke();
      const lg = g.createRadialGradient(0, 0, 4, 0, 0, 34);
      lg.addColorStop(0, 'rgba(255,180,80,0.55)'); lg.addColorStop(1, 'rgba(255,180,80,0)');
      g.fillStyle = lg; circle(g, 0, 0, 34, lg);
      g.fillStyle = '#ff9a3d'; g.beginPath(); g.ellipse(0, 0, 16, 20, 0, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#7a1f2b'; g.fillRect(-16, -4, 32, 4); g.fillRect(-16, 2, 32, 4);
      g.restore();
    });
    // wood back wall
    g.fillStyle = '#4a2c14'; g.fillRect(204, 218, 872, 86);
    g.strokeStyle = 'rgba(0,0,0,0.35)'; g.lineWidth = 2;
    for (let x = 240; x < 1080; x += 72) { g.beginPath(); g.moveTo(x, 218); g.lineTo(x, 304); g.stroke(); }
    // stations
    const near = nearestStation();
    RR.STATIONS.forEach((st) => {
      const active = (G.chefActionStation === st.id && G.chefActionT > 0) ||
        (st.id === 'plating' && (G.plateState === 'cooking' || G.plateState === 'ready')) ||
        (st.id === 'grill' && G.plateState === 'cooking');
      stationBox(g, st, t, active, near === st);
    });
    // helper chefs
    drawChef(g, 300, 408, 0.92, { action: 'stirring', t });
    drawChef(g, 556, 408, 0.92, { action: 'chopping', t });
    // server at the pass (red shirt, no toque, tray with bowls)
    g.save(); g.translate(1006, 408);
    g.fillStyle = '#3a2a1a'; g.fillRect(-11, -24, 8, 24); g.fillRect(3, -24, 8, 24);
    g.fillStyle = '#d94f3d'; rr(g, -17, -56, 34, 34, 9); g.fill();
    circle(g, 0, -66, 12, '#f2c79b');
    g.fillStyle = '#1a1a1a'; g.beginPath(); g.arc(0, -68, 12, Math.PI, 0); g.fill();
    g.strokeStyle = '#d94f3d'; g.lineWidth = 7; g.lineCap = 'round';
    g.beginPath(); g.moveTo(-14, -46); g.lineTo(-26, -34); g.stroke();
    g.beginPath(); g.moveTo(14, -46); g.lineTo(26, -34); g.stroke();
    g.fillStyle = '#8a6a3a'; rr(g, -30, -40, 60, 6, 3); g.fill();
    bowlIcon(g, { needs: ['Noodle', 'Pork', 'Egg'], bowl: '#c0392b' }, -14, -48, 8);
    bowlIcon(g, { needs: ['Shrimp', 'Cabbage', 'Egg'], bowl: '#d35400' }, 14, -48, 8);
    g.restore();
    // floor props: crates + rice sacks + the stall cat
    g.fillStyle = '#6b4423'; g.fillRect(212, 396, 34, 26); g.fillRect(222, 372, 34, 26);
    g.strokeStyle = '#3a2a1a'; g.lineWidth = 2; g.strokeRect(212, 396, 34, 26); g.strokeRect(222, 372, 34, 26);
    g.fillStyle = '#d9c9a8'; g.beginPath(); g.ellipse(268, 410, 16, 12, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#c9b18a'; g.beginPath(); g.ellipse(268, 400, 10, 6, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#2b2b2b'; // the cat, asleep on the right crate
    g.beginPath(); g.ellipse(1052, 404, 16, 9, 0, 0, Math.PI * 2); g.fill();
    circle(g, 1064, 394, 7, '#2b2b2b');
    g.beginPath(); g.moveTo(1060, 389); g.lineTo(1062, 382); g.lineTo(1065, 388); g.fill();
    g.strokeStyle = '#2b2b2b'; g.lineWidth = 3; g.beginPath(); g.moveTo(1038, 404); g.quadraticCurveTo(1028, 396, 1032, 388); g.stroke();
    // grill embers
    RR.fx.embers.forEach((e) => {
      g.fillStyle = 'rgba(255,' + Math.floor(140 + e.ph * 80) + ',40,' + (0.9 * (1 - e.ph)).toFixed(2) + ')';
      g.beginPath(); g.arc(e.x, e.y, 2.5, 0, Math.PI * 2); g.fill();
    });
    // player chef — "YOU" sits in the gap between the station label plates
    // (y 296-318) and the chef's head, never on top of a label; carried
    // ingredients ride at the chef's hands, not over a station label either
    drawChef(g, G.chefX, 408, 1.05, { action: G.chefAction || (G.chefMoving ? 'walk' : 'idle'), t, carrying: G.hands.some(Boolean) ? null : null });
    txt(g, 'YOU', G.chefX, 330, 12, '#ffd27a', 'center');
    if (G.hands.some(Boolean)) {
      G.hands.forEach((n, i) => {
        if (!n) return;
        const hx = G.chefX + (i === 0 ? -24 : 24);
        circle(g, hx, 402, 11, 'rgba(20,12,6,0.9)');
        ingIcon(g, n, hx, 402, 8);
      });
    }
    // counter with bins
    g.fillStyle = '#6b4423'; rr(g, 204, 424, 872, 18, 6); g.fill();
    g.fillStyle = '#8a5a2e'; g.fillRect(204, 424, 872, 5);
    RR.BINS.forEach((b, i) => {
      const bx = 232 + i * 102, by = 452;
      const needed = G.orders[0] && G.orders[0].recipe.needs.includes(b.name) && !G.plate.includes(b.name) && !G.hands.includes(b.name);
      g.fillStyle = '#3a2412'; rr(g, bx - 42, by - 6, 84, 52, 9); g.fill();
      if (needed) { g.strokeStyle = '#ffd27a'; g.lineWidth = 2.5; rr(g, bx - 42, by - 6, 84, 52, 9); g.stroke(); }
      g.fillStyle = '#f5f2ea'; g.beginPath(); g.ellipse(bx, by + 12, 30, 9, 0, 0, Math.PI * 2); g.fill();
      g.fillStyle = b.color; g.beginPath(); g.ellipse(bx, by + 10, 26, 7, 0, 0, Math.PI * 2); g.fill();
      ingIcon(g, b.name, bx, by + 2, 10);
      g.fillStyle = '#241708'; circle(g, bx - 34, by - 2, 10, '#241708');
      txt(g, b.key, bx - 34, by + 2, 12, '#ffd27a', 'center');
      txt(g, b.name.toUpperCase(), bx, by + 40, 10, needed ? '#ffd27a' : '#e8dcc8', 'center');
    });
    // seated customers (backs to viewer)
    const seated = seatCustomers();
    seated.forEach((s) => {
      if (s) drawCustomerBack(g, s.x, RR.SEAT_Y + 34, s.c, s.mood);
      else {
        // empty stool
        g.fillStyle = '#5a3a22'; g.fillRect(s ? s.x - 16 : 0, RR.SEAT_Y + 26, 32, 8);
      }
    });
    // queue with umbrellas
    G.queue.slice(0, 3).forEach((q, i) => {
      const sp = RR.QUEUE_SPOTS[i];
      drawQueuePerson(g, sp.x, sp.y + 30, q.c, t, i);
      txt(g, q.c.name.split(' ')[0], sp.x, sp.y + 48, 11, '#e8dcc8', 'center');
    });
    // steam particles
    RR.fx.steam.forEach((s) => {
      const a = 0.5 * (1 - s.ph);
      g.fillStyle = 'rgba(255,255,255,' + a.toFixed(2) + ')';
      g.beginPath(); g.arc(s.x, s.y, 5 + s.ph * 12, 0, Math.PI * 2); g.fill();
    });
  }
  function nearestStation() {
    const G = RR.game;
    let best = null, bd = 1e9;
    RR.STATIONS.forEach((st) => { const d = Math.abs(st.x - G.chefX); if (d < bd) { bd = d; best = st; } });
    return bd < 90 ? best : null;
  }
  function moodFor(o) {
    const f = o.timeLeft / o.timeMax;
    return f > 0.6 ? '😊' : f > 0.3 ? '😐' : '😠';
  }
  function seatCustomers() {
    const G = RR.game;
    return RR.SEAT_X.map((x, i) => {
      const o = G.orders.find((ord) => ord.seat === i + 1);
      if (o) return { x, c: o.customer, mood: moodFor(o) };
      const idle = G.idleSeats[i];
      return idle ? { x, c: idle, mood: '😊' } : null;
    });
  }

  // ---- HUD ----
  function drawTickets(g, t) {
    const G = RR.game;
    for (let i = 0; i < RR.CONFIG.maxTickets; i++) {
      const x = 8 + i * 212, y = 64, w = 204, h = 84;
      const o = G.orders[i];
      if (!o) {
        g.strokeStyle = 'rgba(232,220,200,0.35)'; g.setLineDash([6, 5]); g.lineWidth = 1.5;
        rr(g, x, y, w, h, 9); g.stroke(); g.setLineDash([]);
        txt(g, 'WAITING…', x + w / 2, y + 48, 13, 'rgba(232,220,200,0.5)', 'center');
        continue;
      }
      const crit = o.customer === RR.CRITIC;
      g.fillStyle = '#f7ead0'; rr(g, x, y, w, h, 9); g.fill();
      g.fillStyle = o.recipe.color; rr(g, x, y, w, 26, 9); g.fill();
      g.fillRect(x, y + 18, w, 8);
      txt(g, o.recipe.short, x + 8, y + 18, 14, '#fff', 'left', '900');
      txt(g, '$' + o.recipe.price, x + w - 8, y + 18, 14, '#fff', 'right', '900');
      if (i === 0) { g.strokeStyle = '#ffd27a'; g.lineWidth = 3; rr(g, x, y, w, h, 9); g.stroke(); }
      if (crit) { g.strokeStyle = '#8a5fd0'; g.lineWidth = 3; rr(g, x + 2, y + 2, w - 4, h - 4, 8); g.stroke(); }
      txt(g, (crit ? '★ ' : '') + o.customer.name, x + 8, y + 44, 12, '#241708', 'left', '800');
      txt(g, moodFor(o), x + w - 10, y + 44, 15, '#241708', 'right');
      // ingredient dots
      o.recipe.needs.forEach((n, j) => {
        const have = G.plate.includes(n) || G.hands.includes(n);
        const dx = x + 20 + j * 26, dy = y + 60;
        circle(g, dx, dy, 9, have ? '#2e6b34' : '#d9c9a8');
        if (have) txt(g, '✓', dx, dy + 4, 11, '#fff', 'center', '900');
        else ingIcon(g, n, dx, dy, 6);
      });
      // timer bar
      const f = Math.max(0, o.timeLeft / o.timeMax);
      g.fillStyle = '#d9c9a8'; rr(g, x + 96, y + 52, 96, 12, 6); g.fill();
      g.fillStyle = f > 0.5 ? '#4f9e57' : f > 0.25 ? '#e8a83e' : '#d94f3d';
      if (f > 0) { rr(g, x + 96, y + 52, 96 * f, 12, 6); g.fill(); }
      txt(g, Math.ceil(o.timeLeft) + 's', x + w - 8, y + 78, 12, f <= 0.25 ? '#d94f3d' : '#5a4a30', 'right', '900');
    }
  }
  function drawTopbar(g) {
    const G = RR.game;
    shade(g, 0, 0, W, 58, '#2b1d12', '#1d1208');
    g.fillStyle = '#d94f3d'; g.fillRect(0, 56, W, 3);
    txt(g, 'RAMEN RUSH', 16, 34, 28, '#ffd27a', 'left', '900');
    txt(g, 'YATAI · NIGHT ' + G.day + '/3 · RAIN', 16, 50, 11, '#ff8a7a', 'left', '800');
    // day progress + timer
    g.fillStyle = '#4a3421'; rr(g, 330, 22, 220, 12, 6); g.fill();
    g.fillStyle = '#7ddb8a'; if (G.progress > 0) { rr(g, 330, 22, 220 * G.progress, 12, 6); g.fill(); }
    txt(g, 'NIGHT ' + G.day + '/3', 330, 50, 11, '#ffe9a8', 'left', '800');
    const left = Math.max(0, RR.CONFIG.dayLength - G.dayTime);
    txt(g, Math.floor(left / 60) + ':' + String(Math.floor(left % 60)).padStart(2, '0'), 640, 38, 30, '#fff', 'center', '900');
    txt(g, 'GOAL ¥' + RR.CONFIG.dayGoal + ' · ¥' + G.money, 760, 34, 15, '#ffe9a8', 'left', '800');
    txt(g, 'SCORE ' + G.score.toLocaleString(), 760, 52, 13, '#ffd27a', 'left', '900');
    txt(g, 'COMBO x' + G.combo, 1000, 36, 20, '#ffb066', 'left', '900');
    txt(g, '♥'.repeat(Math.max(0, G.hearts)) + '♡'.repeat(Math.max(0, 3 - G.hearts)), 1000, 52, 15, '#ff6b81', 'left');
    txt(g, 'BEST ' + G.best, 1180, 36, 13, '#c9b18a', 'left', '800');
    if (G.rush) {
      // slim pill in the gap below the ticket row (tickets end y=148) — never
      // over ticket text, which the old y=62 pill covered.
      g.fillStyle = '#d94f3d'; rr(g, 480, 150, 320, 26, 13); g.fill();
      txt(g, '⚡ RUSH HOUR — ORDERS x2!', 640, 168, 15, '#fff', 'center', '900');
    }
  }
  function drawSidePanels(g) {
    const G = RR.game;
    // LEFT: recipe book + goals + dialogue
    g.fillStyle = 'rgba(20,14,8,0.92)'; rr(g, 8, 158, 188, 446, 10); g.fill();
    g.strokeStyle = '#6b4423'; g.lineWidth = 2; rr(g, 8, 158, 188, 446, 10); g.stroke();
    txt(g, '📖 RECIPE BOOK', 18, 182, 13, '#ffd27a', 'left', '900');
    RR.RECIPES.forEach((r, i) => {
      const y = 192 + i * 32;
      bowlIcon(g, r, 34, y + 8, 11);
      txt(g, r.name, 52, y + 9, 11, '#ffe9a8', 'left', '700');
      txt(g, '$' + r.price, 186, y + 9, 11, '#7ddb8a', 'right', '800');
      r.needs.forEach((n, j) => {
        const dx = 56 + j * 14;
        ingIcon(g, n, dx, y + 21, 5);
      });
    });
    txt(g, '🎯 GOALS', 18, 402, 13, '#ffd27a', 'left', '900');
    RR.GOALS.forEach((gl, i) => {
      const done = !!G.goals[gl.id];
      txt(g, done ? '✓' : '☐', 18, 422 + i * 22, 13, done ? '#7ddb8a' : '#c9b18a', 'left', '900');
      txt(g, gl.label, 38, 422 + i * 22, 12, done ? '#7ddb8a' : '#e8dcc8', 'left', done ? '800' : '400');
    });
    // dialogue
    const d = G.dialogue;
    g.fillStyle = 'rgba(43,29,18,0.9)'; rr(g, 14, 500, 176, 96, 9); g.fill();
    g.strokeStyle = '#8a6a3a'; g.lineWidth = 1.5; rr(g, 14, 500, 176, 96, 9); g.stroke();
    circle(g, 36, 524, 14, d.c.color);
    txt(g, d.c.name.split(' ')[0][0], 36, 529, 14, '#fff', 'center', '900');
    txt(g, d.c.name, 56, 522, 11, '#ffd27a', 'left', '800');
    wrapText(g, '“' + d.line + '”', 56, 538, 128, 13, '#ffe9a8', 12);
    // RIGHT: next in line + critic + tonight
    g.fillStyle = 'rgba(20,14,8,0.92)'; rr(g, 1084, 158, 188, 446, 10); g.fill();
    g.strokeStyle = '#6b4423'; g.lineWidth = 2; rr(g, 1084, 158, 188, 446, 10); g.stroke();
    txt(g, '🚶 NEXT IN LINE', 1094, 182, 13, '#ffd27a', 'left', '900');
    G.queue.forEach((q, i) => {
      const y = 192 + i * 48;
      circle(g, 1112, y + 12, 14, q.c.color);
      txt(g, q.c.name.split(' ')[0][0], 1112, y + 17, 14, '#fff', 'center', '900');
      txt(g, q.c.name, 1132, y + 10, 12, '#ffe9a8', 'left', '800');
      txt(g, 'waits ' + Math.ceil(q.wait) + 's', 1132, y + 28, 11, '#c9b18a', 'left');
    });
    if (!G.queue.length) txt(g, 'No queue — the lane is quiet…', 1094, 210, 12, '#c9b18a', 'left');
    // critic card
    txt(g, '⭐ THE CRITIC', 1094, 352, 13, '#ffd27a', 'left', '900');
    g.fillStyle = 'rgba(43,29,18,0.9)'; rr(g, 1090, 360, 176, 86, 9); g.fill();
    if (G.criticServed) {
      circle(g, 1118, 386, 16, RR.CRITIC.color);
      txt(g, 'H', 1118, 391, 15, '#fff', 'center', '900');
      txt(g, 'Hana · Critic', 1140, 382, 12, '#ffd27a', 'left', '800');
      txt(g, 'SERVED ★★★★★', 1140, 400, 12, '#7ddb8a', 'left', '800');
      txt(g, '“Five stars. I will write', 1098, 424, 11, '#ffe9a8', 'left');
      txt(g, 'about this yatai.”', 1098, 438, 11, '#ffe9a8', 'left');
    } else if (G.criticActive) {
      circle(g, 1118, 386, 16, '#8a5fd0');
      txt(g, '?', 1118, 391, 15, '#fff', 'center', '900');
      txt(g, '??? — at the counter!', 1140, 382, 12, '#ff8a7a', 'left', '800');
      txt(g, 'Serve her Omakase!', 1140, 400, 12, '#ffe9a8', 'left');
      txt(g, 'Pays 3×. Do not keep', 1098, 424, 11, '#ffe9a8', 'left');
      txt(g, 'her waiting.', 1098, 438, 11, '#ffe9a8', 'left');
    } else {
      circle(g, 1118, 386, 16, '#3a2a1a');
      txt(g, '?', 1118, 391, 15, '#c9b18a', 'center', '900');
      txt(g, 'Hidden critic…', 1140, 382, 12, '#c9b18a', 'left', '800');
      txt(g, 'Arrives after ' + Math.max(0, 5 - G.served) + ' more serves.', 1140, 400, 11, '#ffe9a8', 'left');
      txt(g, 'Word is she only eats', 1098, 424, 11, '#ffe9a8', 'left');
      txt(g, 'Omakase.', 1098, 438, 11, '#ffe9a8', 'left');
    }
    txt(g, '🌙 TONIGHT', 1094, 478, 13, '#ffd27a', 'left', '900');
    txt(g, 'Served ' + G.served + '  ·  Missed ' + G.missed, 1094, 500, 12, '#ffe9a8', 'left');
    txt(g, 'Tips ¥' + G.tips + '  ·  Best combo x' + G.bestCombo, 1094, 520, 12, '#ffe9a8', 'left');
    txt(g, 'Seed ' + G.seed, 1094, 596, 11, '#8a7a5a', 'left');
  }
  function wrapText(g, s, x, y, maxW, size, color, lh) {
    g.fillStyle = color; g.font = '400 ' + size + 'px \'Segoe UI\', Arial, sans-serif'; g.textAlign = 'left';
    const words = s.split(' ');
    let line = '', yy = y;
    for (const w of words) {
      const test = line ? line + ' ' + w : w;
      if (g.measureText(test).width > maxW && line) { g.fillText(line, x, yy); line = w; yy += lh; }
      else line = test;
    }
    g.fillText(line, x, yy);
  }
  function drawBottomBar(g) {
    const G = RR.game;
    shade(g, 0, 612, W, 108, '#1d1208', '#2b1d12');
    g.fillStyle = '#d94f3d'; g.fillRect(0, 612, W, 3);
    // plate panel
    txt(g, '🍜 PLATE', 16, 634, 13, '#ffd27a', 'left', '900');
    const px = 30;
    for (let i = 0; i < 3; i++) {
      circle(g, px + i * 40, 660, 16, G.plate[i] ? '#f5f2ea' : '#3a2a1a');
      if (G.plate[i]) ingIcon(g, G.plate[i], px + i * 40, 660, 11);
    }
    const stateTxt = G.plateState === 'empty' ? 'empty — grab ingredients (1-8)'
      : G.plateState === 'assembling' ? 'assembling: ' + G.plate.join(' + ') + (G.plateRecipe ? ' → ' + G.plateRecipe.name : '')
      : G.plateState === 'cooking' ? 'COOKING… ' + Math.ceil(RR.CONFIG.cookTime - G.plateTimer) + 's'
      : G.plateState === 'ready' ? 'READY — SERVE! burns in ' + Math.ceil(RR.CONFIG.burnTime - G.plateTimer) + 's'
      : 'BURNT! Press X to trash';
    txt(g, stateTxt, 150, 664, 14, G.plateState === 'ready' ? '#7ddb8a' : G.plateState === 'burnt' ? '#ff8a7a' : '#ffe9a8', 'left', '800');
    if (G.plateState === 'cooking' || G.plateState === 'ready') {
      const f = G.plateState === 'ready' ? 1 - G.plateTimer / RR.CONFIG.burnTime : G.plateTimer / RR.CONFIG.cookTime;
      g.fillStyle = '#4a3421'; rr(g, 150, 676, 240, 10, 5); g.fill();
      g.fillStyle = G.plateState === 'ready' ? '#7ddb8a' : '#ffd27a';
      if (f > 0) { rr(g, 150, 676, 240 * Math.max(0, f), 10, 5); g.fill(); }
    }
    // hands + hint
    txt(g, '✋ HANDS', 430, 634, 13, '#ffd27a', 'left', '900');
    for (let i = 0; i < 2; i++) {
      circle(g, 446 + i * 40, 660, 16, G.hands[i] ? '#f5f2ea' : '#3a2a1a');
      if (G.hands[i]) ingIcon(g, G.hands[i], 446 + i * 40, 660, 11);
    }
    const o = G.orders[0];
    const hint = !G.started ? 'Press ENTER to open the yatai'
      : o ? 'NEXT: ' + nextHint(G, o) : 'Tickets are coming…';
    txt(g, hint, 540, 664, 14, '#ffe9a8', 'left', '700');
    // controls + trash
    txt(g, 'WASD move · 1-8 take · E use station · SPACE serve · X trash · P pause', 1272, 648, 12, 'rgba(255,240,210,0.85)', 'right');
    g.fillStyle = '#7a1f2b'; rr(g, 1150, 660, 114, 30, 8); g.fill();
    txt(g, '🗑 X — TRASH', 1207, 680, 13, '#fff', 'center', '900');
  }
  function nextHint(G, o) {
    if (G.plateState === 'ready') return 'Ring the bell! (SPACE or click THE PASS)';
    if (G.plateState === 'burnt') return 'Burnt! Trash it (X) and start over';
    if (G.plateState === 'cooking') return 'Cooking ' + (G.plateRecipe ? G.plateRecipe.name : '') + '…';
    const missing = o.recipe.needs.filter((n) => !G.plate.includes(n) && !G.hands.includes(n));
    const carried = G.hands.filter(Boolean);
    if (G.plate.length || carried.length) {
      if (missing.length === 0) return 'Full set! Go to PLATING (E)';
      return 'Need: ' + missing.join(', ') + ' — then PLATING (E)';
    }
    return 'Grab ' + o.recipe.needs[0] + ' (' + (RR.BINS.find((b) => b.name === o.recipe.needs[0]) || {}).key + ') for ' + o.customer.name;
  }
  function drawToastHero(g) {
    const G = RR.game;
    if (G.toastT > 0) {
      // drop below the rush pill when rush is on so the two pills never stack
      const ty = G.rush ? 184 : 158;
      g.save(); g.globalAlpha = Math.min(1, G.toastT);
      g.fillStyle = 'rgba(20,14,8,0.92)'; rr(g, 440, ty, 400, 32, 16); g.fill();
      txt(g, G.toast, 640, ty + 21, 15, '#ffe9a8', 'center', '700');
      g.restore();
    }
    if (G.heroT > 0) {
      // hero banner on a dark backing pill, high in the scene so it never
      // covers a station label or the pass button
      g.save(); g.globalAlpha = Math.min(1, G.heroT);
      g.font = "900 54px 'Arial Black', 'Segoe UI', sans-serif";
      const pw = Math.min(1000, g.measureText(G.hero).width + 80);
      g.fillStyle = 'rgba(20,14,8,0.88)'; rr(g, 640 - pw / 2, 168, pw, 92, 16); g.fill();
      g.strokeStyle = '#ffd27a'; g.lineWidth = 2; rr(g, 640 - pw / 2, 168, pw, 92, 16); g.stroke();
      txt(g, G.hero, 643, 212, 54, '#000', 'center', '900', "'Arial Black', 'Segoe UI', sans-serif");
      txt(g, G.hero, 640, 209, 54, '#ffd27a', 'center', '900', "'Arial Black', 'Segoe UI', sans-serif");
      if (G.heroSub) txt(g, G.heroSub, 640, 246, 20, '#fff', 'center', '800');
      g.restore();
    }
  }
  function drawOverlays(g) {
    const G = RR.game;
    if (!G.started) {
      g.fillStyle = 'rgba(20,12,6,0.62)'; g.fillRect(0, 0, W, H);
      txt(g, 'RAMEN RUSH', 640, 300, 84, '#ffd27a', 'center', '900', "'Arial Black', 'Segoe UI', sans-serif");
      g.fillStyle = '#7a1f2b'; g.fillRect(0, 296, W, 4);
      txt(g, 'A rainy night-market yatai — cook fast, serve faster, impress the hidden critic.', 640, 344, 19, '#ffe9a8', 'center', '700');
      txt(g, 'Press ENTER to open the stall', 640, 392, 22, '#fff', 'center', '900');
      txt(g, 'WASD move · 1-8 ingredients · E use station · SPACE serve · X trash · click works too', 640, 430, 15, '#e8dcc8', 'center');
      return;
    }
    if (G.over) {
      g.fillStyle = 'rgba(20,12,6,0.78)'; g.fillRect(0, 0, W, H);
      const won = G.dayWon;
      txt(g, won ? 'NIGHT ' + G.day + ' COMPLETE!' : 'THE STALL CLOSED…', 640, 280, 56, won ? '#7ddb8a' : '#ff8a7a', 'center', '900', "'Arial Black', 'Segoe UI', sans-serif");
      txt(g, 'Score ' + G.score.toLocaleString() + '  ·  Served ' + G.served + '  ·  Missed ' + G.missed + '  ·  Tips ¥' + G.tips, 640, 330, 20, '#ffe9a8', 'center', '800');
      txt(g, won ? 'Goal ¥' + RR.CONFIG.dayGoal + ' cleared — the lane is talking about your ramen.' : 'Three hearts lost. The regulars went home hungry.', 640, 364, 17, '#e8dcc8', 'center');
      txt(g, 'Press ENTER for night ' + (G.day + 1), 640, 412, 20, '#fff', 'center', '900');
      return;
    }
    if (G.paused) {
      g.fillStyle = 'rgba(20,12,6,0.6)'; g.fillRect(0, 0, W, H);
      txt(g, 'PAUSED', 640, 360, 48, '#fff', 'center', '900');
    }
  }

  RR.updateFx = function (dt, t) {
    // steam spawns above the broth/noodle pots and the plating plate
    const G = RR.game;
    const srcs = [[300, 176], [428, 176]];
    if (G.plateState === 'cooking' || G.plateState === 'ready') srcs.push([812, 176]);
    RR.fx.steam.forEach((s) => {
      s.ph += dt * s.sp * 0.55;
      if (s.ph >= 1 || s.x === 0) {
        const src = srcs[Math.floor(Math.random() * srcs.length)];
        s.x = src[0] + (Math.random() - 0.5) * 40; s.y = src[1]; s.ph = 0; s.sx = (Math.random() - 0.5) * 8;
      }
      s.y -= dt * 42 * s.sp;
      s.x += Math.sin(t * 2 + s.ph * 6) * 0.3 + s.sx * dt;
    });
    RR.fx.rain.forEach((r) => {
      r.y += dt * 260 * r.s; r.x -= dt * 40 * r.s;
      if (r.y > H) { r.y = -20; r.x = Math.random() * (W + 100); }
    });
    RR.fx.embers.forEach((e) => {
      e.ph += dt * e.sp * 0.7;
      if (e.ph >= 1) { e.x = 684 + (Math.random() - 0.5) * 50; e.y = 192; e.ph = 0; }
      e.y -= dt * 30 * e.sp;
      e.x += Math.sin(t * 3 + e.ph * 8) * 0.4;
    });
  };

  RR.draw = function (g, t) {
    const G = RR.game;
    g.clearRect(0, 0, W, H);
    // scene (camera may zoom for shots)
    g.save();
    g.beginPath(); g.rect(204, 158, 872, 446); g.clip();
    const cam = RR.cam;
    g.translate(640, 381);
    g.scale(cam.scale, cam.scale);
    g.translate(-cam.cx, -cam.cy);
    drawScene(g, t);
    g.restore();
    // scene frame
    g.strokeStyle = '#6b4423'; g.lineWidth = 3; g.strokeRect(204, 158, 872, 446);
    drawTickets(g, t);
    drawTopbar(g);
    drawSidePanels(g);
    drawBottomBar(g);
    drawToastHero(g);
    drawOverlays(g);
  };

  RR.ingIcon = ingIcon;
  RR.bowlIcon = bowlIcon;
  RR.moodFor = moodFor;
})();
