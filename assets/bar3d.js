/* ═══════════════════════════════════════════════════════════════
   Reusable 3D precious-metal bar — adapted from Claude Design bundle
   (5Jk7rr1mGHFu5Wo5W6ifeQ / "Gold Bar.html") to render inside a
   container of arbitrary size, with gold / silver presets.
   ═══════════════════════════════════════════════════════════════ */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const PRESETS = {
  gold: {
    color: 0xc98a2b,
    roughness: 0.35,
    envIntensity: 1.6,
    bumpScale: 1.2,
    exposure: 0.85,
    keyLight: 0xfff2d0,
    rimLight: 0xffc978,
    rectA: 0xfff4d6,
    ambient: 0x443322,
    warm: 'rgba(255,216,168,0.55)',
    bright: 'rgba(255,250,228,0.45)',
    dark: 'rgba(180,140,80,0.50)',
    stamp: { title: 'FINE GOLD', value: '999.9', weight: '1000 g', serial: 'No. AU · 042719' },
  },
  silver: {
    color: 0xd8dde3,
    roughness: 0.28,
    envIntensity: 1.9,
    bumpScale: 1.05,
    exposure: 0.95,
    keyLight: 0xf3f6ff,
    rimLight: 0xc9d6ff,
    rectA: 0xe7eeff,
    ambient: 0x1e2530,
    warm: 'rgba(215,225,240,0.50)',
    bright: 'rgba(250,252,255,0.55)',
    dark: 'rgba(80,95,120,0.45)',
    stamp: { title: 'FINE SILVER', value: '999.0', weight: '1000 g', serial: 'No. AG · 042719' },
  },
};

