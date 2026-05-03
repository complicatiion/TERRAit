import * as THREE from '../assets/vendor/three/build/three.module.js';
import { OrbitControls } from '../assets/vendor/three/examples/jsm/controls/OrbitControls.js';
import { OBJLoader } from '../assets/vendor/three/examples/jsm/loaders/OBJLoader.js';
import { STLLoader } from '../assets/vendor/three/examples/jsm/loaders/STLLoader.js';
import { FBXLoader } from '../assets/vendor/three/examples/jsm/loaders/FBXLoader.js';

const APP_VERSION = '1.1.8';
const DOCS_PATH = 'assets/Docu.md';

const $ = (id) => document.getElementById(id);

const DEFAULT_TERRAIN = Object.freeze({
  size: 500,
  segments: 96,
  radius: 18,
  strength: 2.5
});

const DEFAULT_VIEW = Object.freeze({
  brightness: 1.0,
  temperature: 65,
  fogPercent: 35,
  fogBaseDensity: 0.00145
});

const dom = {
  canvas: $('terrainCanvas'),
  viewport: $('viewportWrap'),
  toolGrid: $('toolGrid'),
  activeToolLabel: $('activeToolLabel'),
  radiusRange: $('radiusRange'),
  radiusValue: $('radiusValue'),
  strengthRange: $('strengthRange'),
  strengthValue: $('strengthValue'),
  plateauHeight: $('plateauHeight'),
  undoBtn: $('undoBtn'),
  redoBtn: $('redoBtn'),
  historyState: $('historyState'),
  historyCount: $('historyCount'),
  segmentsRange: $('segmentsRange'),
  segmentsValue: $('segmentsValue'),
  terrainSize: $('terrainSize'),
  baseSizeRange: $('baseSizeRange'),
  baseSizeValue: $('baseSizeValue'),
  brightnessRange: $('brightnessRange'),
  brightnessValue: $('brightnessValue'),
  temperatureRange: $('temperatureRange'),
  temperatureValue: $('temperatureValue'),
  fogRange: $('fogRange'),
  fogValue: $('fogValue'),
  vertexCount: $('vertexCount'),
  heightReadout: $('heightReadout'),
  distanceReadout: $('distanceReadout'),
  fpsCounter: $('fpsCounter'),
  statusBadge: $('statusBadge'),
  toast: $('appToast'),
  toastBody: $('toastBody'),
  dropHint: $('dropHint'),
  sceneHint: $('sceneHint'),
  fileInput: $('fileInput'),
  wireToggle: $('wireToggle'),
  gridToggle: $('gridToggle'),
  fogToggle: $('fogToggle'),
  heightMeterToggle: $('heightMeterToggle'),
  distanceToggle: $('distanceToggle'),
  brushCursorToggle: $('brushCursorToggle'),
  randomTerrainBtn: $('randomTerrainBtn'),
  applyGeometryBtn: $('applyGeometryBtn'),
  lessDetailBtn: $('lessDetailBtn'),
  moreDetailBtn: $('moreDetailBtn'),
  flattenBtn: $('flattenBtn'),
  saveProjectBtn: $('saveProjectBtn'),
  exportObjBtn: $('exportObjBtn'),
  exportStlBtn: $('exportStlBtn'),
  exportPngBtn: $('exportPngBtn'),
  resetCameraBtn: $('resetCameraBtn'),
  newProjectBtn: $('newProjectBtn'),
  controlsBtn: $('controlsBtn'),
  infoBtn: $('infoBtn'),
  docsModal: $('docsModal'),
  docsContent: $('docsContent'),
  controlsModal: $('controlsModal')
};

const state = {
  tool: 'raise',
  isPainting: false,
  radius: Number(dom.radiusRange.value),
  strength: Number(dom.strengthRange.value),
  segments: Number(dom.segmentsRange.value),
  size: Number(dom.terrainSize.value),
  pointer: new THREE.Vector2(),
  raycaster: new THREE.Raycaster(),
  clock: new THREE.Clock(),
  frameCounter: 0,
  fpsTime: 0,
  previewMesh: null,
  noiseSeed: Math.random() * 10000,
  hotkeyNavMode: null,
  history: {
    undo: [],
    redo: [],
    limit: 40,
    currentLabel: 'Initial terrain'
  },
  view: {
    brightness: DEFAULT_VIEW.brightness,
    temperature: DEFAULT_VIEW.temperature,
    fogPercent: DEFAULT_VIEW.fogPercent,
    fogEnabled: true,
    heightMeter: true,
    distanceReadout: true,
    brushCursor: true
  },
  navigation: {
    active: false,
    mode: null,
    pointerId: null,
    startX: 0,
    startY: 0,
    startCamera: new THREE.Vector3(),
    startTarget: new THREE.Vector3(),
    startSpherical: new THREE.Spherical()
  }
};

const toast = bootstrap.Toast.getOrCreateInstance(dom.toast, { delay: 2200 });
const docsModal = bootstrap.Modal.getOrCreateInstance(dom.docsModal);
const controlsModal = bootstrap.Modal.getOrCreateInstance(dom.controlsModal);

let scene;
let camera;
let renderer;
let controls;
let terrain;
let wireframe;
let grid;
let brushRing;
let sun;
let ambient;

init();
animate();

