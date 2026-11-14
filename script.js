/* Murogolo Primary School - site scripts. Each block only runs on the page that has its elements.
   Three.js is loaded from the CDN on index, about and curriculum. */

/* ===== Shared: dark mode, side menu ===== */
(function () {
  try { if (localStorage.getItem('theme') === 'dark') document.documentElement.classList.add('dark'); } catch (e) {}
  document.querySelectorAll('[data-theme-toggle]').forEach(function (b) {
    b.onclick = function () {
      var d = document.documentElement.classList.toggle('dark');
      try { localStorage.setItem('theme', d ? 'dark' : 'light'); } catch (e) {}
    };
  });
  var btn = document.getElementById('menuBtn'), menu = document.getElementById('sideMenu'), ov = document.getElementById('menuOverlay'), shut = document.getElementById('menuClose');
  if (!btn || !menu || !ov) return;
  function setOpen(o) {
    menu.classList.toggle('open', o); ov.classList.toggle('open', o); document.body.classList.toggle('menu-open', o);
    btn.setAttribute('aria-expanded', o); menu.setAttribute('aria-hidden', !o);
    if (o) { var f = menu.querySelector('a'); if (f) f.focus(); } else btn.focus();
  }
  btn.onclick = function () { setOpen(true); };
  if (shut) shut.onclick = function () { setOpen(false); };
  ov.onclick = function () { setOpen(false); };
  menu.addEventListener('click', function (e) { if (e.target.closest('a')) setOpen(false); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && menu.classList.contains('open')) setOpen(false); });
  var file = location.pathname.split('/').pop() || 'index.html';
  menu.querySelectorAll('a.side-link').forEach(function (a) { if (a.getAttribute('href') === file) { a.classList.add('active'); a.setAttribute('aria-current', 'page'); } });
})();

/* ===== Index: hero 3D badge ===== */
/* Hero badge: gold concentric rings, white lettering curved between them, and an
   open book + pencil + graduation cap standing in FRONT of the seal so nothing is hidden. */
(function () {
  var el = document.getElementById('hero3d');
  if (!el || !window.THREE) return;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var r;
  try { r = new THREE.WebGLRenderer({ alpha: true, antialias: true }); } catch (e) { return; }
  r.setPixelRatio(Math.min(devicePixelRatio, 2));
  r.outputEncoding = THREE.sRGBEncoding;
  r.shadowMap.enabled = true; r.shadowMap.type = THREE.PCFSoftShadowMap;
  var cv = r.domElement; cv.style.position = 'absolute'; cv.style.left = 0; cv.style.top = 0;
  cv.style.opacity = 0; cv.style.transition = 'opacity 1.2s ease';
  el.appendChild(cv);

  var scene = new THREE.Scene(), world = new THREE.Group(); scene.add(world);
  var cam = new THREE.PerspectiveCamera(36, 1, 0.1, 100);

  scene.add(new THREE.HemisphereLight(0xffffff, 0x8aa8e8, 1.0));
  var key = new THREE.DirectionalLight(0xfff3dc, 1.0); key.position.set(-4, 7, 10);
  key.castShadow = true; key.shadow.mapSize.set(1024, 1024); key.shadow.radius = 5; key.shadow.bias = -0.0006;
  ['left', 'bottom'].forEach(function (k) { key.shadow.camera[k] = -7; }); ['right', 'top'].forEach(function (k) { key.shadow.camera[k] = 7; });
  scene.add(key);
  var rim = new THREE.PointLight(0x9cc0ff, .8, 40); rim.position.set(7, -3, 6); scene.add(rim);

  var GOLD = 0xF59E0B, NAVY = 0x1E293B, BAND = 0x0A2472, WHITE = 0xFFFFFF, YEL = 0xFACC15, PINK = 0xff8fc0, STEEL = 0xe2e8f5, BLUE = 0x2563eb;
  function std(c, extra) { return new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: .5, metalness: .05 }, extra || {})); }
  function mk(g, c, extra) { var m = new THREE.Mesh(g, std(c, extra)); m.castShadow = true; m.receiveShadow = true; return m; }

  var catcher = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), new THREE.ShadowMaterial({ opacity: .25 }));
  catcher.position.z = -1.2; catcher.receiveShadow = true; world.add(catcher);

  /* ---- seal (everything here sits at z <= 0) ---- */
  var R_IN = 2.65, R_OUT = 3.75;
  var seal = new THREE.Group(); world.add(seal);
  var band = new THREE.Mesh(new THREE.RingGeometry(R_IN, R_OUT, 128), new THREE.MeshBasicMaterial({ color: 0x7fc3f0, side: THREE.DoubleSide }));
  band.position.z = -.1; band.receiveShadow = true; seal.add(band);
  var disc = new THREE.Mesh(new THREE.CircleGeometry(R_IN, 96), new THREE.MeshBasicMaterial({ color: 0xffffff }));
  disc.position.z = -.5; disc.receiveShadow = true; seal.add(disc);
  /* school logo: flat circular crest, STATIC (never animated) */
  var LOGO_R = R_IN - .08;
  var logoMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true });
  var logoFace = new THREE.Mesh(new THREE.CircleGeometry(LOGO_R, 128), logoMat);
  logoFace.position.z = -.3; seal.add(logoFace);
  new THREE.TextureLoader().load(window.MUROGOLO_CREST || 'logo-crest.png', function (t) {
    t.encoding = THREE.sRGBEncoding; t.anisotropy = 8;
    logoMat.map = t; logoMat.needsUpdate = true;
  });

  [[R_IN, .08], [R_OUT, .08]].forEach(function (d) {
    var t = mk(new THREE.TorusGeometry(d[0], d[1], 14, 160), 0xf2b705, { metalness: .55, roughness: .3, emissive: 0xf2b705, emissiveIntensity: .1 });
    t.position.z = -.05; seal.add(t);
  });

  /* ---- white lettering bent along the band ---- */
  var TXT = 'MUROGOLO PRIMARY SCHOOL', FONT = 'bold 180px "Trebuchet MS", "Arial Black", Arial, sans-serif';
  var mc = document.createElement('canvas').getContext('2d'); mc.font = FONT;
  var widths = TXT.split('').map(function (ch) { return ch === ' ' ? 90 : mc.measureText(ch).width; });
  var TRACK = 16, total = widths.reduce(function (a, b) { return a + b + TRACK; }, 0);
  function glyph(ch, fill) {
    var c = document.createElement('canvas'), w = Math.ceil(mc.measureText(ch).width) + 24; c.width = w; c.height = 240;
    var x = c.getContext('2d'); x.font = FONT; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillStyle = fill; x.fillText(ch, w / 2, 124);
    var t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.anisotropy = 8; return { t: t, w: w };
  }
  var text = new THREE.Group(); seal.add(text);
  var ARC = 4.7;                                   // radians the lettering covers (open at the bottom)
  var RM = (R_IN + R_OUT) / 2, LH = 1.12, LAYERS = 6, DEPTH = .16, acc = 0;
  TXT.split('').forEach(function (ch, i) {
    var slot = widths[i] + TRACK, mid = acc + slot / 2; acc += slot;
    if (ch === ' ') return;
    var th = (mid / total - .5) * ARC;
    var g = new THREE.Group();
    var front = glyph(ch, '#0a2f7a'), side = glyph(ch, '#5b8fd0');
    var pw = LH * front.w / 240;
    for (var k = 0; k < LAYERS; k++) {
      var last = k === LAYERS - 1;
      var m = new THREE.Mesh(new THREE.PlaneGeometry(pw, LH), new THREE.MeshBasicMaterial({ map: (last ? front : side).t, transparent: true, alphaTest: .45, side: THREE.DoubleSide }));
      m.position.z = k * (DEPTH / (LAYERS - 1)); g.add(m);
    }
    g.position.set(Math.sin(th) * RM, Math.cos(th) * RM, -.05);
    g.rotation.z = -th;
    text.add(g);
  });

  /* ---- inner scene: a separate group pushed well in front of the seal ---- */
  var inner = new THREE.Group(); inner.position.z = 1.5; world.add(inner);

  var A = .72, BS = .72, bcos = Math.cos(A), bsin = Math.sin(A);    // book tilt and scale
  var desk = new THREE.Group(); inner.add(desk);
  var book = new THREE.Group();
  var cover = mk(new THREE.BoxGeometry(3.5, .14, 2.5), BLUE, { roughness: .4 }); cover.position.y = -.12; book.add(cover);
  [-1, 1].forEach(function (s) {
    var pg = mk(new THREE.BoxGeometry(1.65, .22, 2.3), WHITE, { roughness: .85 });
    pg.position.set(s * .84, .06, 0); pg.rotation.z = -s * .1; book.add(pg);
    for (var i = 0; i < 5; i++) {
      if (s === 1 && i === 2) continue;
      var ln = new THREE.Mesh(new THREE.BoxGeometry(1.15, .012, .045), new THREE.MeshStandardMaterial({ color: 0xa5b6d6 }));
      ln.position.set(s * .9, .19, -.75 + i * .3); ln.rotation.z = -s * .1; book.add(ln);
    }
  });
  var spine = mk(new THREE.CylinderGeometry(.09, .09, 2.4, 12), GOLD); spine.rotation.x = Math.PI / 2; spine.position.set(0, .04, 0); book.add(spine);
  var drawn = new THREE.Mesh(new THREE.BoxGeometry(1, .014, .06), new THREE.MeshStandardMaterial({ color: 0x1d2a6b }));
  drawn.rotation.z = -.1; drawn.scale.x = .001; book.add(drawn);
  book.position.set(0, 0, 0); book.rotation.x = A; book.scale.setScalar(BS); desk.add(book);
  desk.position.set(-3.9, -3.7, 0); desk.scale.setScalar(.8);   // bottom-left, outside the ring

  /* pencil (classic yellow, pink eraser) – tip at local origin */
  var pencil = new THREE.Group();
  var body = mk(new THREE.CylinderGeometry(.13, .13, 2.5, 6), YEL, { roughness: .4 }); body.position.y = 1.55; pencil.add(body);
  var wood = mk(new THREE.ConeGeometry(.13, .5, 6), 0xf1d3a3); wood.rotation.x = Math.PI; wood.position.y = .25; pencil.add(wood);
  var lead = mk(new THREE.ConeGeometry(.055, .16, 6), 0x1f2937); lead.rotation.x = Math.PI; lead.position.y = .08; pencil.add(lead);
  var fer = mk(new THREE.CylinderGeometry(.145, .145, .24, 6), STEEL, { metalness: .65, roughness: .3 }); fer.position.y = 2.88; pencil.add(fer);
  var era = mk(new THREE.CylinderGeometry(.13, .13, .22, 6), PINK); era.position.y = 3.1; pencil.add(era);
  pencil.scale.setScalar(.55); desk.add(pencil);

  /* graduation cap: deep navy + gold tassel */
  var cap = new THREE.Group();
  var board = mk(new THREE.BoxGeometry(2.3, .13, 2.3), NAVY, { roughness: .5 }); board.rotation.y = Math.PI / 4; cap.add(board);
  var crown = mk(new THREE.CylinderGeometry(.7, .78, .55, 24), 0x273449); crown.position.y = -.34; cap.add(crown);
  var btn = mk(new THREE.SphereGeometry(.11, 14, 10), GOLD, { metalness: .5, roughness: .3 }); btn.position.y = .13; cap.add(btn);
  var cord = mk(new THREE.CylinderGeometry(.025, .025, 1.15, 6), GOLD); cord.position.set(.5, -.02, .5); cord.rotation.z = -1.35; cap.add(cord);
  var tsl = mk(new THREE.ConeGeometry(.13, .5, 12), GOLD, { metalness: .4, roughness: .35 }); tsl.position.set(1.12, -.35, .5); tsl.rotation.x = Math.PI; cap.add(tsl);
  cap.scale.setScalar(.7); cap.position.set(3.9, 3.7, .3);   // top-right, outside the ring
  cap.userData.y0 = 3.7;
  cap.rotation.set(.45, .25, -.06); inner.add(cap);

  var deco = [[-4.6, 2.6], [4.8, -2.2], [0, -5.0], [-1.2, 5.0], [5.0, .4], [-5.2, -.6]].map(function (p, i) {
    var g = i % 2 ? new THREE.OctahedronGeometry(.2) : new THREE.IcosahedronGeometry(.18);
    var m = mk(g, [GOLD, WHITE, 0x38bdf8, 0x34d399, PINK, GOLD][i], { flatShading: true }); m.position.set(p[0], p[1], 0); world.add(m); return m;
  });

  /* ---- thin white 3D rings around the static logo (as in the reference photo) ---- */
  var orbits = [
    { r: R_OUT + .28, tube: .022, z: -.05, ax: .10, ay: .14, sp: .5 },
    { r: R_OUT + .5,  tube: .016, z: -.2,  ax: .16, ay: .22, sp: -.38 }
  ].map(function (o) {
    var ring = new THREE.Mesh(new THREE.TorusGeometry(o.r, o.tube, 10, 220), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: .9 }));
    ring.position.z = o.z; ring.userData = o; world.add(ring); return ring;
  });

  function resize() {
    var w = el.clientWidth, h = el.clientHeight; if (!w || !h) return;
    r.setSize(w, h); cam.aspect = w / h;
    cam.position.set(0, 0, 21 * Math.max(1, 1.1 / cam.aspect));
    cam.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(el); resize();

  var mx = 0, my = 0;
  addEventListener('pointermove', function (e) { mx = e.clientX / innerWidth - .5; my = e.clientY / innerHeight - .5; });

  var t0 = performance.now(), running = false, raf = 0;
  function render(now) {
    var t = (now - t0) / 1000;
    var e = 1 - Math.pow(1 - Math.min(1, t / 1.4), 3);
    cap.position.y = cap.userData.y0 + Math.sin(t * 1.1) * .12; cap.rotation.y = .25 + Math.sin(t * .6) * .22;
    book.position.y = Math.sin(t * .9 + 1) * .04;
    orbits.forEach(function (g) { var u = g.userData; g.rotation.x = Math.sin(t * u.sp) * u.ax; g.rotation.y = Math.cos(t * u.sp * .8) * u.ay; });   // gentle 3D wobble
    var prog = Math.min(1, ((t * .32) % 1.5) / 1);
    var len = 1.05, x0 = .35;
    drawn.scale.x = Math.max(.001, prog * len); drawn.position.set(x0 + prog * len / 2, .205 - (x0 + prog * len / 2 - .875) * .1, 0);
    var tx = x0 + prog * len, ty = .21 - (tx - .875) * .1 + .02;          // tip on the page, book-local
    pencil.position.set(tx * BS, book.position.y + (ty * bcos) * BS, (ty * bsin) * BS);
    pencil.rotation.set(.1, 0, -.85 + Math.sin(prog * 18) * .03);
    deco.forEach(function (d, i) { d.rotation.x = t * .3 + i; d.rotation.y = t * .4; });
    seal.scale.setScalar(.85 + .15 * e);
    world.rotation.y += (mx * .3 - world.rotation.y) * .05;
    world.rotation.x += (my * .2 - world.rotation.x) * .05;
    seal.rotation.set(-world.rotation.x, -world.rotation.y, 0);   // logo stays perfectly still
    r.render(scene, cam);
  }
  function loop(now) { render(now); raf = requestAnimationFrame(loop); }
  function start() { if (!running && !reduce) { running = true; raf = requestAnimationFrame(loop); } }
  function stop() { running = false; cancelAnimationFrame(raf); }

  render(t0 + 1500);
  requestAnimationFrame(function () { cv.style.opacity = 1; });
  if (!reduce) {
    new IntersectionObserver(function (en) { en[0].isIntersecting ? start() : stop(); }).observe(el);
    document.addEventListener('visibilitychange', function () { document.hidden ? stop() : start(); });
  }
})();