export function initBar3D({ container, variant = 'gold' } = {}) {
  const el = typeof container === 'string' ? document.querySelector(container) : container;
  if (!el) return null;
  const preset = PRESETS[variant] || PRESETS.gold;

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, premultipliedAlpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);
  renderer.setClearAlpha(0);
  renderer.autoClear = true;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = preset.exposure;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  el.appendChild(renderer.domElement);
  renderer.domElement.style.display = 'block';
  renderer.domElement.style.width = '100%';
  renderer.domElement.style.height = '100%';

  const getSize = () => {
    const r = el.getBoundingClientRect();
    return { w: Math.max(1, r.width), h: Math.max(1, r.height) };
  };
  const { w: w0, h: h0 } = getSize();
  renderer.setSize(w0, h0, false);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, w0 / h0, 0.1, 200);
  camera.position.set(0, 0.4, 6.2);

  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();
  const roomEnv = new RoomEnvironment(renderer);
  scene.environment = pmrem.fromScene(roomEnv, 0.04).texture;

  // ── lights
  const keyLight = new THREE.DirectionalLight(preset.keyLight, 1.2);
  keyLight.position.set(-4, 6, 4);
  scene.add(keyLight);
  const fill = new THREE.DirectionalLight(0xbfd4ff, 0.3);
  fill.position.set(5, 3, 2);
  scene.add(fill);
  const rim = new THREE.SpotLight(preset.rimLight, 1.5, 20, Math.PI / 6, 0.5, 1.2);
  rim.position.set(2, 4, -5);
  scene.add(rim);
  scene.add(rim.target);
  const rectLight1 = new THREE.RectAreaLight(preset.rectA, 4, 6, 2);
  rectLight1.position.set(-3, 5, 2); rectLight1.lookAt(0, 0, 0);
  scene.add(rectLight1);
  const rectLight2 = new THREE.RectAreaLight(0xcbe0ff, 2, 5, 2);
  rectLight2.position.set(3, 3, 3); rectLight2.lookAt(0, 0, 0);
  scene.add(rectLight2);
  scene.add(new THREE.AmbientLight(preset.ambient, 0.15));

  // ── bar geometry (lofted rounded-rectangle rings, trapezoidal, beveled)
  function buildBar({
    L = 3.2, W = 1.3, H = 0.62,
    taperL = 0.14, taperW = 0.10,
    bevel = 0.085, cornerR = 0.12,
    bevelSegs = 14, cornerSegs = 12,
  } = {}) {
    function rrectPoly(hl, hw, r, seg) {
      r = Math.max(0.0001, Math.min(r, Math.min(hl, hw) - 0.001));
      const pts = [];
      const corners = [
        [hl - r, hw - r, 0],
        [-hl + r, hw - r, Math.PI / 2],
        [-hl + r, -hw + r, Math.PI],
        [hl - r, -hw + r, -Math.PI / 2],
      ];
      for (let c = 0; c < 4; c++) {
        const [cx, cz, start] = corners[c];
        for (let i = 0; i < seg; i++) {
          const a = start + (i / seg) * (Math.PI / 2);
          pts.push([cx + Math.cos(a) * r, cz + Math.sin(a) * r]);
        }
      }
      return pts;
    }
    const rings = [];
    const baseHL = L / 2, baseHW = W / 2;
    const baseAt = (y) => {
      const t = (y + H / 2) / H;
      return { hl: baseHL - t * taperL, hw: baseHW - t * taperW };
    };
    for (let i = 0; i <= bevelSegs; i++) {
      const phi = (i / bevelSegs) * (Math.PI / 2);
      const y = -H / 2 + bevel * (1 - Math.cos(phi));
      const inset = bevel * (1 - Math.sin(phi));
      const b = baseAt(y);
      rings.push({ y, hl: Math.max(0.01, b.hl - inset), hw: Math.max(0.01, b.hw - inset), r: cornerR });
    }
    for (let i = 1; i <= 2; i++) {
      const y = -H / 2 + bevel + (i / 3) * (H - 2 * bevel);
      const b = baseAt(y);
      rings.push({ y, hl: b.hl, hw: b.hw, r: cornerR });
    }
    for (let i = 0; i <= bevelSegs; i++) {
      const phi = (1 - i / bevelSegs) * (Math.PI / 2);
      const y = H / 2 - bevel * (1 - Math.cos(phi));
      const inset = bevel * (1 - Math.sin(phi));
      const b = baseAt(y);
      rings.push({ y, hl: Math.max(0.01, b.hl - inset), hw: Math.max(0.01, b.hw - inset), r: cornerR });
    }
    const polylines = rings.map(r => rrectPoly(r.hl, r.hw, r.r, cornerSegs));
    const N = polylines[0].length;
    const positions = [], indices = [];
    for (let r = 0; r < rings.length; r++) {
      const y = rings[r].y;
      for (let i = 0; i < N; i++) {
        const [x, z] = polylines[r][i];
        positions.push(x, y, z);
      }
    }
    for (let r = 0; r < rings.length - 1; r++) {
      const a = r * N, b = (r + 1) * N;
      for (let i = 0; i < N; i++) {
        const j = (i + 1) % N;
        indices.push(a + i, a + j, b + j);
        indices.push(a + i, b + j, b + i);
      }
    }
    const topBase = (rings.length - 1) * N;
    const topY = rings[rings.length - 1].y;
    const topCenter = positions.length / 3;
    positions.push(0, topY, 0);
    for (let i = 0; i < N; i++) {
      const j = (i + 1) % N;
      indices.push(topCenter, topBase + i, topBase + j);
    }
    const botBase = 0;
    const botY = rings[0].y;
    const botCenter = positions.length / 3;
    positions.push(0, botY, 0);
    for (let i = 0; i < N; i++) {
      const j = (i + 1) % N;
      indices.push(botCenter, botBase + j, botBase + i);
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setIndex(indices);
    geo.computeVertexNormals();

    // UVs: sides sample left 10 % wear-stripe, top ring samples the stamp region.
    const vCount = positions.length / 3;
    const uvs = new Float32Array(vCount * 2);
    const Htot = rings[rings.length - 1].y - rings[0].y;
    for (let r = 0; r < rings.length; r++) {
      const poly = polylines[r];
      const yNorm = (rings[r].y - rings[0].y) / Math.max(0.0001, Htot);
      let total = 0; const segLen = [0];
      for (let i = 0; i < N; i++) {
        const [ax, az] = poly[i];
        const [bx, bz] = poly[(i + 1) % N];
        total += Math.hypot(bx - ax, bz - az);
        segLen.push(total);
      }
      for (let i = 0; i < N; i++) {
        uvs[(r * N + i) * 2]     = (segLen[i] / total) * 0.10;
        uvs[(r * N + i) * 2 + 1] = yNorm;
      }
    }
    uvs[botCenter * 2] = 0.05; uvs[botCenter * 2 + 1] = 0.0;
    uvs[topCenter * 2] = 0.5;  uvs[topCenter * 2 + 1] = 0.5;

    const topRing = rings[rings.length - 1];
    const hlT = topRing.hl, hwT = topRing.hw;
    const stampCenterU = 0.5 + 100 / 2048;
    const topScale = 0.80;
    for (let i = 0; i < N; i++) {
      const [x, z] = polylines[rings.length - 1][i];
      uvs[(topBase + i) * 2]     = stampCenterU + (x / (2 * hlT)) * topScale;
      uvs[(topBase + i) * 2 + 1] = 0.5 - (z / (2 * hwT)) * topScale;
    }
    uvs[topCenter * 2] = stampCenterU;
    uvs[topCenter * 2 + 1] = 0.5;

    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    return geo;
  }

  // ── textures
  function makeStampBump() {
    const c = document.createElement('canvas'); c.width = 2048; c.height = 1024;
    const ctx = c.getContext('2d');
    const W = c.width, H = c.height;
    ctx.fillStyle = '#808080'; ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 0.55;
    for (let i = 0; i < 420; i++) {
      const x = Math.random() * W, y = Math.random() * H;
      const len = 40 + Math.random() * 320, ang = Math.random() * Math.PI * 2;
      ctx.strokeStyle = Math.random() > 0.5 ? '#4a4a4a' : '#b0b0b0';
      ctx.lineWidth = 0.6 + Math.random() * 1.4;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(ang) * len, y + Math.sin(ang) * len); ctx.stroke();
    }
    ctx.globalAlpha = 0.75;
    for (let i = 0; i < 45; i++) {
      const x = Math.random() * W, y = Math.random() * H;
      const len = 80 + Math.random() * 380, ang = Math.random() * Math.PI * 2;
      ctx.strokeStyle = '#2a2a2a';
      ctx.lineWidth = 1.0 + Math.random() * 1.8;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(ang) * len, y + Math.sin(ang) * len); ctx.stroke();
    }
    ctx.globalAlpha = 0.65;
    for (let i = 0; i < 90; i++) {
      const x = Math.random() * W, y = Math.random() * H;
      const r = 2 + Math.random() * 7;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, '#303030'); g.addColorStop(1, 'rgba(128,128,128,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1.0;

    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#0a0a0a';
    const CX = W / 2 + 100;
    ctx.font = '800 170px "Helvetica Neue", Arial, sans-serif';
    ctx.fillText(preset.stamp.title, CX, 260);
    ctx.font = '900 340px "Helvetica Neue", Arial, sans-serif';
    ctx.fillText(preset.stamp.value, CX, 560);
    ctx.font = '700 140px "Helvetica Neue", Arial, sans-serif';
    ctx.fillText(preset.stamp.weight, CX, 790);
    ctx.font = '600 76px "Helvetica Neue", Arial, sans-serif';
    ctx.fillText(preset.stamp.serial, CX, 920);
    ctx.strokeStyle = '#1a1a1a'; ctx.lineWidth = 14;
    ctx.strokeRect(320, 100, W - 440, H - 200);

    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.NoColorSpace; t.anisotropy = 16;
    return t;
  }

  function makeRough() {
    const c = document.createElement('canvas'); c.width = 2048; c.height = 1024;
    const ctx = c.getContext('2d');
    const W = c.width, H = c.height;
    ctx.fillStyle = '#b4b4b4'; ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < 22; i++) {
      const x = Math.random() * W, y = Math.random() * H;
      const r = 180 + Math.random() * 380;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      const bright = Math.random() > 0.5;
      g.addColorStop(0, bright ? 'rgba(210,210,210,0.35)' : 'rgba(110,110,110,0.32)');
      g.addColorStop(1, 'rgba(180,180,180,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    }
    ctx.save();
    for (let i = 0; i < 14; i++) {
      const x = 100 + Math.random() * (W - 200), y = 100 + Math.random() * (H - 200);
      const rx = 60 + Math.random() * 140, ry = 35 + Math.random() * 70;
      const ang = Math.random() * Math.PI * 2;
      ctx.translate(x, y); ctx.rotate(ang);
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, Math.max(rx, ry));
      g.addColorStop(0, 'rgba(90,90,90,0.35)'); g.addColorStop(1, 'rgba(90,90,90,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2); ctx.fill();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
    ctx.restore();
    ctx.globalAlpha = 0.08;
    for (let i = 0; i < 3500; i++) {
      const x = Math.random() * W, y = Math.random() * H;
      const len = 8 + Math.random() * 70, ang = Math.random() * Math.PI * 2;
      ctx.strokeStyle = Math.random() > 0.5 ? '#f0f0f0' : '#606060';
      ctx.lineWidth = 0.3 + Math.random() * 0.7;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(ang) * len, y + Math.sin(ang) * len); ctx.stroke();
    }
    ctx.globalAlpha = 0.18;
    for (let i = 0; i < 120; i++) {
      const x = Math.random() * W, y = Math.random() * H;
      const len = 80 + Math.random() * 260, ang = Math.random() * Math.PI * 2;
      ctx.strokeStyle = Math.random() > 0.5 ? '#ffffff' : '#4a4a4a';
      ctx.lineWidth = 0.8 + Math.random() * 1.2;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(ang) * len, y + Math.sin(ang) * len); ctx.stroke();
    }
    ctx.globalAlpha = 0.32;
    for (let i = 0; i < 18; i++) {
      const x = Math.random() * W, y = Math.random() * H;
      const len = 120 + Math.random() * 400, ang = Math.random() * Math.PI * 2;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.1 + Math.random() * 1.6;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(ang) * len, y + Math.sin(ang) * len); ctx.stroke();
    }
    ctx.globalAlpha = 1.0;
    ctx.fillStyle = 'rgba(220,220,220,0.18)';
    ctx.fillRect(0, 0, W, 80); ctx.fillRect(0, H - 80, W, 80);
    ctx.fillRect(0, 0, 80, H); ctx.fillRect(W - 80, 0, 80, H);

    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#5a5a5a';
    const CX = W / 2 + 100;
    ctx.font = '800 170px "Helvetica Neue", Arial, sans-serif';
    ctx.fillText(preset.stamp.title, CX, 260);
    ctx.font = '900 340px "Helvetica Neue", Arial, sans-serif';
    ctx.fillText(preset.stamp.value, CX, 560);
    ctx.font = '700 140px "Helvetica Neue", Arial, sans-serif';
    ctx.fillText(preset.stamp.weight, CX, 790);
    ctx.font = '600 76px "Helvetica Neue", Arial, sans-serif';
    ctx.fillText(preset.stamp.serial, CX, 920);
    ctx.strokeStyle = '#6a6a6a'; ctx.lineWidth = 14;
    ctx.strokeRect(320, 100, W - 440, H - 200);

    const t = new THREE.CanvasTexture(c);
    t.anisotropy = 16;
    return t;
  }

  function makeColorMap() {
    const c = document.createElement('canvas'); c.width = 2048; c.height = 1024;
    const ctx = c.getContext('2d');
    const W = c.width, H = c.height;
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < 14; i++) {
      const x = Math.random() * W, y = Math.random() * H;
      const r = 200 + Math.random() * 420;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, preset.warm); g.addColorStop(1, 'rgba(255,216,168,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    }
    for (let i = 0; i < 8; i++) {
      const x = Math.random() * W, y = Math.random() * H;
      const r = 180 + Math.random() * 360;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, preset.bright); g.addColorStop(1, 'rgba(255,250,228,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    }
    ctx.globalAlpha = 0.18;
    for (let i = 0; i < 60; i++) {
      const x = Math.random() * W, y = Math.random() * H;
      const r = 20 + Math.random() * 80;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, preset.dark); g.addColorStop(1, 'rgba(180,140,80,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    }
    ctx.globalAlpha = 1.0;
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 16;
    return t;
  }

  const mat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(preset.color),
    metalness: 1.0,
    roughness: preset.roughness,
    envMapIntensity: preset.envIntensity,
    clearcoat: 0.3,
    clearcoatRoughness: 0.18,
    reflectivity: 1.0,
    side: THREE.DoubleSide,
    map: makeColorMap(),
    roughnessMap: makeRough(),
    bumpMap: makeStampBump(),
    bumpScale: preset.bumpScale,
  });

  const bar = new THREE.Mesh(buildBar(), mat);
  bar.rotation.z = Math.PI / 2;           // stand upright
  const barPivot = new THREE.Group();
  const tilt = new THREE.Group();
  tilt.rotation.x = 0.22;
  tilt.rotation.z = -0.08;
  barPivot.add(bar);
  tilt.add(barPivot);
  scene.add(tilt);

  // ── controls + post
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true; controls.dampingFactor = 0.08;
  controls.minDistance = 3.2; controls.maxDistance = 12;
  controls.enablePan = false;

  let autoRotate = true, lastInteract = 0;
  controls.addEventListener('start', () => { autoRotate = false; lastInteract = performance.now(); });
  controls.addEventListener('end',   () => { lastInteract = performance.now(); });

  const ro = new ResizeObserver(() => {
    const { w, h } = getSize();
    camera.aspect = w / h; camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
  });
  ro.observe(el);

  const clock = new THREE.Clock();
  let raf;
  (function tick() {
    const dt = clock.getDelta();
    if (!autoRotate && performance.now() - lastInteract > 2000) autoRotate = true;
    if (autoRotate) barPivot.rotation.y += dt * 0.55;
    camera.position.y = 0.4 + Math.sin(clock.elapsedTime * 0.25) * 0.06;
    controls.update();
    renderer.render(scene, camera);
    raf = requestAnimationFrame(tick);
  })();

  return { dispose() { cancelAnimationFrame(raf); ro.disconnect(); renderer.dispose(); } };
}