function init() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x071016);
  scene.fog = new THREE.FogExp2(0x071016, DEFAULT_VIEW.fogBaseDensity * (DEFAULT_VIEW.fogPercent / 100));

  camera = new THREE.PerspectiveCamera(55, 1, 0.1, 8000);

  renderer = new THREE.WebGLRenderer({ canvas: dom.canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = DEFAULT_VIEW.brightness;
  renderer.shadowMap.enabled = false;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  controls = new OrbitControls(camera, dom.canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.target.set(0, 0, 0);
  controls.maxPolarAngle = Math.PI * 0.49;
  controls.minDistance = 8;
  controls.maxDistance = 2500;
  controls.mouseButtons = {
    LEFT: null,
    MIDDLE: null,
    RIGHT: null
  };

  ambient = new THREE.AmbientLight(0xffffff, 0.78);
  scene.add(ambient);

  sun = new THREE.DirectionalLight(0xe8fbff, 1.08);
  sun.position.set(280, 420, 220);
  sun.castShadow = false;
  scene.add(sun);

  const rim = new THREE.DirectionalLight(0x25c8ff, 0.72);
  rim.position.set(-320, 160, -280);
  scene.add(rim);

  buildGrid(DEFAULT_TERRAIN.size);
  buildTerrain(DEFAULT_TERRAIN.segments, DEFAULT_TERRAIN.size);
  buildBrushRing();
  bindUI();
  updateHistoryUI();
  applyViewSettings();
  resizeRenderer();
  fitCameraToTerrain();
  setStatus('READY');
  showToast('Base terrain created. Ready to sculpt.');
}

function bindUI() {
  window.addEventListener('resize', resizeRenderer);
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);

  dom.canvas.addEventListener('pointermove', onPointerMove);
  dom.canvas.addEventListener('pointerdown', onPointerDown);
  window.addEventListener('pointerup', onPointerUp);
  dom.canvas.addEventListener('contextmenu', (event) => event.preventDefault());

  dom.toolGrid.addEventListener('click', (event) => {
    const button = event.target.closest('[data-tool]');
    if (!button) return;
    setTool(button.dataset.tool);
  });

  dom.undoBtn.addEventListener('click', undoHistory);
  dom.redoBtn.addEventListener('click', redoHistory);

  dom.randomTerrainBtn.addEventListener('click', () => {
    pushHistory('Random terrain');
    generateRandomTerrain();
    dom.randomTerrainBtn.blur();
  });

  dom.radiusRange.addEventListener('input', () => {
    state.radius = Number(dom.radiusRange.value);
    dom.radiusValue.textContent = state.radius.toFixed(1);
    updateBrushScale();
  });

  dom.strengthRange.addEventListener('input', () => {
    state.strength = Number(dom.strengthRange.value);
    dom.strengthValue.textContent = state.strength.toFixed(2);
  });

  dom.brightnessRange.addEventListener('input', () => {
    state.view.brightness = Number(dom.brightnessRange.value) / 100;
    dom.brightnessValue.textContent = `${dom.brightnessRange.value}%`;
    applyViewSettings();
  });

  dom.temperatureRange.addEventListener('input', () => {
    state.view.temperature = Number(dom.temperatureRange.value);
    dom.temperatureValue.textContent = `${dom.temperatureRange.value}%`;
    applyViewSettings();
  });

  dom.fogRange.addEventListener('input', () => {
    state.view.fogPercent = Number(dom.fogRange.value);
    dom.fogValue.textContent = `${dom.fogRange.value}%`;
    applyViewSettings();
  });

  dom.baseSizeRange.addEventListener('input', () => {
    const nextSize = clamp(Number(dom.baseSizeRange.value), 50, 2000);
    syncTerrainSizeInputs(nextSize);
  });

  dom.baseSizeRange.addEventListener('change', () => {
    applyTerrainSize(Number(dom.baseSizeRange.value));
  });

  dom.segmentsRange.addEventListener('input', () => {
    dom.segmentsValue.textContent = dom.segmentsRange.value;
  });

  dom.applyGeometryBtn.addEventListener('click', () => {
    const nextSegments = Number(dom.segmentsRange.value);
    const nextSize = clamp(Number(dom.terrainSize.value), 50, 2000);
    syncTerrainSizeInputs(nextSize);
    rebuildTerrain(nextSegments, nextSize, true);
    showToast(`Geometry applied: ${nextSegments} segments, ${nextSize} m.`);
  });

  dom.lessDetailBtn.addEventListener('click', () => { pushHistory('Less detail'); adjustTerrainDetail(-1); });
  dom.moreDetailBtn.addEventListener('click', () => { pushHistory('More detail'); adjustTerrainDetail(1); });

  dom.flattenBtn.addEventListener('click', () => {
    pushHistory('Flatten terrain');
    flattenTerrain();
    showToast('Terrain flattened.');
  });

  dom.newProjectBtn.addEventListener('click', () => { pushHistory('New project'); createNewProject(); });
  dom.controlsBtn.addEventListener('click', () => controlsModal.show());
  dom.infoBtn.addEventListener('click', openDocumentation);

  dom.resetCameraBtn.addEventListener('click', fitCameraToTerrain);

  dom.wireToggle.addEventListener('change', () => {
    wireframe.visible = dom.wireToggle.checked;
    if (wireframe.visible) refreshWireframe(true);
  });

  dom.gridToggle.addEventListener('change', () => {
    grid.visible = dom.gridToggle.checked;
  });

  dom.fogToggle.addEventListener('change', () => {
    state.view.fogEnabled = dom.fogToggle.checked;
    document.body.classList.toggle('fog-off', !state.view.fogEnabled);
    applyViewSettings();
  });

  dom.heightMeterToggle.addEventListener('change', () => {
    state.view.heightMeter = dom.heightMeterToggle.checked;
    document.body.classList.toggle('hide-height-meter', !state.view.heightMeter);
  });

  dom.distanceToggle.addEventListener('change', () => {
    state.view.distanceReadout = dom.distanceToggle.checked;
    document.body.classList.toggle('hide-distance-meter', !state.view.distanceReadout);
  });

  dom.brushCursorToggle.addEventListener('change', () => {
    state.view.brushCursor = dom.brushCursorToggle.checked;
    if (!state.view.brushCursor) brushRing.visible = false;
  });

  dom.fileInput.addEventListener('change', async () => {
    const file = dom.fileInput.files?.[0];
    if (file) await importFile(file);
    dom.fileInput.value = '';
  });

  dom.saveProjectBtn.addEventListener('click', saveProject);
  dom.exportObjBtn.addEventListener('click', exportOBJ);
  dom.exportStlBtn.addEventListener('click', exportSTL);
  dom.exportPngBtn.addEventListener('click', exportHeightmapPNG);

  ['dragenter', 'dragover'].forEach((eventName) => {
    dom.viewport.addEventListener(eventName, (event) => {
      event.preventDefault();
      dom.dropHint.classList.remove('d-none');
    });
  });

  ['dragleave', 'drop'].forEach((eventName) => {
    dom.viewport.addEventListener(eventName, (event) => {
      event.preventDefault();
      dom.dropHint.classList.add('d-none');
    });
  });

  dom.viewport.addEventListener('drop', async (event) => {
    const file = event.dataTransfer.files?.[0];
    if (file) await importFile(file);
  });
}



function createHistorySnapshot(label = 'Terrain state') {
  return {
    label,
    size: state.size,
    segments: state.segments,
    heights: getHeights(),
    camera: {
      position: camera.position.toArray(),
      target: controls.target.toArray()
    }
  };
}

function pushHistory(label) {
  if (!terrain?.geometry?.attributes?.position) return;
  state.history.undo.push(createHistorySnapshot(label));
  if (state.history.undo.length > state.history.limit) state.history.undo.shift();
  state.history.redo.length = 0;
  state.history.currentLabel = label;
  updateHistoryUI();
}

function restoreHistorySnapshot(snapshot) {
  if (!snapshot) return;
  dom.segmentsRange.value = String(snapshot.segments);
  dom.segmentsValue.textContent = String(snapshot.segments);
  syncTerrainSizeInputs(snapshot.size);
  rebuildTerrain(snapshot.segments, snapshot.size, false);
  setHeights(snapshot.heights);
  if (snapshot.camera) {
    camera.position.fromArray(snapshot.camera.position);
    controls.target.fromArray(snapshot.camera.target);
    camera.lookAt(controls.target);
    controls.update();
  } else {
    fitCameraToTerrain();
  }
  setStatus('READY');
  updateHistoryUI();
}

function undoHistory() {
  if (!state.history.undo.length) return;
  const previous = state.history.undo.pop();
  state.history.redo.push(createHistorySnapshot(state.history.currentLabel || 'Redo state'));
  state.history.currentLabel = previous.label || 'Undo';
  restoreHistorySnapshot(previous);
  showToast(`Undo: ${previous.label || 'terrain change'}`);
}

function redoHistory() {
  if (!state.history.redo.length) return;
  const next = state.history.redo.pop();
  state.history.undo.push(createHistorySnapshot(state.history.currentLabel || 'Undo state'));
  state.history.currentLabel = next.label || 'Redo';
  restoreHistorySnapshot(next);
  showToast(`Redo: ${next.label || 'terrain change'}`);
}

function updateHistoryUI() {
  if (!dom.undoBtn || !dom.redoBtn) return;
  dom.undoBtn.disabled = state.history.undo.length === 0;
  dom.redoBtn.disabled = state.history.redo.length === 0;
  dom.historyCount.textContent = `${state.history.undo.length} / ${state.history.redo.length}`;
  dom.historyState.textContent = (state.history.undo.length || state.history.redo.length)
    ? state.history.currentLabel
    : 'No terrain changes yet';
}

function handleHistoryShortcut(event) {
  if (isTypingTarget(event.target)) return false;
  const ctrlOrMeta = event.ctrlKey || event.metaKey;
  if (!ctrlOrMeta) return false;
  const key = event.key.toLowerCase();
  if (key === 'z' && event.shiftKey) {
    event.preventDefault();
    redoHistory();
    return true;
  }
  if (key === 'z') {
    event.preventDefault();
    undoHistory();
    return true;
  }
  if (key === 'y') {
    event.preventDefault();
    redoHistory();
    return true;
  }
  return false;
}

function lightTemperatureColor() {
  const t = clamp(state.view.temperature / 100, 0, 1);
  const cool = new THREE.Color(0x8fdfff);
  const neutral = new THREE.Color(0xffffff);
  const warm = new THREE.Color(0xffefd6);
  return t < 0.72 ? cool.lerp(neutral, t / 0.72) : neutral.lerp(warm, (t - 0.72) / 0.28);
}


function applyViewSettings() {
  const brightness = clamp(state.view.brightness, 0.6, 1.5);
  const fogDensity = DEFAULT_VIEW.fogBaseDensity * (state.view.fogPercent / 100);

  renderer.toneMappingExposure = brightness;
  const tempColor = lightTemperatureColor();
  ambient.intensity = 0.68 + brightness * 0.34;
  ambient.color.copy(tempColor);
  sun.intensity = 0.86 + brightness * 0.28;
  sun.color.copy(tempColor);

  if (terrain?.material) {
    terrain.material.emissiveIntensity = 0.46 + brightness * 0.28;
    terrain.material.needsUpdate = true;
  }

  scene.fog = state.view.fogEnabled && state.view.fogPercent > 0
    ? new THREE.FogExp2(0x071016, fogDensity)
    : null;
}

function updateCursorReadouts(point) {
  if (!point) {
    dom.heightReadout.textContent = '--';
    dom.distanceReadout.textContent = '--';
    return;
  }

  dom.heightReadout.textContent = `${clean(point.y)} m`;
  const horizontalDistance = Math.sqrt(point.x * point.x + point.z * point.z);
  const cameraDistance = camera.position.distanceTo(point);
  dom.distanceReadout.textContent = `${clean(horizontalDistance)} m / Cam ${clean(cameraDistance)} m`;
}

function syncTerrainSizeInputs(size) {
  const nextSize = clamp(Number(size) || DEFAULT_TERRAIN.size, 50, 2000);
  dom.terrainSize.value = String(Math.round(nextSize));
  dom.baseSizeRange.value = String(Math.round(nextSize / 10) * 10);
  dom.baseSizeValue.textContent = `${Math.round(nextSize)} m`;
}

function applyTerrainSize(size) {
  const nextSize = clamp(Number(size) || state.size, 50, 2000);
  if (Math.abs(nextSize - state.size) < 0.001) return;
  pushHistory('Resize base plane');
  syncTerrainSizeInputs(nextSize);
  rebuildTerrain(state.segments, nextSize, true);
  fitCameraToTerrain();
  showToast(`Base plane resized to ${Math.round(nextSize)} × ${Math.round(nextSize)} m.`);
}

function adjustTerrainDetail(direction) {
  const step = 16;
  const nextSegments = clampToSliderStep(state.segments + direction * step);
  if (nextSegments === state.segments) return;
  dom.segmentsRange.value = String(nextSegments);
  dom.segmentsValue.textContent = String(nextSegments);
  rebuildTerrain(nextSegments, state.size, true);
  showToast(direction > 0 ? `Detail increased to ${nextSegments} segments.` : `Detail reduced to ${nextSegments} segments.`);
}

function createNewProject() {
  removePreviewMesh();
  setTool('raise');
  dom.segmentsRange.value = String(DEFAULT_TERRAIN.segments);
  dom.segmentsValue.textContent = String(DEFAULT_TERRAIN.segments);
  syncTerrainSizeInputs(DEFAULT_TERRAIN.size);
  dom.radiusRange.value = String(DEFAULT_TERRAIN.radius);
  dom.radiusValue.textContent = DEFAULT_TERRAIN.radius.toFixed(1);
  dom.strengthRange.value = String(DEFAULT_TERRAIN.strength);
  dom.strengthValue.textContent = DEFAULT_TERRAIN.strength.toFixed(2);
  state.radius = DEFAULT_TERRAIN.radius;
  state.strength = DEFAULT_TERRAIN.strength;
  updateBrushScale();
  rebuildTerrain(DEFAULT_TERRAIN.segments, DEFAULT_TERRAIN.size, false);
  fitCameraToTerrain();
  showToast('New 500 × 500 m base terrain created.');
}

function buildGrid(size) {
  if (grid) {
    grid.geometry.dispose();
    grid.material.dispose();
    scene.remove(grid);
  }
  const gridSize = Math.max(size * 1.1, 100);
  const divisions = Math.min(Math.max(Math.round(size / 10), 20), 120);
  grid = new THREE.GridHelper(gridSize, divisions, 0x25c8ff, 0x16313d);
  grid.position.y = -0.03;
  grid.visible = dom.gridToggle.checked;
  scene.add(grid);
}

function buildTerrain(segments, size, heights = null) {
  const geometry = new THREE.PlaneGeometry(size, size, segments, segments);
  geometry.rotateX(-Math.PI / 2);

  const pos = geometry.attributes.position;
  for (let i = 0; i < pos.count; i += 1) {
    const y = heights ? heights[i] ?? 0 : 0;
    pos.setY(i, y);
  }

  geometry.computeVertexNormals();

  const material = new THREE.MeshStandardMaterial({
    color: 0x24404c,
    roughness: 0.78,
    metalness: 0.06,
    emissive: 0x082631,
    emissiveIntensity: 0.68,
    flatShading: false
  });

  terrain = new THREE.Mesh(geometry, material);
  terrain.name = 'EditableTerrain';
  terrain.receiveShadow = false;
  terrain.castShadow = false;
  scene.add(terrain);

  wireframe = new THREE.LineSegments(
    new THREE.WireframeGeometry(geometry),
    new THREE.LineBasicMaterial({ color: 0x25c8ff, transparent: true, opacity: 0.2 })
  );
  wireframe.name = 'TerrainWireframe';
  wireframe.visible = dom.wireToggle.checked;
  scene.add(wireframe);

  state.segments = segments;
  state.size = size;
  syncTerrainSizeInputs(size);
  controls.maxDistance = Math.max(size * 4, 1000);
  updateStats();
  updateSceneHint();
  applyViewSettings();
}

function rebuildTerrain(nextSegments, nextSize, preserveHeights) {
  const oldSegments = state.segments;
  const oldSize = state.size;
  const oldHeights = terrain ? getHeights() : null;
  const nextCount = (nextSegments + 1) * (nextSegments + 1);
  const nextHeights = new Float32Array(nextCount);

  if (preserveHeights && oldHeights) {
    for (let z = 0; z <= nextSegments; z += 1) {
      for (let x = 0; x <= nextSegments; x += 1) {
        const u = x / nextSegments;
        const v = z / nextSegments;
        nextHeights[z * (nextSegments + 1) + x] = sampleHeight(oldHeights, oldSegments, u, v);
      }
    }
  }

  disposeTerrain();
  buildGrid(nextSize || oldSize);
  buildTerrain(nextSegments, nextSize || oldSize, nextHeights);
  setStatus('READY');
}

function disposeTerrain() {
  if (terrain) {
    terrain.geometry.dispose();
    terrain.material.dispose();
    scene.remove(terrain);
    terrain = null;
  }
  if (wireframe) {
    wireframe.geometry.dispose();
    wireframe.material.dispose();
    scene.remove(wireframe);
    wireframe = null;
  }
}

function buildBrushRing() {
  const points = [];
  const steps = 128;
  for (let i = 0; i <= steps; i += 1) {
    const a = (i / steps) * Math.PI * 2;
    points.push(new THREE.Vector3(Math.cos(a), 0.04, Math.sin(a)));
  }
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const material = new THREE.LineBasicMaterial({ color: 0x25c8ff, transparent: true, opacity: 0.98 });
  brushRing = new THREE.Line(geometry, material);
  brushRing.visible = false;
  scene.add(brushRing);
  updateBrushScale();
}

function updateBrushScale() {
  if (brushRing) brushRing.scale.setScalar(state.radius);
}

function setTool(tool) {
  state.tool = tool;
  for (const button of dom.toolGrid.querySelectorAll('[data-tool]')) {
    button.classList.toggle('active', button.dataset.tool === tool);
  }
  dom.activeToolLabel.textContent = tool.charAt(0).toUpperCase() + tool.slice(1);
  setStatus(tool.toUpperCase());
}

function onPointerDown(event) {
  const navMode = getNavigationMode(event);
  if (navMode) {
    beginNavigation(event, navMode);
    return;
  }

  if (event.button !== 0) return;
  pushHistory(`Sculpt: ${state.tool}`);
  state.isPainting = true;
  controls.enabled = false;
  dom.canvas.setPointerCapture(event.pointerId);
  updatePointer(event);
  applyBrushFromPointer(event);
}

function onPointerUp(event) {
  if (state.navigation.active) {
    endNavigation(event);
    return;
  }

  if (!state.isPainting) return;
  state.isPainting = false;
  controls.enabled = true;
  try {
    dom.canvas.releasePointerCapture(event.pointerId);
  } catch {
    // Pointer may already be released by the browser.
  }
}

function onPointerMove(event) {
  if (state.navigation.active) {
    updateNavigation(event);
    return;
  }

  updatePointer(event);
  const hit = getTerrainHit();
  if (hit) {
    if (state.view.brushCursor) {
      brushRing.visible = true;
      brushRing.position.set(hit.point.x, hit.point.y + 0.05, hit.point.z);
    }
    updateCursorReadouts(hit.point);
  } else {
    brushRing.visible = false;
    updateCursorReadouts(null);
  }
  if (state.isPainting) applyBrushFromPointer(event);
}


function onKeyDown(event) {
  if (handleHistoryShortcut(event)) return;
  if (isTypingTarget(event.target)) return;
  if (event.key === '1') state.hotkeyNavMode = 'pan';
  if (event.key === '2') state.hotkeyNavMode = 'dolly';
  if (event.key === '3') state.hotkeyNavMode = 'orbit';
}

function onKeyUp(event) {
  if (['1', '2', '3'].includes(event.key)) state.hotkeyNavMode = null;
}

function isTypingTarget(target) {
  const tag = target?.tagName?.toLowerCase();
  return tag === 'input' || tag === 'textarea' || target?.isContentEditable;
}

function getNavigationMode(event) {
  if (event.ctrlKey && event.button === 0) return 'pan';
  if (state.hotkeyNavMode && event.button === 0) return state.hotkeyNavMode;
  if (!event.altKey) return null;
  if (event.button === 0) return 'orbit';
  if (event.button === 1) return 'pan';
  if (event.button === 2) return 'dolly';
  return null;
}

function beginNavigation(event, mode) {
  event.preventDefault();
  state.navigation.active = true;
  state.navigation.mode = mode;
  state.navigation.pointerId = event.pointerId;
  state.navigation.startX = event.clientX;
  state.navigation.startY = event.clientY;
  state.navigation.startCamera.copy(camera.position);
  state.navigation.startTarget.copy(controls.target);
  state.navigation.startSpherical.setFromVector3(camera.position.clone().sub(controls.target));
  state.isPainting = false;
  controls.enabled = false;
  brushRing.visible = false;
  dom.canvas.setPointerCapture(event.pointerId);
}

function updateNavigation(event) {
  event.preventDefault();
  const nav = state.navigation;
  const dx = event.clientX - nav.startX;
  const dy = event.clientY - nav.startY;

  if (nav.mode === 'orbit') {
    const spherical = nav.startSpherical.clone();
    spherical.theta -= dx * 0.006;
    spherical.phi = clamp(spherical.phi - dy * 0.006, 0.08, controls.maxPolarAngle || Math.PI - 0.08);
    camera.position.copy(nav.startTarget).add(new THREE.Vector3().setFromSpherical(spherical));
    controls.target.copy(nav.startTarget);
  } else if (nav.mode === 'pan') {
    const rect = dom.canvas.getBoundingClientRect();
    const offset = nav.startCamera.clone().sub(nav.startTarget);
    const distance = offset.length();
    const targetDistance = distance * Math.tan(THREE.MathUtils.degToRad(camera.fov * 0.5));
    const panX = -dx * 2 * targetDistance * camera.aspect / Math.max(rect.height, 1);
    const panY = dy * 2 * targetDistance / Math.max(rect.height, 1);
    const right = new THREE.Vector3().setFromMatrixColumn(camera.matrix, 0).multiplyScalar(panX);
    const up = new THREE.Vector3().setFromMatrixColumn(camera.matrix, 1).multiplyScalar(panY);
    const pan = right.add(up);
    camera.position.copy(nav.startCamera).add(pan);
    controls.target.copy(nav.startTarget).add(pan);
  } else if (nav.mode === 'dolly') {
    const direction = nav.startCamera.clone().sub(nav.startTarget);
    const startDistance = direction.length();
    const nextDistance = clamp(startDistance * Math.exp(dy * 0.006), controls.minDistance, controls.maxDistance);
    direction.setLength(nextDistance);
    camera.position.copy(nav.startTarget).add(direction);
    controls.target.copy(nav.startTarget);
  }

  camera.lookAt(controls.target);
  controls.update();
}

function endNavigation(event) {
  state.navigation.active = false;
  state.navigation.mode = null;
  state.navigation.pointerId = null;
  controls.enabled = true;
  try {
    dom.canvas.releasePointerCapture(event.pointerId);
  } catch {
    // Pointer capture may already be released.
  }
}

function updatePointer(event) {
  const rect = dom.canvas.getBoundingClientRect();
  state.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  state.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
}

function getTerrainHit() {
  if (!terrain) return null;
  state.raycaster.setFromCamera(state.pointer, camera);
  const hits = state.raycaster.intersectObject(terrain, false);
  return hits[0] ?? null;
}

function applyBrushFromPointer(event = null) {
  const hit = getTerrainHit();
  if (!hit) return;
  applyBrush(hit.point, Boolean(event?.shiftKey));
}

function applyBrush(center, invert = false) {
  const geometry = terrain.geometry;
  const pos = geometry.attributes.position;
  const segments = state.segments;
  const radius = state.radius;
  const strength = state.strength;
  const neighborTools = new Set(['smooth', 'erosion', 'sharpen', 'flatten']);
  const heightsBefore = neighborTools.has(state.tool) ? getHeights() : null;
  const plateauHeight = Number(dom.plateauHeight.value) || 0;
  let touched = false;

  for (let z = 0; z <= segments; z += 1) {
    for (let x = 0; x <= segments; x += 1) {
      const index = z * (segments + 1) + x;
      const vx = pos.getX(index);
      const vz = pos.getZ(index);
      const dx = vx - center.x;
      const dz = vz - center.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist > radius) continue;

      const t = 1 - dist / radius;
      const falloff = t * t * (3 - 2 * t);
      let y = pos.getY(index);
      const sign = invert ? -1 : 1;

      switch (state.tool) {
        case 'raise':
          y += sign * strength * falloff;
          break;
        case 'lower':
          y -= sign * strength * falloff;
          break;
        case 'smooth': {
          const avg = averageNeighborHeight(heightsBefore, segments, x, z);
          y = lerp(y, avg, clamp(falloff * strength * 0.12, 0, 1));
          break;
        }
        case 'plateau':
          y = lerp(y, plateauHeight, clamp(falloff * strength * 0.08, 0, 1));
          break;
        case 'noise':
          y += (Math.random() * 2 - 1) * strength * falloff * 0.75;
          break;
        case 'erosion': {
          const avg = averageNeighborHeight(heightsBefore, segments, x, z);
          const slope = y - avg;
          y = lerp(y, avg, clamp(falloff * strength * 0.045, 0, 0.58));
          y -= Math.max(slope, 0) * falloff * strength * 0.035;
          break;
        }
        case 'relief': {
          const broad = valueNoise2D(vx * 0.045, vz * 0.045, state.noiseSeed);
          const fine = valueNoise2D(vx * 0.145, vz * 0.145, state.noiseSeed + 41.7);
          y += ((broad - 0.5) * 1.15 + (fine - 0.5) * 0.55) * strength * falloff;
          break;
        }
        case 'sharpen': {
          const avg = averageNeighborHeight(heightsBefore, segments, x, z);
          y += (y - avg) * clamp(falloff * strength * 0.06, 0, 0.72);
          break;
        }
        case 'flatten': {
          y = lerp(y, center.y, clamp(falloff * strength * 0.10, 0, 1));
          break;
        }
        case 'peak':
          y += strength * falloff * falloff * 1.25;
          break;
        case 'river': {
          const groove = Math.exp(-Math.pow(dist / Math.max(radius * 0.32, 0.001), 2));
          const bank = Math.exp(-Math.pow((dist - radius * 0.55) / Math.max(radius * 0.15, 0.001), 2));
          y += bank * strength * 0.12;
          y -= groove * strength * 1.05;
          break;
        }
        case 'valley':
          y -= strength * falloff * (0.55 + t * 0.65);
          break;
        default:
          break;
      }

      pos.setY(index, clamp(y, -250, 250));
      touched = true;
    }
  }

  if (touched) {
    pos.needsUpdate = true;
    geometry.computeVertexNormals();
    refreshWireframe();
  }
}