/* ===== Index: hero 3D toy blocks ===== */
(function () {
  var el = document.getElementById('hero3dL');
  if (!el || !window.THREE) return;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var r;
  try { r = new THREE.WebGLRenderer({ alpha: true, antialias: true }); } catch (e) { return; }
  r.setPixelRatio(Math.min(devicePixelRatio, 2));
  r.outputEncoding = THREE.sRGBEncoding;
  var cv = r.domElement; cv.style.position = 'absolute'; cv.style.left = 0; cv.style.top = 0;
  cv.style.opacity = 0; cv.style.transition = 'opacity 1.4s ease';
  el.appendChild(cv);

  var scene = new THREE.Scene();
  var cam = new THREE.PerspectiveCamera(38, 1, 0.1, 100); cam.position.set(0, 0, 14);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x6f9bff, 1.1));
  var key = new THREE.DirectionalLight(0xfff3dc, .8); key.position.set(4, 6, 8); scene.add(key);
  var rim = new THREE.PointLight(0x7fb0ff, .9, 40); rim.position.set(-6, -3, 5); scene.add(rim);

  // Toy-block faces: coloured tile with a white letter or number
  function face(txt, bg) {
    var c = document.createElement('canvas'); c.width = c.height = 128;
    var x = c.getContext('2d');
    x.fillStyle = bg; x.fillRect(0, 0, 128, 128);
    x.strokeStyle = 'rgba(255,255,255,.45)'; x.lineWidth = 6; x.strokeRect(8, 8, 112, 112);
    x.fillStyle = '#fff'; x.font = 'bold 86px "Trebuchet MS", Arial Rounded MT Bold, Arial, sans-serif';
    x.textAlign = 'center'; x.textBaseline = 'middle';
    x.shadowColor = 'rgba(0,0,0,.25)'; x.shadowBlur = 6; x.shadowOffsetY = 4;
    x.fillText(txt, 64, 70);
    var t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.anisotropy = 4;
    return t;
  }
  function block(txt, bg, size) {
    var m = new THREE.MeshStandardMaterial({ map: face(txt, bg), roughness: .5, metalness: .02 });
    var b = new THREE.Mesh(new THREE.BoxGeometry(size, size, size), [m, m, m, m, m, m]);
    return b;
  }

  // Top-left and bottom-left clusters keep clear of the headline in the middle
  var topG = new THREE.Group(), botG = new THREE.Group(); scene.add(topG, botG);
  var defs = [
    [topG, 'A', '#ff5a4f', 1.25, 0.0, 0.0, 0.2],
    [topG, 'B', '#22b8e0', 1.0, 1.7, 0.55, -0.1],
    [topG, 'C', '#f5b400', 1.15, 3.3, -0.05, 0.15],
    [botG, '1', '#2fbf8a', 1.2, 0.0, 0.0, -0.15],
    [botG, '2', '#a06bff', 1.0, 1.7, -0.5, 0.1],
    [botG, '3', '#ff8a3d', 1.2, 3.3, 0.05, 0.2]
  ];
  var blocks = defs.map(function (d, i) {
    var b = block(d[1], d[2], d[3]);
    b.userData = { x: d[4], y: d[5], p: i * .9, r: d[6] };
    b.position.set(d[4], d[5], 0); b.rotation.set(.4, .5 + d[6], d[6]);
    d[0].add(b); return b;
  });

  function resize() {
    var w = el.clientWidth, h = el.clientHeight;
    if (!w || !h) return;
    r.setSize(w, h); cam.aspect = w / h;
    var strip = w / h > 2.2, tn = Math.tan(cam.fov * Math.PI / 360);          // phones: a wide strip under the badge
    cam.position.z = strip ? Math.max(6, 6.6 / (tn * cam.aspect)) : 14;
    cam.updateProjectionMatrix();
    var hh = tn * cam.position.z, hw = hh * cam.aspect;
    if (strip) { topG.position.set(-4.7, 0, 0); botG.position.set(1.4, 0, 0); }   // two clusters side by side
    else { topG.position.set(-hw + .9, hh - 1.2, 0); botG.position.set(-hw + .9, -hh + 1.2, 0); }   // desktop: left corners
  }
  new ResizeObserver(resize).observe(el); resize();

  var mx = 0, my = 0;
  addEventListener('pointermove', function (e) { mx = e.clientX / innerWidth - .5; my = e.clientY / innerHeight - .5; });

  var t0 = performance.now(), running = false, raf = 0;
  function render(now) {
    var t = (now - t0) / 1000;
    var e = 1 - Math.pow(1 - Math.min(1, t / 1.4), 3);
    blocks.forEach(function (b) {
      var u = b.userData;
      b.position.y = u.y + Math.sin(t * 1.1 + u.x * .9 + u.p) * .28;   // gentle wave along the row
      b.rotation.y = .5 + u.r + Math.sin(t * .5 + u.p) * .4 + mx * .3;
      b.rotation.x = .4 + Math.sin(t * .6 + u.p) * .15 + my * .2;
      b.scale.setScalar(.7 + .3 * e);
    });
    r.render(scene, cam);
  }
  function loop(now) { render(now); raf = requestAnimationFrame(loop); }
  function start() { if (!running && !reduce) { running = true; raf = requestAnimationFrame(loop); } }
  function stop() { running = false; cancelAnimationFrame(raf); }

  render(t0 + 1500);
  requestAnimationFrame(function () { cv.style.opacity = 1; });
  if (!reduce) {
    new IntersectionObserver(function (en) { en[0].isIntersecting ? start() : stop(); }).observe(el);
    document.addEventListener('visibilitychange', function () { document.hidden ? stop() : start(); });
  }
})();

/* ===== About: 3D school render ===== */
/* Photoreal-style architectural render of the school blocks.
   Procedural PBR textures (face-brick, corrugated sheeting, pavers, grass), ACES tone mapping,
   soft sun shadows, glass reflections from a PMREM sky, day / golden-hour lighting. */
