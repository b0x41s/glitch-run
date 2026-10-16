/*
 * An optional, decorative Three.js character layer for Alpine Valley.
 * Lives entirely outside World Debugger's hit testing, timers and score logic.
 * The GLB is the same Laurens model used by Glitch Run.
 */
(() => {
  'use strict';

  const stage = document.getElementById('worldStage');
  const play = document.getElementById('play');
  if (!stage || !play) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const state = {
    loading: false, ready: false, failed: false, frameId: 0, lastFrame: 0,
    renderer: null, scene: null, camera: null, mixer: null, model: null,
    actor: null, head: null, hand: null, rod: null, rodTip: null,
    line: null, bobber: null, ripple: null, THREE: null, elapsed: 0,
    layer: null
  };
  const BASE_WIDTH = 15;
  const BASE_HEIGHT = 10;
  const POSITION = { x: -2.4, y: -1.66 };
  const FLOAT = { x: -0.73, y: -1.18 };

  // Keep the artwork, scoring, target click areas and camera zoom unchanged.
  const visible = () => !document.hidden && !play.hidden &&
    stage.dataset.biome === 'alpine' && stage.classList.contains('rendered') &&
    document.documentElement.dataset.graphics === 'diorama';

  function stop() {
    if (state.frameId) cancelAnimationFrame(state.frameId);
    state.frameId = 0;
    state.lastFrame = 0;
    if (state.layer) state.layer.hidden = true;
  }

  function sync() {
    if (!visible()) {
      stop();
      return;
    }
    if (state.failed) return;
    if (!state.ready) {
      if (!state.loading) void initialize();
      return;
    }
    state.layer.hidden = false;
    resize();
    if (!state.frameId) {
      state.lastFrame = 0;
      state.frameId = requestAnimationFrame(tick);
    }
  }

  function placeSegment(mesh, start, end) {
    const delta = end.clone().sub(start);
    mesh.position.copy(start).add(end).multiplyScalar(0.5);
    mesh.quaternion.setFromUnitVectors(new state.THREE.Vector3(0, 1, 0), delta.clone().normalize());
    mesh.scale.set(1, delta.length(), 1);
  }

  function boneMatching(root, pattern) {
    let match = null;
    root.traverse(node => {
      if (!match && node.isBone && pattern.test(node.name)) match = node;
    });
    return match;
  }

  function resize() {
    if (!state.ready) return;
    const w = stage.clientWidth, h = stage.clientHeight;
    if (!w || !h) return;
    state.renderer.setSize(w, h, false);
  }

  function update(dt) {
    const THREE = state.THREE;
    state.elapsed += dt;
    if (state.mixer && !reducedMotion.matches) state.mixer.update(dt);

    const t = reducedMotion.matches ? 0 : state.elapsed;
    // Gentle breathing / looking around. No root-motion and no gameplay effects.
    state.actor.rotation.y = -0.24 + Math.sin(t * 0.38) * 0.075;
    if (state.head) state.head.rotation.y = state.head.userData.fishingBaseY +
      Math.sin(t * 0.53) * 0.13;

    const handle = new THREE.Vector3(POSITION.x + 0.23, POSITION.y + 0.75, 1.1);
    state.model.updateMatrixWorld(true);
    if (state.hand) {
      const handPosition = new THREE.Vector3();
      state.hand.getWorldPosition(handPosition);
      // Use the character's hand only if its rig coordinates are plausible.
      if (Math.abs(handPosition.x - POSITION.x) < 0.75 &&
          handPosition.y > POSITION.y + 0.2 &&
          handPosition.y < POSITION.y + 1.45) {
        handle.x = handPosition.x;
        handle.y = handPosition.y;
      }
    }

    const cast = Math.sin(t * 0.85) * 0.035;
    const tip = new THREE.Vector3(handle.x + 1.14, handle.y + 0.26 + cast, 1.18);
    const joint = new THREE.Vector3().lerpVectors(handle, tip, 0.72);
    joint.y += 0.07;
    placeSegment(state.rod[0], handle, joint);
    placeSegment(state.rod[1], joint, tip);
    const waterY = FLOAT.y + Math.sin(t * 2.0) * 0.028;
    const floatPosition = new THREE.Vector3(FLOAT.x, waterY, 1.25);
    const coords = state.line.geometry.attributes.position;
    coords.setXYZ(0, tip.x, tip.y, tip.z);
    coords.setXYZ(1, floatPosition.x, floatPosition.y, floatPosition.z);
    coords.needsUpdate = true;
    state.line.geometry.computeBoundingSphere();
    state.bobber.position.copy(floatPosition);
    state.ripple.position.set(FLOAT.x, FLOAT.y - 0.03, 1.2);
    state.ripple.scale.setScalar(1 + Math.sin(t * 2.2) * 0.12);
    state.ripple.material.opacity = 0.4 + Math.sin(t * 2.2) * 0.12;
  }

  function tick(now) {
    state.frameId = 0;
    if (!visible() || !state.ready) {
      stop();
      return;
    }
    if (state.lastFrame && now - state.lastFrame < 32 && !reducedMotion.matches) {
      state.frameId = requestAnimationFrame(tick);
      return;
    }
    const dt = state.lastFrame ? Math.min((now - state.lastFrame) / 1000, 0.06) : 0;
    state.lastFrame = now;
    update(dt);
    state.renderer.render(state.scene, state.camera);
    if (!reducedMotion.matches) state.frameId = requestAnimationFrame(tick);
  }

  async function initialize() {
    state.loading = true;
    try {
      // Pinned to the version already used by Glitch Run. Import-map paths are
      // also used by the direct GitHub Pages copy (not processed by Vite).
      const [THREE, loaderModule] = await Promise.all([
        import('three'),
        import('three/addons/loaders/GLTFLoader.js')
      ]);
      if (!visible()) { state.loading = false; return; }
      state.THREE = THREE;
      const layer = document.createElement('div');
      layer.className = 'laurens-fishing-layer';
      layer.setAttribute('aria-hidden', 'true');
      layer.dataset.decorative = 'true';
      stage.append(layer);
      state.layer = layer;

      const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
      renderer.setClearColor(0x000000, 0);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      layer.append(renderer.domElement);
      state.renderer = renderer;
      state.scene = new THREE.Scene();
      state.camera = new THREE.OrthographicCamera(
        -BASE_WIDTH / 2, BASE_WIDTH / 2, BASE_HEIGHT / 2, -BASE_HEIGHT / 2, 0.1, 60
      );
      state.camera.position.set(0, 0, 22);
      state.camera.lookAt(0, 0, 0);
      state.scene.add(new THREE.HemisphereLight(0xffffff, 0x76878b, 2.8));
      const light = new THREE.DirectionalLight(0xfff5d7, 3.3);
      light.position.set(-3, 8, 12);
      state.scene.add(light);

      const gltf = await new loaderModule.GLTFLoader().loadAsync('../models/laurens.glb');
      if (!visible()) layer.hidden = true;
      const actor = new THREE.Group();
      actor.position.set(POSITION.x, POSITION.y, 0);
      state.scene.add(actor);
      state.actor = actor;

      const model = gltf.scene;
      model.traverse(node => {
        if (node.isMesh || node.isSkinnedMesh) {
          node.frustumCulled = false;
        }
      });
      // Normalize the same way as Glitch Run, keeping Laurens small enough
      // to fit among the miniature cabin, stones and wooden bridge.
      const bounds = new THREE.Box3().setFromObject(model);
      const height = Math.max(0.001, bounds.max.y - bounds.min.y);
      model.scale.setScalar(1.58 / height);
      model.updateMatrixWorld(true);
      const scaled = new THREE.Box3().setFromObject(model);
      const center = scaled.getCenter(new THREE.Vector3());
      model.position.set(-center.x, -scaled.min.y, -center.z);
      actor.add(model);
      state.model = model;

      const idle = gltf.animations.find(clip => /idle|breath|stand/i.test(clip.name));
      if (idle) {
        state.mixer = new THREE.AnimationMixer(model);
        state.mixer.clipAction(idle).play();
      }
      state.head = boneMatching(model, /head$|head\b/i);
      if (state.head) state.head.userData.fishingBaseY = state.head.rotation.y;
      state.hand = boneMatching(model, /right.?hand$|hand.?r$|righthand/i);

      const wood = new THREE.MeshStandardMaterial({ color: 0x76502e, roughness: 0.85 });
      const tipMaterial = new THREE.MeshStandardMaterial({ color: 0x383f38, roughness: 0.7 });
      const makeRod = (radiusA, radiusB, material) =>
        new THREE.Mesh(new THREE.CylinderGeometry(radiusA, radiusB, 1, 7), material);
      state.rod = [makeRod(0.015, 0.026, wood), makeRod(0.004, 0.015, tipMaterial)];
      state.scene.add(...state.rod);
      const lineGeometry = new THREE.BufferGeometry();
      lineGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3));
      state.line = new THREE.Line(lineGeometry, new THREE.LineBasicMaterial({ color: 0xdcecf3, transparent: true, opacity: 0.85 }));
      state.scene.add(state.line);
      const floatGroup = new THREE.Group();
      const red = new THREE.Mesh(new THREE.SphereGeometry(0.052, 12, 9), new THREE.MeshStandardMaterial({ color: 0xff4c43 }));
      const white = new THREE.Mesh(new THREE.SphereGeometry(0.028, 10, 8), new THREE.MeshStandardMaterial({ color: 0xffffff }));
      white.position.y = 0.042;
      floatGroup.add(red, white);
      state.scene.add(floatGroup);
      state.bobber = floatGroup;
      state.ripple = new THREE.Mesh(
        new THREE.RingGeometry(0.09, 0.105, 24),
        new THREE.MeshBasicMaterial({ color: 0xc9f5ff, transparent: true, opacity: 0.4, side: THREE.DoubleSide, depthWrite: false })
      );
      state.scene.add(state.ripple);

      state.ready = true;
      state.loading = false;
      resize();
      sync();
    } catch (err) {
      state.failed = true;
      state.loading = false;
      stop();
      // Decorative only: missing WebGL, CDN or GLB must never break the game.
      console.warn('Optional Laurens fishing character unavailable:', err);
      if (state.renderer) state.renderer.dispose();
      if (state.layer) state.layer.remove();
      state.renderer = null;
      state.layer = null;
    }
  }

  const observer = new MutationObserver(sync);
  observer.observe(stage, { attributes: true, attributeFilter: ['data-biome', 'class'] });
  observer.observe(play, { attributes: true, attributeFilter: ['hidden'] });
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-graphics'] });
  document.addEventListener('visibilitychange', sync);
  reducedMotion.addEventListener?.('change', sync);
  if (typeof ResizeObserver !== 'undefined') new ResizeObserver(resize).observe(stage);
  sync();
})();