function refreshWireframe(force = false) {
  if (!wireframe || (!wireframe.visible && !force)) return;
  wireframe.geometry.dispose();
  wireframe.geometry = new THREE.WireframeGeometry(terrain.geometry);
}

function getHeights() {
  const pos = terrain.geometry.attributes.position;
  const heights = new Float32Array(pos.count);
  for (let i = 0; i < pos.count; i += 1) heights[i] = pos.getY(i);
  return heights;
}

function setHeights(heights) {
  const pos = terrain.geometry.attributes.position;
  for (let i = 0; i < pos.count; i += 1) pos.setY(i, heights[i] ?? 0);
  pos.needsUpdate = true;
  terrain.geometry.computeVertexNormals();
  refreshWireframe(true);
}

function flattenTerrain() {
  const pos = terrain.geometry.attributes.position;
  for (let i = 0; i < pos.count; i += 1) pos.setY(i, 0);
  pos.needsUpdate = true;
  terrain.geometry.computeVertexNormals();
  refreshWireframe(true);
}

function averageNeighborHeight(heights, segments, x, z) {
  let sum = 0;
  let count = 0;
  for (let dz = -1; dz <= 1; dz += 1) {
    for (let dx = -1; dx <= 1; dx += 1) {
      const nx = x + dx;
      const nz = z + dz;
      if (nx < 0 || nz < 0 || nx > segments || nz > segments) continue;
      sum += heights[nz * (segments + 1) + nx];
      count += 1;
    }
  }
  return count ? sum / count : 0;
}