(function () {
  var el = document.getElementById('school3d');
  if (!el || !window.THREE) return;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var r;
  try { r = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' }); }
  catch (e) { el.style.background = "url(school.jpg) center/cover"; return; }
  r.setPixelRatio(Math.min(devicePixelRatio, 2));
  r.outputEncoding = THREE.sRGBEncoding; r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 1.0;
  r.shadowMap.enabled = true; r.shadowMap.type = THREE.PCFSoftShadowMap;
  r.domElement.style.display = 'block'; el.appendChild(r.domElement);
  var aniso = Math.min(8, r.capabilities.getMaxAnisotropy());

  function rng(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  var rnd = rng(11); function R(a, b) { return a + rnd() * (b - a); }
  function cvs(w, h) { var c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  function tex(c, srgb) { var t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = aniso; if (srgb) t.encoding = THREE.sRGBEncoding; return t; }
  function rep(t, u, v) { var c = t.clone(); c.needsUpdate = true; c.repeat.set(u, v); return c; }

  /* ---------- procedural textures ---------- */
  var brickC = cvs(512, 512), brickB = cvs(512, 512);
  (function () {
    var x = brickC.getContext('2d'), y = brickB.getContext('2d');
    x.fillStyle = '#b8afa0'; x.fillRect(0, 0, 512, 512); y.fillStyle = '#1c1c1c'; y.fillRect(0, 0, 512, 512);
    var pal = [[178, 86, 60], [166, 74, 52], [190, 100, 68], [150, 66, 48], [182, 92, 64], [160, 80, 58]];
    for (var row = 0; row < 16; row++) {
      var off = (row % 2) * 32, cols = [];
      for (var c = 0; c < 8; c++) { var p = pal[Math.floor(rnd() * pal.length)], k = R(.9, 1.1); cols.push([p[0] * k, p[1] * k, p[2] * k]); }
      for (var col = -1; col < 8; col++) {
        var px = col * 64 + off, py = row * 32, cc = cols[(col + 8) % 8];
        x.fillStyle = 'rgb(' + (cc[0] | 0) + ',' + (cc[1] | 0) + ',' + (cc[2] | 0) + ')'; x.fillRect(px + 2, py + 2, 60, 28);
        for (var i = 0; i < 26; i++) { x.fillStyle = rnd() < .5 ? 'rgba(0,0,0,' + R(.04, .13) + ')' : 'rgba(255,220,190,' + R(.03, .09) + ')'; x.fillRect(px + 2 + R(0, 58), py + 2 + R(0, 26), R(1, 4), R(1, 3)); }
        x.fillStyle = 'rgba(255,255,255,.10)'; x.fillRect(px + 2, py + 2, 60, 2);
        x.fillStyle = 'rgba(0,0,0,.20)'; x.fillRect(px + 2, py + 28, 60, 2);
        var h = (170 + rnd() * 70) | 0; y.fillStyle = 'rgb(' + h + ',' + h + ',' + h + ')'; y.fillRect(px + 2, py + 2, 60, 28);
      }
    }
  })();
  var brickMap = tex(brickC, true), brickBump = tex(brickB, false);
  function brickMat(w, h) {
    return new THREE.MeshStandardMaterial({ map: rep(brickMap, w / 1.84, h / 1.36), bumpMap: rep(brickBump, w / 1.84, h / 1.36), bumpScale: 1.6, roughness: .93, metalness: 0 });
  }

  function corrugated(base) {
    var c = cvs(256, 256), b = cvs(256, 256), x = c.getContext('2d'), y = b.getContext('2d');
    for (var i = 0; i < 256; i++) {
      var v = .5 + .5 * Math.sin(i / 32 * Math.PI * 2), s = .55 + .5 * v, g = (v * 255) | 0;
      x.fillStyle = 'rgb(' + (base[0] * s | 0) + ',' + (base[1] * s | 0) + ',' + (base[2] * s | 0) + ')'; x.fillRect(i, 0, 1, 256);
      y.fillStyle = 'rgb(' + g + ',' + g + ',' + g + ')'; y.fillRect(i, 0, 1, 256);
    }
    for (var k = 0; k < 40; k++) { x.fillStyle = 'rgba(0,0,0,' + R(.02, .07) + ')'; x.fillRect(R(0, 256), R(0, 200), R(1, 3), R(30, 120)); }
    return { map: tex(c, true), bump: tex(b, false) };
  }
  var roofT = corrugated([76, 96, 122]), walkT = corrugated([216, 198, 162]);
  function roofMat(T, len, slope) {
    return new THREE.MeshStandardMaterial({ map: rep(T.map, len / 1.76, slope / 1.76), bumpMap: rep(T.bump, len / 1.76, slope / 1.76), bumpScale: 2.2, roughness: .5, metalness: .55 });
  }

  var grassC = cvs(512, 512); (function () {
    var x = grassC.getContext('2d'); x.fillStyle = '#4e8a36'; x.fillRect(0, 0, 512, 512);
    for (var i = 0; i < 9000; i++) {
      x.strokeStyle = 'hsl(' + R(88, 112) + ',' + R(38, 58) + '%,' + R(22, 40) + '%)'; x.lineWidth = R(.6, 1.6);
      var px = R(0, 512), py = R(0, 512), a = R(-.5, .5) - Math.PI / 2, l = R(3, 9);
      x.beginPath(); x.moveTo(px, py); x.lineTo(px + Math.cos(a) * l, py + Math.sin(a) * l); x.stroke();
    }
  })();
  var grassMap = tex(grassC, true);
  var grassMat = new THREE.MeshStandardMaterial({ map: rep(grassMap, 300, 300), bumpMap: rep(grassMap, 300, 300), bumpScale: .8, roughness: 1 });

  var paveC = cvs(512, 512), paveB = cvs(512, 512); (function () {
    var x = paveC.getContext('2d'), y = paveB.getContext('2d'); x.fillStyle = '#6b655c'; x.fillRect(0, 0, 512, 512); y.fillStyle = '#111'; y.fillRect(0, 0, 512, 512);
    var pal = [[150, 70, 52], [132, 60, 46], [160, 86, 64], [120, 92, 80], [142, 76, 58]];
    for (var row = 0; row < 16; row++) for (var col = -1; col < 8; col++) {
      var px = col * 64 + (row % 2) * 32, py = row * 32, p = pal[Math.floor(rnd() * pal.length)], k = R(.9, 1.08);
      x.fillStyle = 'rgb(' + (p[0] * k | 0) + ',' + (p[1] * k | 0) + ',' + (p[2] * k | 0) + ')'; x.fillRect(px + 2, py + 2, 60, 28);
      for (var i = 0; i < 14; i++) { x.fillStyle = 'rgba(0,0,0,' + R(.04, .12) + ')'; x.fillRect(px + R(2, 60), py + R(2, 28), R(1, 3), R(1, 3)); }
      y.fillStyle = 'rgb(200,200,200)'; y.fillRect(px + 2, py + 2, 60, 28);
    }
  })();
  var paveMap = tex(paveC, true), paveBump = tex(paveB, false);
  function paveMat(w, d) { return new THREE.MeshStandardMaterial({ map: rep(paveMap, w / 1.6, d / 1.6), bumpMap: rep(paveBump, w / 1.6, d / 1.6), bumpScale: 1.2, roughness: .9 }); }

  var concC = cvs(256, 256); (function () {
    var x = concC.getContext('2d'); x.fillStyle = '#b9b7b1'; x.fillRect(0, 0, 256, 256);
    for (var i = 0; i < 1800; i++) { x.fillStyle = rnd() < .5 ? 'rgba(0,0,0,' + R(.03, .1) + ')' : 'rgba(255,255,255,' + R(.04, .12) + ')'; x.fillRect(R(0, 256), R(0, 256), R(1, 3), R(1, 3)); }
  })();
  var concMap = tex(concC, true);
  function conc(w, h) { return new THREE.MeshStandardMaterial({ map: rep(concMap, w / 1.5, h / 1.5), roughness: .92 }); }

  var leafC = cvs(128, 128); (function () {
    var x = leafC.getContext('2d'); x.fillStyle = '#3f7a30'; x.fillRect(0, 0, 128, 128);
    for (var i = 0; i < 900; i++) { x.fillStyle = 'hsl(' + R(85, 120) + ',' + R(40, 60) + '%,' + R(20, 46) + '%)'; x.beginPath(); x.arc(R(0, 128), R(0, 128), R(1.5, 5), 0, 7); x.fill(); }
  })();
  var leafMap = tex(leafC, true); leafMap.repeat.set(3, 2);

  /* sky dome + tree line */
  var skyC = cvs(1024, 512); (function () {
    var x = skyC.getContext('2d'), g = x.createLinearGradient(0, 0, 0, 512);
    g.addColorStop(0, '#2663c4'); g.addColorStop(.3, '#5f9cea'); g.addColorStop(.47, '#b9dbf7'); g.addColorStop(.5, '#dcecf5'); g.addColorStop(.53, '#d4e2cf'); g.addColorStop(1, '#c9d8c3');
    x.fillStyle = g; x.fillRect(0, 0, 1024, 512);
    for (var n = 0; n < 26; n++) {
      var cx = R(0, 1024), cy = R(120, 235), s = R(.6, 1.5);
      for (var k = 0; k < 9; k++) {
        var px = cx + R(-60, 60) * s, py = cy + R(-12, 12) * s, rad = R(22, 50) * s, rg = x.createRadialGradient(px, py, 0, px, py, rad);
        rg.addColorStop(0, 'rgba(255,255,255,.55)'); rg.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = rg; x.beginPath(); x.arc(px, py, rad, 0, 7); x.fill();
      }
    }
  })();
  var skyTex = tex(skyC, true); skyTex.wrapS = THREE.RepeatWrapping;
  var scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0xcfe4f4, 70, 300);
  var skyMat = new THREE.MeshBasicMaterial({ map: skyTex, side: THREE.BackSide, fog: false, depthWrite: false });
  var sky = new THREE.Mesh(new THREE.SphereGeometry(500, 48, 24), skyMat); scene.add(sky);

  var treeC = cvs(2048, 128); (function () {
    var x = treeC.getContext('2d');
    for (var i = 0; i < 900; i++) { var rad = R(6, 20), px = R(0, 2048), py = 128 - R(0, 40); x.fillStyle = 'hsl(' + R(95, 125) + ',' + R(25, 40) + '%,' + R(18, 32) + '%)'; x.beginPath(); x.arc(px, py, rad, 0, 7); x.fill(); }
    x.fillStyle = '#2c4f27'; x.fillRect(0, 112, 2048, 16);
  })();
  var line = new THREE.Mesh(new THREE.CylinderGeometry(190, 190, 20, 64, 1, true), new THREE.MeshBasicMaterial({ map: tex(treeC, true), transparent: true, side: THREE.BackSide, depthWrite: false }));
  line.material.map.repeat.set(2, 1); line.position.y = 8; scene.add(line);

  /* glass reflections from the sky */
  var envTex = null;
  try {
    var pm = new THREE.PMREMGenerator(r), es = new THREE.Scene();
    es.add(new THREE.Mesh(new THREE.SphereGeometry(100, 32, 16), new THREE.MeshBasicMaterial({ map: skyTex, side: THREE.BackSide })));
    envTex = pm.fromScene(es, .04).texture; pm.dispose();
  } catch (e) { envTex = null; }

  /* ---------- lighting ---------- */
  var hemi = new THREE.HemisphereLight(0xcfe3ff, 0x6f8a4a, .85); scene.add(hemi);
  var sun = new THREE.DirectionalLight(0xfff1de, 2.2); sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -.0004; sun.shadow.normalBias = .05; sun.shadow.radius = 3;
  var sc = sun.shadow.camera; sc.left = -55; sc.right = 55; sc.top = 55; sc.bottom = -55; sc.near = 5; sc.far = 260;
  var CEN = new THREE.Vector3(4, 0, -8); sun.target.position.copy(CEN); scene.add(sun, sun.target);

  /* ---------- helpers ---------- */
  function sh(m, c, rc) { m.castShadow = c !== false; m.receiveShadow = rc !== false; return m; }
  function std(c, o) { return new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: .8 }, o || {})); }
  function box(w, h, d, mat, x, y, z, p) { var m = sh(new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat)); m.position.set(x, y, z); if (p) p.add(m); return m; }
  function cyl(rt, rb, h, mat, x, y, z, p, seg) { var m = sh(new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg || 16), mat)); m.position.set(x, y, z); if (p) p.add(m); return m; }

  var glassMat = std(0x1d2c3c, { roughness: .06, metalness: .9, envMap: envTex, envMapIntensity: envTex ? 1.3 : 0 });
  var frameMat = std(0x353a42, { roughness: .45, metalness: .7 });
  var whiteMat = std(0xf1f1ee, { roughness: .55, metalness: .15 });
  var greyMat = std(0x8c9198, { roughness: .5, metalness: .6 });
  var doorMat = std(0x2b3d57, { roughness: .4, metalness: .6 });
  var sillMat = conc(2, 1);

  /* window prototype 1.9 x 1.45 */
  var WW = 1.9, WH = 1.45, win = new THREE.Group(); (function () {
    var gl = new THREE.Mesh(new THREE.PlaneGeometry(WW - .1, WH - .1), glassMat); gl.position.z = -.02; win.add(gl);
    box(WW, .07, .1, frameMat, 0, WH / 2, 0, win); box(WW, .07, .1, frameMat, 0, -WH / 2, 0, win);
    box(.07, WH, .1, frameMat, -WW / 2, 0, 0, win); box(.07, WH, .1, frameMat, WW / 2, 0, 0, win);
    box(.05, WH, .08, frameMat, 0, 0, 0, win); box(WW, .05, .08, frameMat, 0, WH * .2, 0, win);
    box(WW + .35, .08, .24, sillMat, 0, -WH / 2 - .06, .1, win); box(WW + .2, .16, .12, sillMat, 0, WH / 2 + .1, .03, win);
  })();
  function door() {
    var g = new THREE.Group(); box(2.1, 2.6, .12, frameMat, 0, 1.3, 0, g);
    box(.93, 2.45, .06, doorMat, -.5, 1.27, .05, g); box(.93, 2.45, .06, doorMat, .5, 1.27, .05, g);
    var gl = new THREE.Mesh(new THREE.PlaneGeometry(.55, .9), glassMat); gl.position.set(-.5, 1.6, .09); g.add(gl); var g2 = gl.clone(); g2.position.x = .5; g.add(g2);
    box(2.5, .1, .5, sillMat, 0, 0.05, .25, g); return g;
  }

  /* ---------- building blocks ---------- */
  function gableGeo(w, rise) { var s = new THREE.Shape(); s.moveTo(-w / 2, 0); s.lineTo(w / 2, 0); s.lineTo(0, rise); s.closePath(); return new THREE.ShapeGeometry(s); }
  function block(o) {
    var g = new THREE.Group(), cx = o.x0 + o.len / 2, cz = o.frontZ - o.depth / 2, Wt = o.Wt;
    var topM = std(0x777777);
    var wall = sh(new THREE.Mesh(new THREE.BoxGeometry(o.len, Wt, o.depth), [brickMat(o.depth, Wt), brickMat(o.depth, Wt), topM, topM, brickMat(o.len, Wt), brickMat(o.len, Wt)]));
    wall.position.set(cx, Wt / 2, cz); g.add(wall);
    box(o.len + .1, .42, .1, conc(o.len, .42), cx, .21, o.frontZ + .03, g);                  // plinth
    if (o.band) box(o.len + .1, .3, .14, conc(o.len, .3), cx, o.band, o.frontZ + .05, g);   // floor band
    box(o.len + .1, .2, .14, conc(o.len, .2), cx, Wt - .1, o.frontZ + .05, g);              // top cornice
    var bays = Math.floor(o.len / 3);
    for (var i = 0; i < bays; i++) {
      var wx = o.x0 + 1.5 + 3 * i + (o.len - bays * 3) / 2;
      o.floorYs.forEach(function (fy, fi) {
        if (fi === 0 && o.doors.indexOf(i) >= 0) { var d = door(); d.position.set(wx, 0, o.frontZ + .03); g.add(d); }
        else { var w = win.clone(); w.position.set(wx, fy, o.frontZ + .03); g.add(w); }
      });
    }
    [o.x0 + .35, o.x0 + o.len - .35].forEach(function (px) { cyl(.05, .05, Wt - .1, greyMat, px, (Wt - .1) / 2, o.frontZ + .08, g, 10); });   // downpipes
    /* low-pitch corrugated roof */
    var th = o.pitch, half = o.depth / 2, rise = half * Math.tan(th), ov = .7, span = half + ov, slope = span / Math.cos(th), len = o.len + 1.2;
    var ridgeY = Wt + rise;
    [1, -1].forEach(function (s) {
      var m = sh(new THREE.Mesh(new THREE.BoxGeometry(len, .1, slope), roofMat(roofT, len, slope)));
      m.position.set(cx, ridgeY - (span / 2) * Math.tan(th) - .04, cz + s * span / 2); m.rotation.x = s * th; g.add(m);
      box(len, .26, .07, whiteMat, cx, Wt + rise - span * Math.tan(th) - .13, cz + s * span, g);   // fascia
    });
    cyl(.14, .14, len, std(0x4b5563, { roughness: .45, metalness: .6 }), cx, ridgeY + .02, cz, g, 12).rotation.z = Math.PI / 2;
    [1, -1].forEach(function (s) {
      var gb = sh(new THREE.Mesh(gableGeo(o.depth, rise), brickMat(1.84, 1.36)));          // gable infill
      gb.material.map.repeat.set(1 / 1.84, 1 / 1.36); gb.material.bumpMap.repeat.set(1 / 1.84, 1 / 1.36);
      gb.position.set(cx + s * (o.len / 2 + .002), Wt, cz); gb.rotation.y = s * Math.PI / 2; g.add(gb);
    });
    return g;
  }
  scene.add(block({ x0: -22, len: 36, frontZ: -8, depth: 11, Wt: 7.5, pitch: .22, band: 3.65, floorYs: [1.95, 5.6], doors: [3, 8] }));
  scene.add(block({ x0: 14, len: 17, frontZ: -5, depth: 9, Wt: 4.1, pitch: .18, floorYs: [2.0], doors: [2] }));

  /* covered walkways: white posts, corrugated beige roof, gutter */
  function walkway(x0, len, wallZ) {
    var g = new THREE.Group(), w = 3.7, th = .11, cx = x0 + len / 2;
    var rf = sh(new THREE.Mesh(new THREE.BoxGeometry(len + .3, .07, w), roofMat(walkT, len + .3, w)));
    rf.position.set(cx, 3.05, wallZ + w / 2); rf.rotation.x = th; g.add(rf);
    var outerY = 3.05 - (w / 2) * Math.sin(th);
    box(len + .3, .14, .1, whiteMat, cx, outerY - .08, wallZ + w, g);
    box(len, .1, .09, whiteMat, cx, outerY - .2, wallZ + w - .08, g);
    for (var x = x0 + .5; x <= x0 + len + .01; x += 3) cyl(.06, .06, outerY - .22, whiteMat, x, (outerY - .22) / 2, wallZ + w - .08, g, 14);
    cyl(.05, .05, len + .3, greyMat, cx, outerY - .02, wallZ + w + .06, g, 10).rotation.z = Math.PI / 2;
    return g;
  }
  scene.add(walkway(-21.5, 35.5, -8)); scene.add(walkway(14.5, 16.5, -5));

  /* paving + curbs */
  function pave(x0, w, z0, d) {
    var m = sh(new THREE.Mesh(new THREE.PlaneGeometry(w, d), paveMat(w, d)), false); m.rotation.x = -Math.PI / 2; m.position.set(x0 + w / 2, .03, z0 + d / 2); scene.add(m);
    box(w + .3, .16, .16, conc(w, .2), x0 + w / 2, .06, z0 + d + .08, scene);
  }
  pave(-22.5, 36.5, -8, 3.9); pave(14, 17.5, -5, 3.9);

  /* lawn variety */
  var pc = cvs(256, 256); (function () { var x = pc.getContext('2d'), g = x.createRadialGradient(128, 128, 0, 128, 128, 128); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 256, 256); })();
  var pt = tex(pc, true);
  for (var i = 0; i < 26; i++) {
    var dark = i % 2 === 0, s = R(7, 18);
    var pm2 = new THREE.Mesh(new THREE.PlaneGeometry(s, s * R(.5, 1)), new THREE.MeshStandardMaterial({ map: pt, color: dark ? 0x2c5a22 : 0x9aa84a, transparent: true, opacity: dark ? .45 : .3, depthWrite: false, roughness: 1, polygonOffset: true, polygonOffsetFactor: -2 }));
    pm2.rotation.x = -Math.PI / 2; pm2.rotation.z = R(0, 3); pm2.position.set(R(-45, 55), .015, R(-2, 48)); pm2.receiveShadow = true; scene.add(pm2);
  }
  var ground = sh(new THREE.Mesh(new THREE.PlaneGeometry(900, 900), grassMat), false); ground.rotation.x = -Math.PI / 2; scene.add(ground);

  /* trees */
  var leafMat = std(0xffffff, { map: leafMap, roughness: 1 }), barkMat = std(0x5a4330, { roughness: 1 });
  function tree(x, z, s, big) {
    var g = new THREE.Group(); cyl(.05 * s, .08 * s, 2.0 * s, barkMat, 0, 1.0 * s, 0, g, 8);
    var n = big ? 7 : 4;
    for (var i = 0; i < n; i++) { var b = sh(new THREE.Mesh(new THREE.SphereGeometry(1, 18, 14), leafMat)); var sc = R(.7, 1.15) * s * (big ? 1.9 : .75); b.scale.set(sc, sc * R(.8, 1), sc);
      b.position.set(R(-.9, .9) * s * (big ? 1.5 : .4), (2.3 + R(0, .9)) * s * (big ? 1.2 : .9), R(-.9, .9) * s * (big ? 1.5 : .4)); g.add(b); }
    if (!big) cyl(.015, .015, 1.4, std(0x8a6a3c), .25, .7, .15, g, 6);
    g.position.set(x, 0, z); scene.add(g);
  }
  [[-8, 1.5], [2, 5], [9.5, 2], [-16.5, 3.5], [-2, 10]].forEach(function (p) { tree(p[0], p[1], R(1.0, 1.25), false); });
  [[-44, -25, 4], [52, -22, 4.5], [-60, 20, 4], [70, 10, 5], [-30, -45, 5], [30, -48, 5.5], [-80, -10, 5]].forEach(function (p) { tree(p[0], p[1], p[2], true); });

  /* benches */
  function bench(x, z, ry) {
    var g = new THREE.Group(), c = conc(2.4, .6);
    box(2.4, .12, .5, c, 0, .5, 0, g); box(.14, .5, .5, c, -.9, .25, 0, g); box(.14, .5, .5, c, .9, .25, 0, g);
    g.position.set(x, 0, z); g.rotation.y = ry; scene.add(g);
  }
  bench(21, .2, -.15); bench(26.5, 1.6, .1); bench(-4, 1.3, .05);

  /* entrance sign */
  (function () {
    var c = cvs(1024, 256), x = c.getContext('2d'); x.fillStyle = '#0b2a78'; x.fillRect(0, 0, 1024, 256);
    x.strokeStyle = '#f59e0b'; x.lineWidth = 10; x.strokeRect(14, 14, 996, 228);
    x.fillStyle = '#fff'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.font = 'bold 92px "Trebuchet MS",Arial,sans-serif'; x.fillText('MUROGOLO', 512, 100);
    x.font = 'bold 56px "Trebuchet MS",Arial,sans-serif'; x.fillStyle = '#fbbf24'; x.fillText('PRIMARY SCHOOL', 512, 186);
    var t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.anisotropy = aniso;
    var g = new THREE.Group(), bm = brickMat(.6, 1.7);
    box(.6, 1.7, .6, bm, -2.35, .85, 0, g); box(.6, 1.7, .6, bm, 2.35, .85, 0, g);
    box(.7, .12, .7, conc(1, 1), -2.35, 1.76, 0, g); box(.7, .12, .7, conc(1, 1), 2.35, 1.76, 0, g);
    var pl = sh(new THREE.Mesh(new THREE.BoxGeometry(4.1, 1.0, .14), [std(0x0b2a78), std(0x0b2a78), std(0x0b2a78), std(0x0b2a78), new THREE.MeshStandardMaterial({ map: t, roughness: .4 }), std(0x0b2a78)]));
    pl.position.set(0, .9, 0); g.add(pl); g.position.set(-12, 0, 11); g.rotation.y = .12; scene.add(g);
  })();

  /* ---------- camera rig ---------- */
  var cam = new THREE.PerspectiveCamera(36, 1, .5, 900);
  function viewFrom(p, t) { var d = new THREE.Vector3(p[0] - t[0], p[1] - t[1], p[2] - t[2]), L = d.length(); return { t: new THREE.Vector3(t[0], t[1], t[2]), yaw: Math.atan2(d.x, d.z), pitch: Math.asin(d.y / L), dist: L }; }
  var VIEWS = { courtyard: viewFrom([13, 4.6, 25], [2, 3.2, -8]), front: viewFrom([1, 3.2, 30], [1, 3.6, -8]), aerial: viewFrom([34, 24, 30], [3, 2, -8]) };
  var cur = JSON.parse(JSON.stringify({ yaw: 0, pitch: 0, dist: 0 })), want = { yaw: VIEWS.courtyard.yaw, pitch: VIEWS.courtyard.pitch, dist: VIEWS.courtyard.dist, t: VIEWS.courtyard.t.clone() };
  cur = { yaw: want.yaw, pitch: want.pitch, dist: want.dist, t: want.t.clone() };

  var ctl = document.getElementById('ctl');
  function mark(attr, val) { ctl.querySelectorAll('[' + attr + ']').forEach(function (b) { var on = b.getAttribute(attr) === val; b.classList.toggle('bg-blue-700', on); b.classList.toggle('text-white', on); b.classList.toggle('text-blue-700', !on); }); }
  ctl.addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    if (b.dataset.view) { var v = VIEWS[b.dataset.view]; want.yaw = v.yaw; want.pitch = v.pitch; want.dist = v.dist; want.t.copy(v.t); mark('data-view', b.dataset.view); }
    if (b.dataset.light) { todWant = b.dataset.light === 'golden' ? 1 : 0; mark('data-light', b.dataset.light); }
  });
  mark('data-view', 'courtyard'); mark('data-light', 'day');

  var drag = null;
  el.addEventListener('pointerdown', function (e) { drag = { x: e.clientX, y: e.clientY }; el.setPointerCapture(e.pointerId); el.style.cursor = 'grabbing'; });
  el.addEventListener('pointermove', function (e) {
    if (!drag) return; var dx = e.clientX - drag.x, dy = e.clientY - drag.y; drag.x = e.clientX; drag.y = e.clientY;
    want.yaw -= dx * .006; want.pitch = Math.max(.03, Math.min(1.25, want.pitch + dy * .004)); cur.yaw = want.yaw; cur.pitch = want.pitch;
  });
  function up() { drag = null; el.style.cursor = ''; } el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);

  /* ---------- time of day ---------- */
  var tod = 0, todWant = 0;
  var cA = { sun: new THREE.Color(0xfff1de), sky: new THREE.Color(0xcfe3ff), gnd: new THREE.Color(0x6f8a4a), fog: new THREE.Color(0xcfe4f4), tint: new THREE.Color(0xffffff) };
  var cB = { sun: new THREE.Color(0xffa05a), sky: new THREE.Color(0xf2b894), gnd: new THREE.Color(0x6b5a3a), fog: new THREE.Color(0xf0c2a0), tint: new THREE.Color(0xffb890) };
  function applyTod(k) {
    var e = (55 - 41 * k) * Math.PI / 180, a = (32 + 38 * k) * Math.PI / 180;
    sun.position.set(Math.cos(e) * Math.sin(a), Math.sin(e), Math.cos(e) * Math.cos(a)).multiplyScalar(110).add(CEN);
    sun.color.copy(cA.sun).lerp(cB.sun, k); sun.intensity = 2.2 + .5 * k;
    hemi.color.copy(cA.sky).lerp(cB.sky, k); hemi.groundColor.copy(cA.gnd).lerp(cB.gnd, k); hemi.intensity = .85 - .25 * k;
    scene.fog.color.copy(cA.fog).lerp(cB.fog, k); skyMat.color.copy(cA.tint).lerp(cB.tint, k);
    r.toneMappingExposure = 1.0 - .08 * k;
  }

  function resize() { var w = el.clientWidth, h = el.clientHeight; if (!w || !h) return; r.setSize(w, h); cam.aspect = w / h; cam.fov = w / h < 1.2 ? 52 : 36; cam.updateProjectionMatrix(); }
  new ResizeObserver(resize).observe(el); resize();

  var running = false, raf = 0, t0 = performance.now();
  function frame(now) {
    var t = (now - t0) / 1000, k = drag ? 0 : .06;
    cur.yaw += (want.yaw - cur.yaw) * (drag ? 1 : k); cur.pitch += (want.pitch - cur.pitch) * (drag ? 1 : k); cur.dist += (want.dist - cur.dist) * k; cur.t.lerp(want.t, k);
    var sway = reduce || drag ? 0 : Math.sin(t * .15) * .035;
    var yaw = cur.yaw + sway, cp = Math.cos(cur.pitch);
    cam.position.set(cur.t.x + cur.dist * Math.sin(yaw) * cp, Math.max(.9, cur.t.y + cur.dist * Math.sin(cur.pitch)), cur.t.z + cur.dist * Math.cos(yaw) * cp);
    cam.lookAt(cur.t);
    if (Math.abs(tod - todWant) > .001) { tod += (todWant - tod) * .05; applyTod(tod); }
    if (!reduce) sky.rotation.y = t * .004;
    sky.position.copy(cam.position); line.position.x = cam.position.x; line.position.z = cam.position.z;
    r.render(scene, cam);
  }
  function loop(now) { frame(now); raf = requestAnimationFrame(loop); }
  function start() { if (!running) { running = true; raf = requestAnimationFrame(loop); } }
  function stop() { running = false; cancelAnimationFrame(raf); }

  applyTod(0); frame(performance.now());
  new IntersectionObserver(function (en) { en[0].isIntersecting ? start() : stop(); }, { threshold: .1 }).observe(el);
  document.addEventListener('visibilitychange', function () { document.hidden ? stop() : (el.getBoundingClientRect().top < innerHeight && start()); });
})();

