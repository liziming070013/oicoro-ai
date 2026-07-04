(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const lerp = (a, b, t) => a + (b - a) * t;
  const smoothstep = (edge0, edge1, x) => { const t = clamp((x - edge0) / (edge1 - edge0), 0, 1); return t * t * (3 - 2 * t); };
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ─── Easing helpers ─── */
  const easeOutQuart = t => 1 - Math.pow(1 - t, 4);
  const easeInOutCubic = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

  /* ════════════════════════════════════════
     SCROLL PROGRESS — cinematic bar
  ════════════════════════════════════════ */
  const progress = $('#progressBar');
  function updateProgress() {
    const max = document.documentElement.scrollHeight - innerHeight;
    progress.style.width = `${max ? (scrollY / max) * 100 : 0}%`;
  }
  addEventListener('scroll', updateProgress, { passive: true });
  updateProgress();

  /* ════════════════════════════════════════
     CINEMATIC REVEAL — staggered parallax
  ════════════════════════════════════════ */
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

  $$('.for-everyone, .platform-card, .usecase-card, .section-head, .wall-header, .pitch-points article, .traction > div, .proof-copy').forEach((el) => {
    el.classList.add('reveal');
    revealObserver.observe(el);
  });

  /* ─── Parallax layer on scroll ─── */
  let scrollTicking = false;
  addEventListener('scroll', () => {
    if (!scrollTicking) {
      requestAnimationFrame(() => {
        const sy = scrollY;
        // Hero parallax — subtle zoom
        const heroVisual = $('.hero-visual');
        if (heroVisual) {
          const heroRect = $('.hero').getBoundingClientRect();
          const heroProgress = clamp(-heroRect.top / heroRect.height, 0, 1);
          heroVisual.style.transform = `scale(${lerp(1, 1.04, heroProgress * 0.5)})`;
        }
        // Trust row fade
        const trustRow = $('.trust-row');
        if (trustRow) {
          const heroRect = $('.hero').getBoundingClientRect();
          trustRow.style.opacity = clamp(1 - (-heroRect.top / 200), 0, 1);
        }
        scrollTicking = false;
      });
      scrollTicking = true;
    }
  }, { passive: true });

  /* ════════════════════════════════════════
     HERO VIEW SWITCH
  ════════════════════════════════════════ */
  $$('.view-switch button').forEach((button) => button.addEventListener('click', () => {
    const product = $('#heroProduct');
    product.dataset.view = button.dataset.view;
    $$('.view-switch button').forEach((item) => item.classList.toggle('active', item === button));
  }));

  /* ════════════════════════════════════════
     SCROLL STORY — cinematic continuous interpolation
  ════════════════════════════════════════ */
  const story = $('#story');
  const storySteps = $$('.story-step');
  const storyDots = $$('.story-dots i');
  const storyImage = $('#storyImage');
  let storyCurrent = -1;
  let storyLocalSmooth = 0; // smoothed progress for animations

  function setStoryStep(index) {
    if (index === storyCurrent) return;
    storyCurrent = index;
    storySteps.forEach((el, i) => el.classList.toggle('active', i === index));
    storyDots.forEach((el, i) => el.classList.toggle('active', i === index));
    $('#storyIndex').textContent = `0${index + 1} / 04`;
    $('#scanMap').classList.toggle('active', index >= 1);
    $('#riskOrbit').classList.toggle('active', index >= 2);
    const next = `./assets/${storySteps[index].dataset.image}`;
    if (!storyImage.src.endsWith(next.slice(1))) {
      storyImage.style.opacity = '.12';
      storyImage.style.transform = 'scale(1.08)';
      setTimeout(() => { storyImage.src = next; storyImage.style.opacity = '1'; storyImage.style.transform = 'scale(1)'; }, 280);
    }
  }

  function onStoryScroll() {
    if (!story) return;
    const rect = story.getBoundingClientRect();
    const travel = story.offsetHeight - innerHeight;
    const raw = clamp(-rect.top / travel, 0, .999);
    // Smooth interpolation for visual effects
    storyLocalSmooth = raw;
    // Discrete step for content
    setStoryStep(Math.floor(raw * 4));

    // Continuous visual effects
    const step = raw * 4;
    const inStep = step - Math.floor(step); // 0-1 within current step

    // Image Ken Burns — subtle zoom + pan
    const scale = lerp(1.0, 1.06, inStep * 0.7);
    const panX = lerp(0, -8, inStep * 0.5);
    storyImage.style.transform = `scale(${scale}) translateX(${panX}px)`;

    // Story text parallax — active text slides up, inactive fades
    storySteps.forEach((el, i) => {
      const stepIndex = Math.floor(step);
      if (i === stepIndex) {
        el.style.opacity = 1;
        el.style.transform = `translateY(${lerp(20, 0, smoothstep(0, 0.3, inStep))}px)`;
        el.style.filter = `blur(${lerp(2, 0, smoothstep(0, 0.2, inStep))}px)`;
      } else if (i < stepIndex) {
        el.style.opacity = 0;
        el.style.transform = 'translateY(-18px)';
        el.style.filter = 'blur(1px)';
      } else {
        el.style.opacity = 0;
        el.style.transform = 'translateY(20px)';
        el.style.filter = 'blur(2px)';
      }
    });

    // Risk score animated counter
    const riskEl = $('#riskOrbit span');
    if (riskEl && storyCurrent >= 2) {
      const targetScore = 92;
      const baseScore = 64;
      const scoreStep = storyCurrent === 2 ? 0 : 1;
      const scoreProgress = scoreStep === 0 ? smoothstep(0, 0.6, inStep) : 1;
      riskEl.textContent = Math.round(lerp(baseScore, targetScore, scoreProgress));
    }
  }
  addEventListener('scroll', onStoryScroll, { passive: true });
  onStoryScroll();

  /* ════════════════════════════════════════
     VIDEO CONTROLS
  ════════════════════════════════════════ */
  const allVideos = $$('video');
  function videoButton(video) { return $(`.video-control[data-video="${video.id}"]`); }
  function syncVideo(video) {
    const button = videoButton(video); if (!button) return;
    button.classList.toggle('playing', !video.paused);
    const label = $('span', button);
    if (label) {
      label.textContent = video.paused
        ? (video.id === 'overviewVideo' ? '播放讲解' : video.id === 'sensorVideo' ? '播放模块讲解' : '播放 AI 决策讲解')
        : '暂停讲解';
    }
    const bar = $('.video-progress span', video.parentElement);
    if (bar) bar.style.width = `${video.duration ? (video.currentTime / video.duration) * 100 : 0}%`;
  }
  $$('.video-control').forEach((button) => button.addEventListener('click', async () => {
    const video = document.getElementById(button.dataset.video); if (!video) return;
    if (video.paused) {
      allVideos.forEach((item) => { if (item !== video) item.pause(); });
      try { await video.play(); } catch (_) { video.controls = true; }
    } else video.pause();
    syncVideo(video);
  }));
  allVideos.forEach((video) => {
    video.addEventListener('play', () => { allVideos.forEach((item) => { if (item !== video) item.pause(); }); syncVideo(video); });
    video.addEventListener('pause', () => syncVideo(video));
    video.addEventListener('timeupdate', () => syncVideo(video));
    video.addEventListener('ended', () => { video.currentTime = 0; syncVideo(video); });
  });
  const overviewVideo = $('#overviewVideo');
  const videoObserver = new IntersectionObserver((entries) => entries.forEach((entry) => {
    const video = entry.target;
    if (video === overviewVideo && entry.isIntersecting && entry.intersectionRatio > .45 && !reduceMotion) video.play().catch(() => {});
    else if (!entry.isIntersecting || entry.intersectionRatio < .12) video.pause();
  }), { threshold: [0, .12, .45, .75] });
  allVideos.forEach((video) => videoObserver.observe(video));
  $('#soundToggle').addEventListener('click', async (event) => {
    overviewVideo.muted = !overviewVideo.muted;
    event.currentTarget.textContent = overviewVideo.muted ? '声音关闭' : '声音开启';
    event.currentTarget.setAttribute('aria-label', overviewVideo.muted ? '开启视频声音' : '关闭视频声音');
    if (overviewVideo.paused) try { await overviewVideo.play(); } catch (_) {}
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden) allVideos.forEach((video) => video.pause()); });

  /* ════════════════════════════════════════
     SENSOR DATA
  ════════════════════════════════════════ */
  const sensorData = [
    { no: '01 / RGB-D', title: '看见姿态，不识别人脸。', desc: '融合颜色与深度，理解人体高度、关节位置与空间距离；端侧只保留匿名骨架语义。', range: '0.4–8 m', rate: '30 FPS', privacy: '端侧脱敏' },
    { no: '02 / THERMAL', title: '在黑暗里，仍能理解。', desc: '热红外识别人体热区与停留状态，不依赖可见光，也不记录面部与衣着细节。', range: '0–6 m', rate: '9 FPS', privacy: '无身份影像' },
    { no: '03 / TOF', title: '把房间变成空间语义。', desc: '飞行时间传感器测量距离，理解床沿、地面与家具边界，让动作发生在正确的空间里。', range: '0.2–5 m', rate: '60 Hz', privacy: '仅深度数据' },
    { no: '04 / NPU', title: '所有判断，都留在家里。', desc: '端侧神经处理器实时融合多模态信号，只输出事件、风险分数与解释，不上传原始画面。', range: '8 TOPS', rate: '< 1 秒', privacy: '本地推理' }
  ];
  let sensorIndex = 0;
  function renderSensor(index) {
    sensorIndex = (index + sensorData.length) % sensorData.length;
    const d = sensorData[sensorIndex];
    // Animate content transition
    const infoPanel = $('.sensor-info');
    if (infoPanel) {
      infoPanel.style.opacity = '0';
      infoPanel.style.transform = 'translateY(8px)';
      setTimeout(() => {
        $('#sensorNo').textContent = d.no;
        $('#sensorTitle').textContent = d.title;
        $('#sensorDesc').textContent = d.desc;
        $('#sensorRange').textContent = d.range;
        $('#sensorRate').textContent = d.rate;
        $('#sensorPrivacy').textContent = d.privacy;
        $('#sensorCount').textContent = `${sensorIndex + 1} / 4`;
        infoPanel.style.opacity = '1';
        infoPanel.style.transform = 'none';
      }, 160);
    } else {
      $('#sensorNo').textContent = d.no;
      $('#sensorTitle').textContent = d.title;
      $('#sensorDesc').textContent = d.desc;
      $('#sensorRange').textContent = d.range;
      $('#sensorRate').textContent = d.rate;
      $('#sensorPrivacy').textContent = d.privacy;
      $('#sensorCount').textContent = `${sensorIndex + 1} / 4`;
    }
    if (window.product3D) window.product3D.select(sensorIndex);
  }
  $('#sensorPrev').addEventListener('click', () => renderSensor(sensorIndex - 1));
  $('#sensorNext').addEventListener('click', () => renderSensor(sensorIndex + 1));

  /* ════════════════════════════════════════
     THREE.JS — High-fidelity 3D Product Model
  ════════════════════════════════════════ */
  function fallback(canvas, fallbackEl) { canvas.hidden = true; fallbackEl.hidden = false; }

  function roundedBoxGeometry(width, height, depth, radius, curveSegments = 16, bevelSegments = 4) {
    const x = -width / 2, y = -height / 2;
    const r = Math.min(radius, width / 2, height / 2);
    const shape = new THREE.Shape();
    shape.moveTo(x + r, y);
    shape.lineTo(x + width - r, y);
    shape.quadraticCurveTo(x + width, y, x + width, y + r);
    shape.lineTo(x + width, y + height - r);
    shape.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
    shape.lineTo(x + r, y + height);
    shape.quadraticCurveTo(x, y + height, x, y + height - r);
    shape.lineTo(x, y + r);
    shape.quadraticCurveTo(x, y, x + r, y);
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth,
      steps: 1,
      bevelEnabled: true,
      bevelSegments,
      bevelSize: 0.05,
      bevelThickness: 0.05,
      curveSegments
    });
    geo.center();
    geo.computeVertexNormals();
    return geo;
  }

  function fabricTexture() {
    const c = document.createElement('canvas');
    c.width = 256; c.height = 256;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#3a3b38';
    ctx.fillRect(0, 0, 256, 256);
    ctx.globalAlpha = 0.18;
    for (let i = 0; i < 800; i++) {
      const x = Math.random() * 256, y = Math.random() * 256, l = 2 + Math.random() * 6;
      ctx.strokeStyle = i % 3 ? '#a9aaa5' : '#111';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.cos(i) * l, y + Math.sin(i) * l);
      ctx.stroke();
    }
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(4, 2);
    t.anisotropy = 8;
    return t;
  }

  /* ─── Generate studio HDRI environment map via CubeCamera fallback ─── */
  function createEnvMap() {
    const size = 128;
    const targets = [
      { color: '#e8e4dc' }, // px
      { color: '#d4d0c8' }, // nx
      { color: '#f0ece4' }, // py
      { color: '#c8c4bc' }, // ny
      { color: '#ddd9d1' }, // pz
      { color: '#c0bdb5' }, // nz
    ];
    const canvases = targets.map(({ color }) => {
      const c = document.createElement('canvas');
      c.width = c.height = size;
      const ctx = c.getContext('2d');
      const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size * 0.8);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.4, color);
      grad.addColorStop(1, '#8a8780');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, size, size);
      return c;
    });
    const textures = canvases.map(c => {
      const t = new THREE.CanvasTexture(c);
      t.mapping = THREE.EquirectangularReflectionMapping;
      return t;
    });
    // Use first texture as environment
    return textures[0];
  }

  function createProductModel(root, mode) {
    const envMap = createEnvMap();

    const bodyMat = new THREE.MeshPhysicalMaterial({
      color: 0xf5f3ee,
      roughness: 0.18,
      metalness: 0.02,
      clearcoat: 0.7,
      clearcoatRoughness: 0.12,
      envMap,
      envMapIntensity: 0.6,
      reflectivity: 0.8
    });
    const darkMat = new THREE.MeshPhysicalMaterial({
      color: 0x0f0f0f,
      roughness: 0.12,
      metalness: 0.6,
      clearcoat: 0.9,
      envMap,
      envMapIntensity: 0.4
    });
    const fabricMat = new THREE.MeshStandardMaterial({
      color: 0x444541,
      map: fabricTexture(),
      roughness: 0.92,
      metalness: 0
    });
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0x428dff,
      transparent: true,
      opacity: 0.9
    });
    const particleMats = [
      new THREE.MeshBasicMaterial({ color: 0x6ca5ff, transparent: true, opacity: 0.9 }),
      new THREE.MeshBasicMaterial({ color: 0xcfff4a, transparent: true, opacity: 0.7 }),
      new THREE.MeshBasicMaterial({ color: 0xff8d66, transparent: true, opacity: 0.6 }),
    ];

    const body = new THREE.Mesh(roundedBoxGeometry(3.82, 2.18, 1.28, 0.34), bodyMat);
    body.position.y = 0.22;
    bodyMat.transparent = true;
    bodyMat.opacity = 1;
    root.add(body);

    const topMat = new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.08, clearcoat: 1, envMap, envMapIntensity: 0.5 });
    topMat.transparent = true;
    topMat.opacity = 1;
    const top = new THREE.Mesh(roundedBoxGeometry(3.62, 0.13, 1.17, 0.18, 12, 2), topMat);
    top.position.y = 1.33;
    root.add(top);

    const base = new THREE.Mesh(roundedBoxGeometry(3.76, 0.92, 1.31, 0.28, 12, 2), fabricMat);
    base.position.y = -1.05;
    base.position.z = 0.01;
    root.add(base);

    const windowMesh = new THREE.Mesh(roundedBoxGeometry(2.95, 0.58, 0.13, 0.22, 12, 2), darkMat);
    windowMesh.position.set(0, 0.52, 0.69);
    root.add(windowMesh);

    // LED lightbar with emissive glow
    const lightbarMat = new THREE.MeshBasicMaterial({ color: 0x428dff, transparent: true, opacity: 0.85 });
    const lightbar = new THREE.Mesh(roundedBoxGeometry(3.18, 0.075, 0.13, 0.03, 10, 2), lightbarMat);
    lightbar.position.set(0, -1.55, 0.34);
    root.add(lightbar);

    // Floor glow — wider, softer, dual color
    const floorGlowOuter = new THREE.Mesh(
      new THREE.CircleGeometry(2.8, 64),
      new THREE.MeshBasicMaterial({ color: 0x1a4fa0, transparent: true, opacity: 0.08, depthWrite: false })
    );
    floorGlowOuter.rotation.x = -Math.PI / 2;
    floorGlowOuter.scale.y = 0.4;
    floorGlowOuter.position.y = -1.65;
    root.add(floorGlowOuter);

    const floorGlow = new THREE.Mesh(
      new THREE.CircleGeometry(2.25, 48),
      new THREE.MeshBasicMaterial({ color: 0x236dcc, transparent: true, opacity: 0.15, depthWrite: false })
    );
    floorGlow.rotation.x = -Math.PI / 2;
    floorGlow.scale.y = 0.45;
    floorGlow.position.y = -1.62;
    root.add(floorGlow);

    // Sensors — higher poly, cinematic glow rings
    const sensorColors = [0x6ca5ff, 0xff8d66, 0xcfff4a, 0xffffff];
    const sensors = [];
    [-.92, -.31, .31, .92].forEach((x, i) => {
      const m = new THREE.Mesh(
        new THREE.SphereGeometry(i === 3 ? 0.14 : 0.19, 32, 24),
        new THREE.MeshPhysicalMaterial({
          color: 0x050706,
          metalness: 0.6,
          roughness: 0.06,
          emissive: sensorColors[i],
          emissiveIntensity: i === 0 ? 0.35 : 0.08,
          clearcoat: 1,
          envMap,
          envMapIntensity: 0.3
        })
      );
      m.position.set(x, 0.52, 0.79);
      m.userData.sensor = i;

      // Glow ring around sensor
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(0.22, 0.26, 32),
        new THREE.MeshBasicMaterial({ color: sensorColors[i], transparent: true, opacity: 0.25, side: THREE.DoubleSide })
      );
      ring.position.copy(m.position);
      ring.position.z += 0.02;
      ring.lookAt(0, 0.52, 10);
      ring.userData.glowRing = true;
      root.add(ring);

      root.add(m);
      sensors.push(m);
    });

    // Internals
    const internals = [];
    const board = new THREE.Mesh(new THREE.BoxGeometry(2.1, 1.05, 0.11),
      new THREE.MeshStandardMaterial({ color: 0x183328, roughness: 0.6, metalness: 0.2 }));
    board.position.z = 0.1;
    root.add(board);
    internals.push(board);

    // Chip with subtle green LED indicator
    const chip = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.72, 0.2),
      new THREE.MeshStandardMaterial({ color: 0x171917, metalness: 0.6, roughness: 0.2 }));
    chip.position.z = 0.28;
    board.add(chip);
    const chipLed = new THREE.Mesh(
      new THREE.CircleGeometry(0.04, 16),
      new THREE.MeshBasicMaterial({ color: 0x5abf72 })
    );
    chipLed.position.set(-0.25, 0.25, 0.11);
    chip.add(chipLed);

    const battery = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.3, 0.42),
      new THREE.MeshStandardMaterial({ color: 0xc0c2bc, metalness: 0.8, roughness: 0.2 }));
    battery.position.set(1.38, -0.05, 0);
    root.add(battery);
    internals.push(battery);

    // Particles — multi-colored, variable size, trail effect
    const particles = [];
    for (let i = 0; i < 28; i++) {
      const size = 0.015 + Math.random() * 0.02;
      const matIdx = i % 3;
      const m = new THREE.Mesh(new THREE.SphereGeometry(size, 12, 10), particleMats[matIdx].clone());
      m.userData.t = i / 28;
      m.userData.speed = 0.7 + Math.random() * 0.6;
      m.userData.amplitude = 0.3 + Math.random() * 0.4;
      m.position.z = 0.88;
      root.add(m);
      particles.push(m);
    }

    return { body, top, windowMesh, lightbar, base, sensors, internals, particles, floorGlow, floorGlowOuter, lightbarMat };
  }

  function initThree(canvas, fallbackEl, mode) {
    if (!window.THREE) { fallback(canvas, fallbackEl); return null; }
    let renderer;
    try {
      // Enable antialias for high-fidelity rendering
      renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance'
      });
    } catch (e) { fallback(canvas, fallbackEl); return null; }

    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;

    const scene = new THREE.Scene();
    // Subtle scene fog for depth
    scene.fog = new THREE.FogExp2(mode === 'hero' ? 0x0a0a0a : 0x0f0f0d, 0.04);

    const camera = new THREE.PerspectiveCamera(mode === 'hero' ? 30 : 36, 1, 0.1, 100);
    camera.position.set(mode === 'hero' ? 0 : 0.5, mode === 'hero' ? 0.1 : 0.3, mode === 'hero' ? 8.5 : 7.5);

    const root = new THREE.Group();
    scene.add(root);

    // Three-point cinematic lighting
    // Key light — warm white, upper left
    const keyLight = new THREE.DirectionalLight(0xfff5e6, 3.0);
    keyLight.position.set(-5, 7, 6);
    scene.add(keyLight);

    // Fill light — cool blue, lower right (reduced intensity)
    const fillLight = new THREE.DirectionalLight(0xb8d4ff, 0.8);
    fillLight.position.set(4, 2, -3);
    scene.add(fillLight);

    // Rim/back light — colored accent
    const rimLight = new THREE.PointLight(mode === 'hero' ? 0x6ca5ff : 0xcfff4a, 4.0, 18);
    rimLight.position.set(5, 3, 4);
    scene.add(rimLight);

    // Hemisphere for ambient fill
    const hemi = new THREE.HemisphereLight(0xffffff, 0x333333, 1.5);
    scene.add(hemi);

    // Subtle bottom fill for base visibility
    const bottomFill = new THREE.PointLight(0x428dff, 0.5, 8);
    bottomFill.position.set(0, -4, 2);
    scene.add(bottomFill);

    const model = createProductModel(root, mode);

    let autoRotate = mode !== 'hero';
    let autoRotateTimeout = null;
    let exploded = false;
    let flow = true;
    let selected = 0;
    let dragging = false;
    let lastX = 0;
    let dragDistance = 0;
    let targetY = mode === 'hero' ? 0.35 : -0.06;
    let targetX = mode === 'hero' ? 0.04 : -0.06;
    let disposed = false;
    let visible = true;
    let rafId = null;
    let hoverPulse = 0;

    root.rotation.set(targetX, targetY, 0);
    root.scale.setScalar(mode === 'hero' ? 0.95 : 0.94);

    function resize() {
      if (disposed) return;
      const r = canvas.getBoundingClientRect();
      if (r.width < 2 || r.height < 2) return;
      renderer.setSize(r.width, r.height, false);
      camera.aspect = r.width / r.height;
      camera.updateProjectionMatrix();
    }

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();

    const pointer = { x: 0, y: 0 };
    const ray = new THREE.Raycaster();

    // Inertial auto-rotate after 1s of inactivity
    function resetAutoRotateTimer() {
      if (mode === 'hero') return; // hero doesn't auto-rotate by default
      clearTimeout(autoRotateTimeout);
      autoRotateTimeout = setTimeout(() => { autoRotate = true; }, 1000);
    }

    function down(e) {
      dragging = true;
      dragDistance = 0;
      lastX = e.clientX;
      canvas.setPointerCapture?.(e.pointerId);
      autoRotate = false;
      resetAutoRotateTimer();
    }
    function move(e) {
      if (!dragging) return;
      const dx = e.clientX - lastX;
      dragDistance += Math.abs(dx);
      targetY += dx * 0.006;
      lastX = e.clientX;
      // Inertia will be handled in tick
    }
    function up(e) {
      if (dragging && dragDistance < 5) {
        // It was a click, not a drag
        click(e);
      }
      dragging = false;
      canvas.releasePointerCapture?.(e.pointerId);
      resetAutoRotateTimer();
    }
    function click(e) {
      const r = canvas.getBoundingClientRect();
      pointer.x = (e.clientX - r.left) / r.width * 2 - 1;
      pointer.y = -(e.clientY - r.top) / r.height * 2 + 1;
      ray.setFromCamera(pointer, camera);
      const hit = ray.intersectObjects(model.sensors, false)[0];
      if (hit) {
        selected = hit.object.userData.sensor;
        renderSensor(selected);
      }
    }
    canvas.addEventListener('pointerdown', down);
    canvas.addEventListener('pointermove', move);
    canvas.addEventListener('pointerup', up);
    canvas.addEventListener('pointercancel', up);

    let last = performance.now();
    let velocityY = 0;

    function tick(now) {
      rafId = requestAnimationFrame(tick);
      if (disposed || !visible) return;

      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;

      // Auto rotation with smooth deceleration
      if (autoRotate && !dragging && !reduceMotion) {
        targetY += dt * 0.22;
      }

      // Smooth camera rotation
      const rotLerp = dragging ? 0.12 : 0.06;
      root.rotation.y += (targetY - root.rotation.y) * rotLerp;
      root.rotation.x += (targetX - root.rotation.x) * 0.06;

      // Explode animation — smoother, with overshoot damping
      const explodeLerp = 0.06;
      const bodyOpacityTarget = exploded ? 0.12 : 1;
      model.body.material.opacity += (bodyOpacityTarget - model.body.material.opacity) * explodeLerp;
      model.top.material.opacity += (bodyOpacityTarget - model.top.material.opacity) * explodeLerp;
      model.base.position.y += ((exploded ? -2.1 : -1.05) - model.base.position.y) * explodeLerp;
      model.windowMesh.position.z += ((exploded ? 1.78 : 0.69) - model.windowMesh.position.z) * explodeLerp;
      model.lightbar.position.y += ((exploded ? -2.3 : -1.55) - model.lightbar.position.y) * explodeLerp;
      model.internals.forEach((m, i) => {
        const targetZ = exploded ? i * 0.55 + 0.6 : (i ? 0 : 0.1);
        m.position.z += (targetZ - m.position.z) * explodeLerp;
      });

      // Sensor glow animation — cinematic pulse
      hoverPulse += dt * 2.5;
      model.sensors.forEach((s, i) => {
        const isSelected = i === selected;
        const baseGlow = isSelected ? 0.9 : 0.06;
        const pulseAmount = isSelected ? 0.15 * Math.sin(hoverPulse + i) : 0;
        const targetGlow = baseGlow + pulseAmount;
        s.material.emissiveIntensity += (targetGlow - s.material.emissiveIntensity) * 0.12;
        const targetScale = isSelected ? 1.4 : 1;
        const current = s.scale.x;
        const next = current + (targetScale - current) * 0.1;
        s.scale.set(next, next, next);
      });

      // LED lightbar breathing
      if (model.lightbarMat) {
        const breathe = 0.7 + 0.3 * Math.sin(hoverPulse * 0.8);
        model.lightbarMat.opacity = breathe;
      }

      // Floor glow pulse
      if (model.floorGlow) {
        model.floorGlow.material.opacity = 0.12 + 0.05 * Math.sin(hoverPulse * 0.6);
      }

      // Particles — cinematic multi-color trail flow
      model.particles.forEach((p, i) => {
        p.visible = flow;
        if (!flow) return;
        const speed = p.userData.speed;
        const amp = p.userData.amplitude;
        const t = (p.userData.t + now * 0.00012 * speed) % 1;
        const easeT = easeInOutCubic(t);
        p.position.set(
          -2.8 + easeT * 5.6,
          Math.sin(t * Math.PI * 3 + i * 0.8) * amp,
          1.02 + Math.sin(t * Math.PI * 2) * 0.15
        );
        // Fade in/out at edges
        const edgeFade = Math.sin(t * Math.PI);
        p.material.opacity = (0.3 + edgeFade * 0.7) * 0.8;
        // Scale pulse
        const s = 0.8 + edgeFade * 0.5;
        p.scale.set(s, s, s);
      });

      renderer.render(scene, camera);
    }
    rafId = requestAnimationFrame(tick);

    const visibilityObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => { visible = entry.isIntersecting; });
    }, { threshold: 0.02 });
    visibilityObserver.observe(canvas);

    return {
      select(i) { selected = i; },
      toggleExplode(force) { exploded = force === undefined ? !exploded : force; return exploded; },
      toggleRotate() {
        autoRotate = !autoRotate;
        if (!autoRotate) clearTimeout(autoRotateTimeout);
        return autoRotate;
      },
      toggleFlow() { flow = !flow; return flow; },
      dispose() {
        disposed = true;
        if (rafId) cancelAnimationFrame(rafId);
        clearTimeout(autoRotateTimeout);
        ro.disconnect();
        visibilityObserver.disconnect();
        renderer.dispose();
      }
    };
  }

  // Initialize both 3D scenes
  const hero3D = initThree($('#heroCanvas'), $('#heroFallback'), 'hero');
  const lab3D = initThree($('#labCanvas'), $('#labFallback'), 'lab');
  window.product3D = lab3D;

  $('#heroExplode').addEventListener('click', (e) => {
    if (!hero3D) return;
    const isExploded = hero3D.toggleExplode();
    e.currentTarget.classList.toggle('dark', isExploded);
    e.currentTarget.textContent = isExploded ? '合上产品结构' : '探索内部结构';
  });
  $('#rotateToggle').addEventListener('click', (e) => { if (!lab3D) return; e.currentTarget.classList.toggle('active', lab3D.toggleRotate()); });
  $('#explodeToggle').addEventListener('click', (e) => { if (!lab3D) return; e.currentTarget.classList.toggle('active', lab3D.toggleExplode()); });
  $('#flowToggle').addEventListener('click', (e) => { if (!lab3D) return; e.currentTarget.classList.toggle('active', lab3D.toggleFlow()); });

  /* ─── Cleanup ─── */
  addEventListener('pagehide', () => {
    hero3D?.dispose();
    lab3D?.dispose();
    videoObserver.disconnect();
    allVideos.forEach((video) => video.pause());
  }, { once: true });
})();