function sampleHeight(heights, segments, u, v) {
  const fx = u * segments;
  const fz = v * segments;
  const x0 = Math.floor(fx);
  const z0 = Math.floor(fz);
  const x1 = Math.min(x0 + 1, segments);
  const z1 = Math.min(z0 + 1, segments);
  const tx = fx - x0;
  const tz = fz - z0;
  const stride = segments + 1;

  const h00 = heights[z0 * stride + x0];
  const h10 = heights[z0 * stride + x1];
  const h01 = heights[z1 * stride + x0];
  const h11 = heights[z1 * stride + x1];

  return lerp(lerp(h00, h10, tx), lerp(h01, h11, tx), tz);
}


function generateRandomTerrain() {
  const pos = terrain.geometry.attributes.position;
  const maxHeight = Math.max(state.size * 0.055, 16);
  const seed = Math.random() * 10000;
  state.noiseSeed = seed;

  for (let i = 0; i < pos.count; i += 1) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    const u = (x / state.size) + 0.5;
    const v = (z / state.size) + 0.5;
    const edgeFade = smoothstep(0, 0.16, u) * smoothstep(0, 0.16, v) * smoothstep(0, 0.16, 1 - u) * smoothstep(0, 0.16, 1 - v);
    const low = valueNoise2D(u * 3.0, v * 3.0, seed) * 2 - 1;
    const mid = valueNoise2D(u * 7.0, v * 7.0, seed + 17.0) * 2 - 1;
    const high = valueNoise2D(u * 18.0, v * 18.0, seed + 73.0) * 2 - 1;
    const ridge = 1 - Math.abs(valueNoise2D(u * 5.2, v * 5.2, seed + 113.0) * 2 - 1);
    const height = ((low * 0.62) + (mid * 0.28) + (high * 0.10) + (ridge * 0.32)) * maxHeight * edgeFade;
    pos.setY(i, clamp(height, -250, 250));
  }

  pos.needsUpdate = true;
  terrain.geometry.computeVertexNormals();
  refreshWireframe(true);
  showToast('Random terrain generated.');
}