/* ===== Curriculum: 3D activity cards ===== */
(function () {
  var cards = [].slice.call(document.querySelectorAll('.sport'));
  if (!cards.length) return;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!window.THREE) return;
  var T = THREE;

  function mat(c, o) { return new T.MeshStandardMaterial(Object.assign({ color: c, flatShading: false, roughness: .55, metalness: .04 }, o || {})); }
  function mesh(g, c, o) { return new T.Mesh(g, mat(c, o)); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function c01(x) { return Math.max(0, Math.min(1, x)); }
  function ease(x) { x = c01(x); return x * x * (3 - 2 * x); }
  function easeIn(x) { x = c01(x); return x * x * x; }

  var SKIN = 0x8a5a3c, HAIR = 0x15151a;
  function limb(len, r, c) { var g = new T.CylinderGeometry(r, r * .85, len, 28); g.translate(0, -len / 2, 0); return mesh(g, c); }

  // Low-poly person, facing +z, feet on y = 0
  function person(o) {
    var P = { sh: [], el: [], hand: [], hip: [], kn: [], foot: [] };
    var g = new T.Group(), hips = new T.Group(); hips.position.y = 1.17; g.add(hips);
    hips.add(mesh(new T.CylinderGeometry(.3, .34, .4, 28), o.bottom));
    var chest = new T.Group(); chest.position.y = .15; hips.add(chest);
    var torso = mesh(new T.CylinderGeometry(.37, .3, .78, 28), o.top); torso.position.y = .4; chest.add(torso);
    var head = new T.Group(); head.position.y = 1.0; chest.add(head);
    head.add(mesh(new T.SphereGeometry(.26, 28, 20), SKIN));
    var hair = mesh(new T.SphereGeometry(.275, 28, 20, 0, Math.PI * 2, 0, Math.PI * .52), o.hair || HAIR); hair.position.y = .02; hair.rotation.x = -.15; head.add(hair);
    [-1, 1].forEach(function (s) {
      var sh = new T.Group(); sh.position.set(s * .45, .7, 0); chest.add(sh);
      sh.add(mesh(new T.SphereGeometry(.12, 28, 20), o.top));
      sh.add(limb(.42, .1, o.top));
      var el = new T.Group(); el.position.y = -.42; sh.add(el);
      el.add(limb(.4, .08, SKIN));
      var hand = mesh(new T.SphereGeometry(.1, 28, 20), SKIN); hand.position.y = -.42; el.add(hand);
      P.sh.push(sh); P.el.push(el); P.hand.push(hand);
      var hp = new T.Group(); hp.position.set(s * .17, -.12, 0); hips.add(hp);
      hp.add(limb(.5, .14, SKIN)); hp.add(limb(.28, .165, o.bottom));
      var kn = new T.Group(); kn.position.y = -.5; hp.add(kn);
      kn.add(limb(.5, .1, SKIN));
      var sock = limb(.26, .108, o.sock); sock.position.y = -.24; kn.add(sock);
      var foot = mesh(new T.BoxGeometry(.17, .1, .34), o.shoe || 0x111111); foot.position.set(0, -.5, .08); kn.add(foot);
      P.hip.push(hp); P.kn.push(kn); P.foot.push(foot);
    });
    P.g = g; P.hips = hips; P.chest = chest; P.head = head;
    return P;
  }

  function blob(r, op) {
    var c = document.createElement('canvas'); c.width = c.height = 64;
    var x = c.getContext('2d'), gr = x.createRadialGradient(32, 32, 2, 32, 32, 32);
    gr.addColorStop(0, 'rgba(0,0,0,' + op + ')'); gr.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = gr; x.fillRect(0, 0, 64, 64);
    var m = new T.Mesh(new T.PlaneGeometry(r * 2, r * 2), new T.MeshBasicMaterial({ map: new T.CanvasTexture(c), transparent: true, depthWrite: false }));
    m.rotation.x = -Math.PI / 2; m.position.y = .03; m.visible = false; return m;
  }
  function disc(r, c, x, z) { var m = mesh(new T.CylinderGeometry(r, r, .14, 48), c); m.position.set(x || 0, -.07, z || 0); return m; }
  function ballTex(kind) {
    var W = 512, H = 256, c = document.createElement('canvas'); c.width = W; c.height = H; var x = c.getContext('2d'), im = x.createImageData(W, H);
    var f = (1 + Math.sqrt(5)) / 2, pts = [], blk = [];
    function add(v, b) { var l = Math.hypot(v[0], v[1], v[2]); pts.push([v[0] / l, v[1] / l, v[2] / l]); blk.push(b); }
    [[0, 1, f], [0, -1, f], [0, 1, -f], [0, -1, -f], [1, f, 0], [-1, f, 0], [1, -f, 0], [-1, -f, 0], [f, 0, 1], [-f, 0, 1], [f, 0, -1], [-f, 0, -1]].forEach(function (v) { add(v, 1); });
    var q = 1 / f;
    [[1, 1, 1], [1, 1, -1], [1, -1, 1], [1, -1, -1], [-1, 1, 1], [-1, 1, -1], [-1, -1, 1], [-1, -1, -1], [0, q, f], [0, q, -f], [0, -q, f], [0, -q, -f], [q, f, 0], [q, -f, 0], [-q, f, 0], [-q, -f, 0], [f, 0, q], [f, 0, -q], [-f, 0, q], [-f, 0, -q]].forEach(function (v) { add(v, 0); });
    for (var j = 0; j < H; j++) for (var i = 0; i < W; i++) {
      var th = i / W * Math.PI * 2, ph = j / H * Math.PI, d = [Math.cos(th) * Math.sin(ph), Math.cos(ph), Math.sin(th) * Math.sin(ph)], b1 = -2, b2 = -2, k1 = 0;
      for (var n = 0; n < pts.length; n++) { var dd = d[0] * pts[n][0] + d[1] * pts[n][1] + d[2] * pts[n][2]; if (dd > b1) { b2 = b1; b1 = dd; k1 = n; } else if (dd > b2) b2 = dd; }
      var edge = (b1 - b2) < .028, col;
      if (kind === 'soccer') col = edge ? [70, 70, 74] : blk[k1] ? [22, 22, 26] : [246, 246, 244];
      else { var seam = Math.abs(d[1]) < .035 || Math.abs(d[0]) < .03 || Math.abs(d[2]) < .03 || Math.abs(d[0] - d[2]) < .03 && false; col = seam ? [60, 30, 10] : [226, 102, 22]; var g = ((Math.sin(i * 1.7) * Math.sin(j * 2.3)) * 8) | 0; col = [col[0] + g, col[1] + g, col[2] + g]; }
      var o = (j * W + i) * 4; im.data[o] = col[0]; im.data[o + 1] = col[1]; im.data[o + 2] = col[2]; im.data[o + 3] = 255;
    }
    x.putImageData(im, 0, 0); var t = new T.CanvasTexture(c); t.encoding = T.sRGBEncoding; t.anisotropy = 4; return t;
  }
  var BT = {};
  function ball(r, c) {
    var kind = c === 0xffffff ? 'soccer' : 'net'; BT[kind] = BT[kind] || ballTex(kind);
    var g = new T.Group(); g.add(mesh(new T.SphereGeometry(r, 40, 28), 0xffffff, { map: BT[kind], roughness: kind === 'soccer' ? .32 : .6 }));
    return g;
  }

  /* ---------- SOCCER: player striking the ball ---------- */
  function buildSoccer(scene) {
    var P = person({ top: 0x1d4ed8, bottom: 0xffffff, sock: 0xfacc15 });
    P.g.position.set(-.5, 0, 0); P.g.rotation.y = 1.0; scene.add(P.g);
    scene.add(disc(3.9, 0x5aa016, 1.1, 0));
    var sh = blob(1.2, .4); sh.position.x = -.5; scene.add(sh);
    var B = ball(.3, 0xffffff); scene.add(B);
    var bs = blob(.5, .35); scene.add(bs);
    var trail = []; for (var i = 0; i < 4; i++) { var tm = new T.Mesh(new T.SphereGeometry(.24 - i * .035, 28, 20), new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: .3 - i * .06, depthWrite: false })); scene.add(tm); trail.push(tm); }

    function kick(p) {
      var hip, kn, e;
      if (p < .45) { e = ease(p / .45); hip = lerp(.15, .9, e); kn = lerp(.3, 1.2, e); }
      else if (p < .6) { e = easeIn((p - .45) / .15); hip = lerp(.9, -.95, e); kn = lerp(1.2, .1, e); }
      else if (p < .7) { e = (p - .6) / .1; hip = lerp(-.95, -1.3, e); kn = lerp(.1, .45, e); }
      else { e = ease((p - .7) / .3); hip = lerp(-1.3, .15, e); kn = lerp(.45, .3, e); }
      return [hip, kn];
    }
    function pose(p) {
      var k = kick(p), lean;
      P.hip[1].rotation.x = k[0]; P.kn[1].rotation.x = k[1];
      P.hip[0].rotation.x = .12; P.kn[0].rotation.x = .2;
      if (p < .45) lean = lerp(0, -.18, ease(p / .45)); else if (p < .6) lean = lerp(-.18, .25, (p - .45) / .15); else lean = lerp(.25, 0, ease((p - .6) / .4));
      P.chest.rotation.x = lean; P.chest.rotation.y = -k[0] * .2;
      P.sh[0].rotation.x = k[0] * .8; P.sh[1].rotation.x = -k[0] * .8;
      P.sh[0].rotation.z = -.5; P.sh[1].rotation.z = .5;
      P.el[0].rotation.x = -.5; P.el[1].rotation.x = -.5;
      P.hips.position.y = 1.17 + (p > .55 && p < .8 ? .14 * Math.sin((p - .55) / .25 * Math.PI) : 0);
    }
    pose(.6); scene.updateMatrixWorld(true);
    var rest = new T.Vector3(); P.foot[1].getWorldPosition(rest);
    rest.x += .21; rest.z += .13; rest.y = Math.max(.35, rest.y);

    var ph = .66;
    return {
      cam: [1.3, 2.3, 9.8], look: [1.3, 1.3, 0], aspect: 1.0,
      update: function (dt, h) {
        ph = (ph + dt * (1 + .6 * h) / 2.4) % 1; pose(ph);
        var u = (ph - .58) / .42, k = 1 + .3 * h;
        if (u < 0) { B.position.copy(rest); B.scale.setScalar(1); trail.forEach(function (t) { t.visible = false; }); }
        else {
          var f = function (q) { return [rest.x + 3.2 * k * q, rest.y + 3.0 * q - 2.4 * q * q, rest.z + 3.6 * q]; };
          var b = f(u); B.position.set(b[0], b[1], b[2]); B.scale.setScalar(1 + 1.1 * u);
          trail.forEach(function (t, i) { var q = u - .05 * (i + 1); t.visible = q > 0; if (q > 0) { var tp = f(q); t.position.set(tp[0], tp[1], tp[2]); } });
        }
        B.visible = u < .985; B.rotation.x += dt * 9; B.rotation.z += dt * 4;
        bs.position.x = B.position.x; bs.position.z = B.position.z; bs.scale.setScalar(Math.max(.4, 1.3 - B.position.y * .25));
      }
    };
  }

  /* ---------- NETBALL: shooting through the hoop ---------- */
  function buildNetball(scene) {
    var P = person({ top: 0xfacc15, bottom: 0x1e3a8a, sock: 0xffffff });
    P.g.position.set(-1.3, 0, 0); P.g.rotation.y = .8; scene.add(P.g);
    scene.add(disc(3.7, 0x86198f, .3, 0));
    var sh = blob(1.1, .4); sh.position.x = -1.3; scene.add(sh);
    var RING = new T.Vector3(1.5, 4.0, -.4);
    var post = mesh(new T.CylinderGeometry(.09, .11, 4.0, 28), 0xf1f5f9); post.position.set(1.9, 2.0, -.4); scene.add(post);
    var base = mesh(new T.CylinderGeometry(.42, .48, .16, 28), 0x475569); base.position.set(1.9, .08, -.4); scene.add(base);
    var ring = mesh(new T.TorusGeometry(.4, .045, 8, 28), 0xff6a00); ring.rotation.x = Math.PI / 2; ring.position.copy(RING); scene.add(ring);
    var net = new T.Mesh(new T.CylinderGeometry(.4, .2, .75, 12, 3, true), new T.MeshBasicMaterial({ color: 0xffffff, wireframe: true, transparent: true, opacity: .85 }));
    net.position.set(RING.x, RING.y - .38, RING.z); scene.add(net);
    var B = ball(.3, 0xfff1d6); scene.add(B);
    var bs = blob(.5, .35); scene.add(bs);
    var start = new T.Vector3(), ph = .5, hm = new T.Vector3(), tmp = new T.Vector3();

    function pose(p) {
      var shoot = ease((p - .3) / .2);
      var squat = p < .3 ? ease(p / .3) : (p < .4 ? 1 - ease((p - .3) / .1) : 0);
      var land = (p > .62 && p < .75) ? Math.sin((p - .62) / .13 * Math.PI) * .5 : 0;
      var bend = Math.max(squat, land);
      var air = (p > .3 && p < .62) ? Math.sin((p - .3) / .32 * Math.PI) : 0;
      for (var i = 0; i < 2; i++) { P.hip[i].rotation.x = -.55 * bend - .35 * air; P.kn[i].rotation.x = .95 * bend + .5 * air; }
      P.hips.position.y = 1.17 - .11 * bend + .55 * air;
      var relax = ease((p - .7) / .3);
      var shx = lerp(lerp(-1.55, -2.7, shoot), -.25, relax), elx = lerp(lerp(-1.8, -.3, shoot), -.3, relax);
      for (var j = 0; j < 2; j++) { P.sh[j].rotation.x = shx; P.el[j].rotation.x = elx; }
      P.sh[0].rotation.z = -.12; P.sh[1].rotation.z = .12;
      P.chest.rotation.x = lerp(0, -.12, shoot) * (1 - relax);
    }
    function handsMid(out) { P.g.updateMatrixWorld(true); P.hand[0].getWorldPosition(out); P.hand[1].getWorldPosition(tmp); out.add(tmp).multiplyScalar(.5); out.y += .28; return out; }

    return {
      cam: [.3, 2.3, 9.8], look: [.3, 2.1, 0], aspect: 1.0,
      update: function (dt, h) {
        ph = (ph + dt * (1 + .6 * h) / 2.6) % 1; pose(ph);
        var netS = 1;
        if (ph < .45) { handsMid(hm); B.position.copy(hm); start.copy(hm); B.visible = true; B.scale.setScalar(1); }
        else if (ph < .85) {
          var u = (ph - .45) / .4;
          B.position.set(lerp(start.x, RING.x, u), lerp(start.y, RING.y, u) + 1.0 * Math.sin(Math.PI * u), lerp(start.z, RING.z, u));
        } else {
          var v = (ph - .85) / .15;
          B.position.set(RING.x, RING.y - v * v * 3.7, RING.z); B.visible = v < .98;
          var d = Math.abs(B.position.y - RING.y); if (d < .7) netS = 1 + .3 * (1 - d / .7);
        }
        net.scale.y = netS;
        B.rotation.x += dt * 5;
        bs.position.set(B.position.x, .03, B.position.z); bs.scale.setScalar(Math.max(.4, 1.3 - B.position.y * .22));
      }
    };
  }

  /* ---------- ATHLETICS: sprinting on a track ---------- */
  function buildAthletics(scene) {
    var P = person({ top: 0xfacc15, bottom: 0x111827, sock: 0xffffff, shoe: 0xf8fafc });
    P.g.rotation.y = 1.2; scene.add(P.g);
    var track = mesh(new T.BoxGeometry(14, .12, 4.4), 0xe2552d); track.position.y = -.06; scene.add(track);
    [-1.65, -.55, .55, 1.65].forEach(function (z) { var l = mesh(new T.BoxGeometry(14, .02, .07), 0xffffff); l.position.set(0, .01, z); scene.add(l); });
    var stripes = [];
    for (var i = 0; i < 8; i++) { var s = mesh(new T.BoxGeometry(.08, .02, 4.4), 0xffffff); s.position.set(-6 + i * 1.7, .012, 0); scene.add(s); stripes.push(s); }
    var sh = blob(1.1, .4); scene.add(sh);
    var lines = []; [1.0, 1.55, 2.1].forEach(function (y, i) { var l = new T.Mesh(new T.BoxGeometry(1.1, .035, .035), new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: .5 })); l.position.set(-1.5 - i * .3, y, .3); scene.add(l); lines.push(l); });
    var ph = 0;
    return {
      cam: [1.6, 1.9, 8.2], look: [.3, 1.3, 0], aspect: 1.0,
      update: function (dt, h) {
        var sp = 1 + .5 * h; ph = (ph + dt * sp / .62) % 1; var a = ph * Math.PI * 2;
        P.hip[1].rotation.x = -.95 * Math.sin(a); P.hip[0].rotation.x = .95 * Math.sin(a);
        P.kn[1].rotation.x = .2 + 1.05 * Math.max(0, Math.cos(a)); P.kn[0].rotation.x = .2 + 1.05 * Math.max(0, -Math.cos(a));
        P.sh[1].rotation.x = .9 * Math.sin(a); P.sh[0].rotation.x = -.9 * Math.sin(a);
        P.el[0].rotation.x = -1.5; P.el[1].rotation.x = -1.5;
        P.sh[0].rotation.z = -.1; P.sh[1].rotation.z = .1;
        P.hips.rotation.x = .32; P.chest.rotation.y = .12 * Math.sin(a);
        P.hips.position.y = 1.1 + .08 * Math.abs(Math.sin(a * 2 + .5));
        stripes.forEach(function (s) { s.position.x -= dt * 6 * sp; if (s.position.x < -6) s.position.x += 13.6; });
        lines.forEach(function (l, i) { l.position.x = -1.5 - i * .3 - .35 * Math.abs(Math.sin(a + i)); l.material.opacity = .25 + .35 * Math.abs(Math.sin(a * 1.5 + i)); });
        sh.position.x = Math.sin(a * 2) * .05;
      }
    };
  }

  /* ---------- SPEECH & PERFORMANCE: vintage mic on stage ---------- */
  function buildSpeech(scene) {
    var P = person({ top: 0x2563eb, bottom: 0x1f2937, sock: 0x1f2937 });
    P.g.position.set(-.8, .25, 0); P.g.rotation.y = .55; scene.add(P.g);
    var stage = mesh(new T.CylinderGeometry(3.1, 3.3, .25, 44), 0x92400e); stage.position.y = .125; scene.add(stage);
    var top = mesh(new T.CylinderGeometry(3.0, 3.0, .02, 44), 0xb45309); top.position.y = .26; scene.add(top);
    for (var i = -6; i <= 6; i++) { var c = mesh(new T.BoxGeometry(.7, 6.4, .3), i % 2 ? 0xb91c1c : 0x991b1b); c.position.set(i * .68, 3.2, -2.6); scene.add(c); }
    var val = mesh(new T.BoxGeometry(9.2, .6, .4), 0x7f1d1d); val.position.set(0, 6.2, -2.4); scene.add(val);
    var sh = blob(1.1, .45); sh.position.set(-.8, .27, 0); scene.add(sh);
    // microphone stand + vintage mic
    var mb = mesh(new T.CylinderGeometry(.36, .42, .07, 28), 0x374151); mb.position.set(-.3, .3, .55); scene.add(mb);
    var pole = mesh(new T.CylinderGeometry(.03, .03, 2.1, 28), 0xd1d5db, { metalness: .8, roughness: .25 }); pole.position.set(-.3, 1.34, .55); scene.add(pole);
    var mic = new T.Group(); mic.position.set(-.45, 2.58, .52); mic.rotation.z = .5; scene.add(mic);
    var mh = mesh(new T.SphereGeometry(.2, 28, 20), 0xe5e7eb, { metalness: .85, roughness: .22 }); mh.scale.set(.85, 1.35, .85); mic.add(mh);
    [-.15, 0, .15].forEach(function (y) { var g = mesh(new T.TorusGeometry(.17 - Math.abs(y) * .2, .012, 6, 16), 0x6b7280); g.rotation.x = Math.PI / 2; g.position.y = y; mic.add(g); });
    var neck = mesh(new T.CylinderGeometry(.05, .07, .25, 28), 0x9ca3af); neck.position.y = -.4; mic.add(neck);
    var waves = []; for (var w = 0; w < 3; w++) { var r = new T.Mesh(new T.TorusGeometry(.3, .02, 6, 28), new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: .5, depthWrite: false })); r.position.set(-.3, 2.6, .8); scene.add(r); waves.push(r); }
    var cone = new T.Mesh(new T.ConeGeometry(1.9, 5.4, 28, 1, true), new T.MeshBasicMaterial({ color: 0xfff4b8, transparent: true, opacity: .13, side: T.DoubleSide, depthWrite: false, blending: T.AdditiveBlending }));
    cone.position.set(-.4, 2.9, 0); scene.add(cone);
    var ph = 0;
    return {
      cam: [0, 2.5, 8.8], look: [-.2, 2.2, 0], aspect: 1.7,
      update: function (dt, h) {
        ph = (ph + dt * (1 + .5 * h) / 4) % 1; var a = ph * Math.PI * 2;
        P.head.rotation.x = .07 * Math.sin(a * 6) - .03; P.head.rotation.y = -.15 + .08 * Math.sin(a * 2);
        P.sh[1].rotation.x = -1.25 + .35 * Math.sin(a * 3); P.sh[1].rotation.z = .75 + .2 * Math.sin(a * 3 + 1); P.el[1].rotation.x = -.9 + .4 * Math.sin(a * 3 + 1.5);
        P.sh[0].rotation.x = -1.0; P.sh[0].rotation.z = -.2; P.el[0].rotation.x = -1.15;
        P.chest.rotation.z = .05 * Math.sin(a * 2); P.chest.rotation.x = -.05 + .03 * Math.sin(a * 6);
        P.hips.position.y = 1.17 + .02 * Math.sin(a * 6);
        P.hip[0].rotation.x = .05; P.hip[1].rotation.x = -.06; P.kn[1].rotation.x = .1;
        waves.forEach(function (r, i) { var q = (ph * 3 + i / 3) % 1; r.scale.setScalar(1 + q * 2.6); r.material.opacity = .5 * (1 - q); });
      }
    };
  }

  var BUILD = { soccer: buildSoccer, netball: buildNetball, athletics: buildAthletics, speech: buildSpeech };
  var insts = [];

  cards.forEach(function (card) {
    var host = card.querySelector('.stage'), key = card.dataset.sport, r;
    try { r = new T.WebGLRenderer({ alpha: true, antialias: true }); } catch (e) { host.innerHTML = '<i class="fas ' + (card.dataset.icon || 'fa-star') + ' text-7xl opacity-60 absolute right-8 top-10"></i>'; return; }
    r.setPixelRatio(Math.min(devicePixelRatio, 2)); r.outputEncoding = T.sRGBEncoding; r.setClearColor(0x000000, 0); r.toneMapping = T.ACESFilmicToneMapping; r.toneMappingExposure = 1.15; r.shadowMap.enabled = true; r.shadowMap.type = T.PCFSoftShadowMap;
    r.domElement.style.display = 'block'; host.appendChild(r.domElement);
    var scene = new T.Scene(), cam = new T.PerspectiveCamera(32, 1, .1, 100);
    scene.add(new T.HemisphereLight(0xffffff, 0x8899aa, .7));
    var key1 = new T.DirectionalLight(0xfff4e0, 1.5); key1.position.set(3, 8, 6); key1.castShadow = true; key1.shadow.mapSize.set(1024, 1024); key1.shadow.radius = 5; key1.shadow.bias = -.0008; key1.shadow.normalBias = .03;
    ['left', 'bottom'].forEach(function (k) { key1.shadow.camera[k] = -7; }); ['right', 'top'].forEach(function (k) { key1.shadow.camera[k] = 7; }); key1.shadow.camera.far = 30; scene.add(key1);
    var rim = new T.PointLight(0xaaccff, .7, 40); rim.position.set(-6, 3, -4); scene.add(rim);
    var api = BUILD[key](scene);
    scene.traverse(function (o) { if (o.isMesh && o.material && o.material.isMeshStandardMaterial) { o.castShadow = true; o.receiveShadow = true; } });
    var s = { card: card, r: r, scene: scene, cam: cam, api: api, hov: 0, hv: 0, visible: false, px: 0, py: 0, tx: 0, ty: 0, bp: null };
    function resize() {
      var w = host.clientWidth, hh = host.clientHeight; if (!w || !hh) return;
      r.setSize(w, hh); cam.aspect = w / hh;
      var f = Math.max(1, api.aspect / cam.aspect);
      cam.position.set(api.look[0] + (api.cam[0] - api.look[0]) * f, api.look[1] + (api.cam[1] - api.look[1]) * f, api.cam[2] * f);
      s.bp = cam.position.clone(); cam.lookAt(api.look[0], api.look[1], api.look[2]); cam.updateProjectionMatrix();
      if (reduce) { api.update(0, 0); r.render(scene, cam); }
    }
    new ResizeObserver(resize).observe(host); resize();
    card.addEventListener('pointerenter', function () { s.hov = 1; });
    card.addEventListener('pointerleave', function () { s.hov = 0; s.tx = 0; s.ty = 0; });
    card.addEventListener('pointermove', function (e) { var b = card.getBoundingClientRect(); s.tx = (e.clientX - b.left) / b.width - .5; s.ty = (e.clientY - b.top) / b.height - .5; });
    insts.push(s);
  });

  if (reduce) return;
  function orbit(s) {
    if (!s.bp) return; var L = s.api.look, dx = s.bp.x - L[0], dy = s.bp.y - L[1], dz = s.bp.z - L[2], a = -s.px * .7, ca = Math.cos(a), sa = Math.sin(a);
    s.cam.position.set(L[0] + dx * ca + dz * sa, L[1] + dy + s.py * -1.2 + s.hv * .3, L[2] - dx * sa + dz * ca); s.cam.lookAt(L[0], L[1], L[2]);
  }
  var last = performance.now(), raf = 0;
  function frame(now) {
    var dt = Math.min(.05, (now - last) / 1000); last = now; var any = false;
    insts.forEach(function (s) { if (!s.visible) return; any = true; s.hv += (s.hov - s.hv) * .12; s.px += (s.tx - s.px) * .08; s.py += (s.ty - s.py) * .08; orbit(s); s.api.update(dt, s.hv); s.r.render(s.scene, s.cam); });
    raf = any ? requestAnimationFrame(frame) : 0;
  }
  function wake() { if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); } }
  insts.forEach(function (s) { new IntersectionObserver(function (en) { s.visible = en[0].isIntersecting; if (s.visible) wake(); }).observe(s.card); });
  document.addEventListener('visibilitychange', function () { if (!document.hidden) wake(); });
})();