async function openDocumentation() {
  dom.docsContent.innerHTML = '<p>Loading documentation...</p>';
  docsModal.show();

  try {
    const response = await fetch(`${DOCS_PATH}?v=${Date.now()}`, { cache: 'no-store' });
    if (!response.ok) throw new Error(`Could not load ${DOCS_PATH}`);
    const markdown = await response.text();
    dom.docsContent.innerHTML = renderMarkdown(markdown);
  } catch (error) {
    dom.docsContent.innerHTML = renderMarkdown(`# Documentation not available\n\nThe file \`${DOCS_PATH}\` could not be loaded. Start the project through the included local webserver and make sure the documentation file exists.`);
  }
}

function renderMarkdown(markdown) {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  let html = '';
  let inList = false;
  let inCode = false;
  let codeBuffer = [];

  const closeList = () => {
    if (inList) {
      html += '</ul>';
      inList = false;
    }
  };

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();

    if (line.trim().startsWith('```')) {
      if (inCode) {
        html += `<pre><code>${escapeHtml(codeBuffer.join('\n'))}</code></pre>`;
        codeBuffer = [];
        inCode = false;
      } else {
        closeList();
        inCode = true;
      }
      continue;
    }

    if (inCode) {
      codeBuffer.push(rawLine);
      continue;
    }

    if (!line.trim()) {
      closeList();
      continue;
    }

    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      closeList();
      const level = heading[1].length;
      html += `<h${level}>${formatInline(heading[2])}</h${level}>`;
      continue;
    }

    if (/^[-*]\s+/.test(line.trim())) {
      if (!inList) {
        html += '<ul>';
        inList = true;
      }
      html += `<li>${formatInline(line.trim().replace(/^[-*]\s+/, ''))}</li>`;
      continue;
    }

    if (line.trim().startsWith('>')) {
      closeList();
      html += `<blockquote>${formatInline(line.trim().replace(/^>\s?/, ''))}</blockquote>`;
      continue;
    }

    closeList();
    html += `<p>${formatInline(line)}</p>`;
  }

  closeList();
  if (inCode) html += `<pre><code>${escapeHtml(codeBuffer.join('\n'))}</code></pre>`;
  return html;
}

function formatInline(text) {
  return escapeHtml(text)
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function saveProject() {
  const project = {
    app: 'TERRAit Web',
    version: APP_VERSION,
    savedAt: new Date().toISOString(),
    terrain: {
      size: state.size,
      segments: state.segments,
      heights: Array.from(getHeights(), (value) => Number(value.toFixed(5)))
    }
  };
  downloadBlob(JSON.stringify(project, null, 2), 'terrait_project.terrait', 'application/json');
  showToast('Project exported.');
}

async function importFile(file) {
  const extension = file.name.split('.').pop().toLowerCase();
  try {
    setStatus('IMPORT');
    if (extension === 'terrait') {
      await loadProject(file);
    } else if (extension === 'obj') {
      await loadOBJ(file);
    } else if (extension === 'stl') {
      await loadSTL(file);
    } else if (extension === 'fbx') {
      await loadFBX(file);
    } else {
      throw new Error(`Unsupported file type: ${extension}`);
    }
    setStatus('READY');
  } catch (error) {
    console.error(error);
    setStatus('ERROR');
    showToast(error.message || 'Import failed.');
  }
}

async function loadProject(file) {
  const data = JSON.parse(await file.text());
  const terrainData = data.terrain;
  if (!terrainData || !terrainData.segments || !terrainData.size || !Array.isArray(terrainData.heights)) {
    throw new Error('Invalid .terrait project file.');
  }
  const expected = (terrainData.segments + 1) * (terrainData.segments + 1);
  if (terrainData.heights.length !== expected) {
    throw new Error('Project height array does not match segment count.');
  }
  pushHistory('Load .terrait project');
  dom.segmentsRange.value = String(terrainData.segments);
  dom.segmentsValue.textContent = String(terrainData.segments);
  syncTerrainSizeInputs(terrainData.size);
  rebuildTerrain(terrainData.segments, terrainData.size, false);
  setHeights(Float32Array.from(terrainData.heights));
  removePreviewMesh();
  fitCameraToTerrain();
  showToast(`Loaded ${file.name}.`);
}

async function loadOBJ(file) {
  const text = await file.text();
  const editable = parseObjAsEditableGrid(text);

  if (editable) {
    pushHistory('Import editable OBJ');
    const targetSegments = clampToSliderStep(Math.max(Number(dom.segmentsRange.value) || DEFAULT_TERRAIN.segments, editable.segments));
    const heights = resampleHeightGrid(editable.heights, editable.segments, targetSegments);

    dom.segmentsRange.value = String(targetSegments);
    dom.segmentsValue.textContent = String(targetSegments);
    syncTerrainSizeInputs(editable.size);
    removePreviewMesh();
    disposeTerrain();
    buildGrid(editable.size);
    buildTerrain(targetSegments, editable.size, heights);
    fitCameraToTerrain();
    showToast(`Editable OBJ terrain loaded: ${file.name}`);
    return;
  }

  const loader = new OBJLoader();
  const object = loader.parse(text);
  setPreviewObject(object, file.name);
}

function parseObjAsEditableGrid(text) {
  const vertices = [];
  const faceLines = [];

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    if (line.startsWith('v ')) {
      const parts = line.split(/\s+/);
      if (parts.length < 4) continue;
      const x = Number(parts[1]);
      const y = Number(parts[2]);
      const z = Number(parts[3]);
      if ([x, y, z].every(Number.isFinite)) vertices.push({ x, y, z });
    } else if (line.startsWith('f ')) {
      faceLines.push(line);
    }
  }

  if (vertices.length < 9 || faceLines.length < 1) return null;

  const tolerance = computeTolerance(vertices);
  const xs = uniqueSorted(vertices.map((v) => v.x), tolerance);
  const zs = uniqueSorted(vertices.map((v) => v.z), tolerance);
  const xCount = xs.length;
  const zCount = zs.length;

  if (xCount < 3 || zCount < 3) return null;
  if (xCount !== zCount) return null;
  if (xCount * zCount > vertices.length * 1.05) return null;

  const segments = xCount - 1;
  const rawSize = Math.max(xs.at(-1) - xs[0], zs.at(-1) - zs[0]);
  if (!Number.isFinite(rawSize) || rawSize <= 0) return null;

  const unitScale = rawSize > 5000 ? 0.01 : 1;
  const size = Number((rawSize * unitScale).toFixed(3));
  const stride = segments + 1;
  const heights = new Float32Array(stride * stride);
  const filled = new Uint8Array(stride * stride);

  for (const vertex of vertices) {
    const xIndex = nearestIndex(xs, vertex.x);
    const zIndex = nearestIndex(zs, vertex.z);
    if (xIndex < 0 || zIndex < 0) continue;
    const index = zIndex * stride + xIndex;
    heights[index] = vertex.y * unitScale;
    filled[index] = 1;
  }

  const filledCount = filled.reduce((sum, value) => sum + value, 0);
  if (filledCount < stride * stride * 0.92) return null;

  return { segments, size, heights };
}