/* ===== Contact: map ===== */
(function () {
  if (!document.getElementById('schoolMap')) return;
/* School pin. For an exact pin: in Google Maps press and hold on the school, copy the two numbers shown,
   and paste them here, e.g. { lat: -23.2345, lng: 29.9876 }. Until then the map searches the school's name. */
var SCHOOL = { lat: null, lng: null };
var place = SCHOOL.lat !== null ? SCHOOL.lat + ',' + SCHOOL.lng : 'Murogolo Primary School, Tshitale, Limpopo';
var frame = document.getElementById('schoolMap');
function setMap(t) {
  frame.src = 'https://maps.google.com/maps?q=' + encodeURIComponent(place) + '&z=' + 16 + '&t=' + t + '&hl=en&output=embed';
  document.getElementById('tMap').className = 'px-4 py-1.5 rounded-full ' + (t === 'm' ? 'bg-slate-900 text-white' : 'text-slate-700');
  document.getElementById('tSat').className = 'px-4 py-1.5 rounded-full ' + (t === 'k' ? 'bg-slate-900 text-white' : 'text-slate-700');
}
document.getElementById('tMap').onclick = function () { setMap('m'); };
document.getElementById('tSat').onclick = function () { setMap('k'); };
document.getElementById('linkDir').href = 'https://www.google.com/maps/dir/?api=1&destination=' + encodeURIComponent(place);
document.getElementById('linkOpen').href = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(place);
setMap('m');
})();