function computeTolerance(vertices) {
  const box = new THREE.Box3();
  for (const vertex of vertices) box.expandByPoint(new THREE.Vector3(vertex.x, vertex.y, vertex.z));
  const size = new THREE.Vector3();
  box.getSize(size);
  return Math.max(size.x, size.y, size.z, 1) * 1e-5;
}

function uniqueSorted(values, tolerance) {
  const sorted = values.filter(Number.isFinite).sort((a, b) => a - b);
  const result = [];
  for (const value of sorted) {
    if (!result.length || Math.abs(value - result.at(-1)) > tolerance) result.push(value);
  }
  return result;
}

function nearestIndex(sortedValues, value) {
  let best = -1;
  let bestDistance = Infinity;
  for (let i = 0; i < sortedValues.length; i += 1) {
    const distance = Math.abs(sortedValues[i] - value);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = i;
    }
  }
  return best;
}

function resampleHeightGrid(sourceHeights, sourceSegments, targetSegments) {
  if (sourceSegments === targetSegments) return Float32Array.from(sourceHeights);
  const target = new Float32Array((targetSegments + 1) * (targetSegments + 1));
  for (let z = 0; z <= targetSegments; z += 1) {
    for (let x = 0; x <= targetSegments; x += 1) {
      const u = x / targetSegments;
      const v = z / targetSegments;
      target[z * (targetSegments + 1) + x] = sampleHeight(sourceHeights, sourceSegments, u, v);
    }
  }
  return target;
}

function clampToSliderStep(value) {
  const min = Number(dom.segmentsRange.min) || 16;
  const max = Number(dom.segmentsRange.max) || 256;
  const step = Number(dom.segmentsRange.step) || 8;
  return clamp(Math.round(clamp(value, min, max) / step) * step, min, max);
}

async function loadSTL(file) {
  const buffer = await file.arrayBuffer();
  const loader = new STLLoader();
  const geometry = loader.parse(buffer);
  geometry.computeVertexNormals();
  const mesh = new THREE.Mesh(geometry, previewMaterial());
  setPreviewObject(mesh, file.name);
}

async function loadFBX(file) {
  const buffer = await file.arrayBuffer();
  const loader = new FBXLoader();
  const object = loader.parse(buffer, '');
  setPreviewObject(object, file.name);
}

function setPreviewObject(object, name) {
  removePreviewMesh();
  object.name = `Preview:${name}`;
  object.traverse((child) => {
    if (child.isMesh) {
      child.material = previewMaterial();
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  const box = new THREE.Box3().setFromObject(object);
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();
  box.getSize(size);
  box.getCenter(center);
  const maxSide = Math.max(size.x, size.y, size.z) || 1;
  const unitScale = maxSide > 5000 ? 0.01 : 1;
  object.scale.multiplyScalar((state.size / (maxSide * unitScale)) * 0.72 * unitScale);
  object.position.sub(center.multiplyScalar(object.scale.x));
  object.position.y += 0.16;

  state.previewMesh = object;
  scene.add(object);
  showToast(`Preview loaded: ${name}`);
}

function previewMaterial() {
  return new THREE.MeshStandardMaterial({
    color: 0x25c8ff,
    transparent: true,
    opacity: 0.36,
    roughness: 0.65,
    metalness: 0.1,
    wireframe: false
  });
}

function removePreviewMesh() {
  if (!state.previewMesh) return;
  state.previewMesh.traverse((child) => {
    if (child.geometry) child.geometry.dispose();
    if (child.material) child.material.dispose?.();
  });
  scene.remove(state.previewMesh);
  state.previewMesh = null;
}

function exportOBJ() {
  const pos = terrain.geometry.attributes.position;
  const index = terrain.geometry.index;
  const lines = ['# TERRAit Web OBJ Export', '# Units: meters'];
  for (let i = 0; i < pos.count; i += 1) {
    lines.push(`v ${clean(pos.getX(i))} ${clean(pos.getY(i))} ${clean(pos.getZ(i))}`);
  }
  if (index) {
    for (let i = 0; i < index.count; i += 3) {
      lines.push(`f ${index.getX(i) + 1} ${index.getX(i + 1) + 1} ${index.getX(i + 2) + 1}`);
    }
  }
  downloadBlob(lines.join('\n'), 'terrait_terrain.obj', 'text/plain');
  showToast('OBJ exported.');
}

function exportSTL() {
  const pos = terrain.geometry.attributes.position;
  const index = terrain.geometry.index;
  const lines = ['solid terrain'];
  if (index) {
    for (let i = 0; i < index.count; i += 3) {
      const a = getVertex(pos, index.getX(i));
      const b = getVertex(pos, index.getX(i + 1));
      const c = getVertex(pos, index.getX(i + 2));
      const normal = new THREE.Vector3().subVectors(b, a).cross(new THREE.Vector3().subVectors(c, a)).normalize();
      lines.push(`  facet normal ${clean(normal.x)} ${clean(normal.y)} ${clean(normal.z)}`);
      lines.push('    outer loop');
      lines.push(`      vertex ${clean(a.x)} ${clean(a.y)} ${clean(a.z)}`);
      lines.push(`      vertex ${clean(b.x)} ${clean(b.y)} ${clean(b.z)}`);
      lines.push(`      vertex ${clean(c.x)} ${clean(c.y)} ${clean(c.z)}`);
      lines.push('    endloop');
      lines.push('  endfacet');
    }
  }
  lines.push('endsolid terrain');
  downloadBlob(lines.join('\n'), 'terrait_terrain.stl', 'model/stl');
  showToast('STL exported.');
}

async function exportHeightmapPNG() {
  try {
    setStatus('PNG');
    const heights = getHeights();
    const width = state.segments + 1;
    const height = state.segments + 1;
    const png = create16BitGrayscalePNG(width, height, heights);
    downloadBlob(png, 'terrait_heightmap_16bit.png', 'image/png');
    setStatus('READY');
    showToast('16-bit PNG exported.');
  } catch (error) {
    console.error(error);
    setStatus('ERROR');
    showToast('PNG export failed.');
  }
}

function create16BitGrayscalePNG(width, height, heights) {
  let min = Infinity;
  let max = -Infinity;
  for (const value of heights) {
    min = Math.min(min, value);
    max = Math.max(max, value);
  }
  if (!Number.isFinite(min) || !Number.isFinite(max) || Math.abs(max - min) < 1e-6) {
    min = -1;
    max = 1;
  }

  const rowBytes = width * 2 + 1;
  const raw = new Uint8Array(rowBytes * height);
  for (let y = 0; y < height; y += 1) {
    const rowOffset = y * rowBytes;
    raw[rowOffset] = 0;
    for (let x = 0; x < width; x += 1) {
      const h = heights[y * width + x];
      const normalized = clamp((h - min) / (max - min), 0, 1);
      const value = Math.round(normalized * 65535);
      const offset = rowOffset + 1 + x * 2;
      raw[offset] = (value >> 8) & 0xff;
      raw[offset + 1] = value & 0xff;
    }
  }

  const chunks = [];
  chunks.push(new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]));

  const ihdr = new Uint8Array(13);
  writeUint32(ihdr, 0, width);
  writeUint32(ihdr, 4, height);
  ihdr[8] = 16;
  ihdr[9] = 0;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  chunks.push(makePngChunk('IHDR', ihdr));
  chunks.push(makePngChunk('IDAT', zlibStore(raw)));
  chunks.push(makePngChunk('IEND', new Uint8Array(0)));

  return new Blob(chunks, { type: 'image/png' });
}

function makePngChunk(type, data) {
  const typeBytes = new TextEncoder().encode(type);
  const chunk = new Uint8Array(12 + data.length);
  writeUint32(chunk, 0, data.length);
  chunk.set(typeBytes, 4);
  chunk.set(data, 8);
  const crcInput = new Uint8Array(typeBytes.length + data.length);
  crcInput.set(typeBytes, 0);
  crcInput.set(data, typeBytes.length);
  writeUint32(chunk, 8 + data.length, crc32(crcInput));
  return chunk;
}

function zlibStore(data) {
  const blocks = [];
  blocks.push(new Uint8Array([0x78, 0x01]));
  let offset = 0;
  while (offset < data.length) {
    const len = Math.min(65535, data.length - offset);
    const final = offset + len >= data.length ? 1 : 0;
    const block = new Uint8Array(5 + len);
    block[0] = final;
    block[1] = len & 0xff;
    block[2] = (len >> 8) & 0xff;
    const nlen = (~len) & 0xffff;
    block[3] = nlen & 0xff;
    block[4] = (nlen >> 8) & 0xff;
    block.set(data.subarray(offset, offset + len), 5);
    blocks.push(block);
    offset += len;
  }
  const checksum = adler32(data);
  const trailer = new Uint8Array(4);
  writeUint32(trailer, 0, checksum);
  blocks.push(trailer);
  return concatUint8(blocks);
}

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(data) {
  let c = 0xffffffff;
  for (let i = 0; i < data.length; i += 1) c = CRC_TABLE[(c ^ data[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function adler32(data) {
  let a = 1;
  let b = 0;
  for (let i = 0; i < data.length; i += 1) {
    a = (a + data[i]) % 65521;
    b = (b + a) % 65521;
  }
  return ((b << 16) | a) >>> 0;
}

function writeUint32(target, offset, value) {
  target[offset] = (value >>> 24) & 0xff;
  target[offset + 1] = (value >>> 16) & 0xff;
  target[offset + 2] = (value >>> 8) & 0xff;
  target[offset + 3] = value & 0xff;
}

function concatUint8(parts) {
  const length = parts.reduce((sum, part) => sum + part.length, 0);
  const out = new Uint8Array(length);
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
}

function getVertex(pos, index) {
  return new THREE.Vector3(pos.getX(index), pos.getY(index), pos.getZ(index));
}

function fitCameraToTerrain() {
  const size = state.size || DEFAULT_TERRAIN.size;
  camera.position.set(size * 0.68, size * 0.58, size * 0.78);
  controls.target.set(0, 0, 0);
  controls.minDistance = Math.max(size * 0.035, 8);
  controls.maxDistance = Math.max(size * 4, 1000);
  controls.update();
}

function resizeRenderer() {
  const rect = dom.viewport.getBoundingClientRect();
  const width = Math.max(1, Math.floor(rect.width));
  const height = Math.max(1, Math.floor(rect.height));
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}

function animate() {
  requestAnimationFrame(animate);
  const delta = state.clock.getDelta();
  state.fpsTime += delta;
  state.frameCounter += 1;
  if (state.fpsTime >= 0.5) {
    dom.fpsCounter.textContent = Math.round(state.frameCounter / state.fpsTime).toString();
    state.fpsTime = 0;
    state.frameCounter = 0;
  }
  controls.update();
  renderer.render(scene, camera);
}

function updateStats() {
  const vertices = (state.segments + 1) * (state.segments + 1);
  dom.vertexCount.textContent = vertices.toLocaleString('de-DE');
  dom.segmentsValue.textContent = String(state.segments);
}

function updateSceneHint() {
  dom.sceneHint.textContent = `Base Plane: ${clean(state.size)} × ${clean(state.size)} m · ${state.segments} segments`;
}

function setStatus(text) {
  dom.statusBadge.textContent = text;
}

function showToast(message) {
  dom.toastBody.textContent = message;
  toast.show();
}

function downloadBlob(data, filename, mimeType) {
  const blob = data instanceof Blob ? data : new Blob([data], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function clean(value) {
  return Number(value).toFixed(6).replace(/\.0+$/, '').replace(/(\.\d*?)0+$/, '$1');
}


function valueNoise2D(x, z, seed = 0) {
  const x0 = Math.floor(x);
  const z0 = Math.floor(z);
  const x1 = x0 + 1;
  const z1 = z0 + 1;
  const tx = smoothstep(0, 1, x - x0);
  const tz = smoothstep(0, 1, z - z0);
  const a = hash2D(x0, z0, seed);
  const b = hash2D(x1, z0, seed);
  const c = hash2D(x0, z1, seed);
  const d = hash2D(x1, z1, seed);
  return lerp(lerp(a, b, tx), lerp(c, d, tx), tz);
}

function hash2D(x, z, seed = 0) {
  const value = Math.sin(x * 127.1 + z * 311.7 + seed * 19.19) * 43758.5453123;
  return value - Math.floor(value);
}

function smoothstep(edge0, edge1, value) {
  const t = clamp((value - edge0) / Math.max(edge1 - edge0, 1e-6), 0, 1);
  return t * t * (3 - 2 * t);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

// sksdesign © 2026