/* ===== Contact: weekly hours ===== */
(function () {
  if (!document.getElementById('week')) return;
var days = [['Mon', '07:30 – 14:30', 1], ['Tue', '07:30 – 14:30', 1], ['Wed', '07:30 – 14:30', 1], ['Thu', '07:30 – 14:30', 1], ['Fri', '07:30 – 13:00', 2], ['Sat', 'Closed', 0], ['Sun', 'Closed', 0]];
var today = (new Date().getDay() + 6) % 7;
document.getElementById('week').innerHTML = days.map(function (d, i) {
  var c = d[2] === 1 ? 'bg-slate-900 text-white' : d[2] === 2 ? 'bg-slate-700 text-white' : 'bg-slate-200 text-slate-500';
  return '<div class="rounded-2xl p-4 text-center ' + c + (i === today ? ' ring-4 ring-cyan-400' : '') + '"><p class="font-extrabold">' + d[0] + (i === today ? ' <span class="text-cyan-300 text-xs">today</span>' : '') + '</p><p class="text-sm mt-1">' + d[1] + '</p></div>';
}).join('');
})();

/* ===== Donate: payments, tabs, EFT copy ===== */
(function () {
  if (!document.getElementById('amounts')) return;
/* ===== Card payment setup =====
   Fill these in once the school has registered with a gateway.
   PayFast: payfast.co.za -> your merchant ID and key.
   Yoco: create a payment link in the Yoco app/portal and paste it. */
var CONFIG = { payfastMerchantId: '', payfastMerchantKey: '', yocoLink: '' };

var amount = 250;
var AMTS = [100, 250, 500, 1000];
var am = document.getElementById('amounts'), custom = document.getElementById('custom');
function paintAmts() {
  am.innerHTML = AMTS.map(function (a) { return '<button data-a="' + a + '" class="py-2.5 rounded-lg font-bold border-2 ' + (a === amount && !custom.value ? 'bg-fuchsia-700 border-fuchsia-700 text-white' : 'border-gray-200 text-gray-700 hover:border-fuchsia-400') + '">R' + a + '</button>'; }).join('');
}
am.onclick = function (e) { var b = e.target.closest('button'); if (!b) return; amount = +b.dataset.a; custom.value = ''; paintAmts(); };
custom.oninput = function () { paintAmts(); };
paintAmts();
function getAmount() { var v = custom.value ? parseFloat(custom.value) : amount; return v >= 5 ? v : 0; }
var msg = document.getElementById('payMsg');
function say(t) { msg.textContent = t; }
var SOON = 'Card payments are being set up. Please use Bank (EFT) for now, or visit the school office.';

document.getElementById('payfast').onclick = function () {
  var a = getAmount(); if (!a) return say('Please enter an amount of R5 or more.');
  if (!CONFIG.payfastMerchantId || !CONFIG.payfastMerchantKey) return say(SOON);
  var f = document.createElement('form'); f.method = 'post'; f.action = 'https://www.payfast.co.za/eng/process';
  var data = { merchant_id: CONFIG.payfastMerchantId, merchant_key: CONFIG.payfastMerchantKey, amount: a.toFixed(2), item_name: 'Donation to Murogolo Primary School' };
  var n = document.getElementById('dname').value.trim(), m = document.getElementById('demail').value.trim();
  if (n) data.name_first = n; if (m) data.email_address = m;
  Object.keys(data).forEach(function (k) { var i = document.createElement('input'); i.type = 'hidden'; i.name = k; i.value = data[k]; f.appendChild(i); });
  document.body.appendChild(f); f.submit();
};
document.getElementById('yoco').onclick = function () {
  if (!getAmount()) return say('Please enter an amount of R5 or more.');
  if (!CONFIG.yocoLink) return say(SOON);
  window.open(CONFIG.yocoLink, '_blank', 'noopener');
};

/* Tabs */
function tab(card) {
  document.getElementById('paneCard').classList.toggle('hidden', !card);
  document.getElementById('paneEft').classList.toggle('hidden', card);
  document.getElementById('tabCard').className = 'py-2.5 rounded-lg font-bold text-sm ' + (card ? 'bg-white shadow text-fuchsia-800' : 'text-gray-500');
  document.getElementById('tabEft').className = 'py-2.5 rounded-lg font-bold text-sm ' + (!card ? 'bg-white shadow text-fuchsia-800' : 'text-gray-500');
}
document.getElementById('tabCard').onclick = function () { tab(true); };
document.getElementById('tabEft').onclick = function () { tab(false); };
tab(true);

/* EFT details with copy buttons */
var D = [['Account holder', 'Murogolo Primary School'], ['Bank', 'First National Bank (FNB)'], ['Account number', '62024185732'], ['Branch code', '250655'], ['Reference', 'Donation']];
document.getElementById('rows').innerHTML = D.map(function (r, i) { return '<div class="py-3 flex items-center justify-between gap-3"><div><p class="text-xs text-gray-500">' + r[0] + '</p><p id="v' + i + '" class="font-bold text-gray-900 ' + (i == 2 ? 'font-mono text-lg text-fuchsia-800' : '') + '">' + r[1] + '</p></div><button data-cp="' + i + '" class="shrink-0 bg-fuchsia-700 text-white text-sm font-bold px-4 py-2 rounded-lg hover:bg-fuchsia-600"><i class="far fa-copy mr-1"></i>Copy</button></div>'; }).join('');
document.getElementById('rows').onclick = function (e) { var b = e.target.closest('[data-cp]'); if (b) cp(+b.dataset.cp); };
document.getElementById('who').oninput = function () { document.getElementById('v4').textContent = 'Donation ' + this.value.trim(); };
function cp(i) {
  var t = document.getElementById('v' + i).textContent.trim();
  function done() { var el = document.getElementById('toast'); el.textContent = D[i][0] + ' copied'; setTimeout(function () { el.textContent = ''; }, 2000); }
  function fb() { var a = document.createElement('textarea'); a.value = t; document.body.appendChild(a); a.select(); try { document.execCommand('copy'); done(); } catch (e) {} document.body.removeChild(a); }
  if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(t).then(done, fb); else fb();
}
})();


/* ===== Curriculum: phase tabs (only runs on curriculum.html) ===== */
(function () {
  var tabs = document.querySelectorAll('.cur-tab'); if (!tabs.length) return;
  function show(tab, focus) {
    tabs.forEach(function (t) {
      var on = t === tab;
      t.classList.toggle('is-active', on); t.setAttribute('aria-selected', on); t.tabIndex = on ? 0 : -1;
      var p = document.getElementById('panel-' + t.dataset.phase);
      p.hidden = !on; p.classList.toggle('is-active', on);
    });
    if (focus) tab.focus();
  }
  tabs.forEach(function (t, i) {
    t.addEventListener('click', function () { show(t); });
    t.addEventListener('keydown', function (e) {           // arrow-key navigation
      var n = e.key === 'ArrowRight' ? i + 1 : e.key === 'ArrowLeft' ? i - 1 : null;
      if (n === null) return; e.preventDefault(); show(tabs[(n + tabs.length) % tabs.length], true);
    });
  });
})();


/* ===== Footer: back-to-top button ===== */
(function () {
  var b = document.querySelector('.sf-top'); if (!b) return;
  function toggle() { b.classList.toggle('show', window.scrollY > 500); }
  window.addEventListener('scroll', toggle, { passive: true }); toggle();
  b.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: 'smooth' }); });
})();
