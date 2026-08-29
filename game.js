import * as THREE from "./assets/three.module.js";

const canvas = document.getElementById("game");
const moneyEl = document.getElementById("money");
const hintEl = document.getElementById("hint");
const wantedStarsEl = document.getElementById("wantedStars");
const notificationFeedEl = document.getElementById("notificationFeed");
const nameScreenEl = document.getElementById("nameScreen");
const nameFormEl = document.getElementById("nameForm");
const playerNameInput = document.getElementById("playerNameInput");
const deviceChoiceEl = document.getElementById("deviceChoice");
const phoneButton = document.getElementById("phoneButton");
const computerButton = document.getElementById("computerButton");
const mobileControlsEl = document.getElementById("mobileControls");
const joystickEl = document.getElementById("joystick");
const joystickStickEl = document.getElementById("joystickStick");
const menuEl = document.getElementById("menu");
const gameOverEl = document.getElementById("gameOver");
const arrestFx = document.getElementById("arrestFx");
const singleplayerButton = document.getElementById("singleplayerButton");
const createGameButton = document.getElementById("createGameButton");
const joinGameButton = document.getElementById("joinGameButton");
const joinPublicButton = document.getElementById("joinPublicButton");
const joinForm = document.getElementById("joinForm");
const joinCodeInput = document.getElementById("joinCodeInput");
const menuStatusEl = document.getElementById("menuStatus");
const gameCodeEl = document.getElementById("gameCode");
const restartButton = document.getElementById("restartButton");
const minimapEl = document.getElementById("minimap");
const transitionFadeEl = document.getElementById("transitionFade");
const damageFxEl = document.getElementById("damageFx");
const storeHealthEl = document.getElementById("storeHealth");
const storeHealthFillEl = storeHealthEl.querySelector("b");

const minimap = document.createElement("canvas");
const miniCtx = minimap.getContext("2d");
minimap.width = 154;
minimap.height = 154;
minimapEl.appendChild(minimap);

const wantedStarEls = [];
for (let i = 0; i < 5; i++) {
  const star = document.createElement("span");
  star.textContent = "\u2605";
  wantedStarsEl.appendChild(star);
  wantedStarEls.push(star);
}

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.35));
renderer.shadowMap.enabled = false;
renderer.setClearColor(0xa9c9e5);

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0xa9c9e5, 460, 1280);

const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 1850);
scene.add(camera);
const world = new THREE.Group();
scene.add(world);

const sun = new THREE.DirectionalLight(0xfff0bc, 2.35);
sun.position.set(-260, 520, 180);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -520;
sun.shadow.camera.right = 520;
sun.shadow.camera.top = 520;
sun.shadow.camera.bottom = -520;
scene.add(sun);
scene.add(sun.target);
scene.add(new THREE.HemisphereLight(0xbfe7ff, 0x5f7a52, 1.7));

const keys = new Set();
const inputState = {
  device: "",
  mobile: false,
  steer: 0,
  throttle: 0,
  joystickPointerId: null,
};
const clock = new THREE.Clock();
let seed = Math.floor(Math.random() * 999999);
const CHUNK = 260;
const ROAD = 92;
const LANE_OFFSET = ROAD * 0.23;
const ROAD_SPACING = 760;
const SIDE_ROAD_SPACING = 1040;
const MAX_COPS = 6;
const MAP_PRELOAD_RADIUS = 5;
const MAP_KEEP_RADIUS = 6;
const MAX_TRAFFIC = 11;
const TRAFFIC_SPAWN_MIN = 980;
const TRAFFIC_SPAWN_MAX = 1550;
const COP_SPAWN_MIN = 820;
const COP_SPAWN_MAX = 1250;
const TRAFFIC_DESPAWN_DISTANCE = 1900;
const COP_DESPAWN_DISTANCE = 2100;
const COP_ARREST_RADIUS = 76;

const mats = {
  grass: new THREE.MeshLambertMaterial({ color: 0x5f9a57 }),
  field: new THREE.MeshLambertMaterial({ color: 0x9aa65a }),
  cropLine: new THREE.MeshBasicMaterial({ color: 0x6e7e3e, transparent: true, opacity: 0.48, depthWrite: false }),
  playground: new THREE.MeshLambertMaterial({ color: 0x526f4c }),
  chalk: new THREE.MeshBasicMaterial({ color: 0xe8ead0, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }),
  road: new THREE.MeshLambertMaterial({ color: 0x3f3e38 }),
  line: new THREE.MeshBasicMaterial({ color: 0xf8e86b, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }),
  parking: new THREE.MeshLambertMaterial({ color: 0x4b4942 }),
  concrete: new THREE.MeshLambertMaterial({ color: 0x74766d }),
  curb: new THREE.MeshLambertMaterial({ color: 0xd8d3be }),
  stationWall: new THREE.MeshLambertMaterial({ color: 0xe7ddbd }),
  stationTrim: new THREE.MeshLambertMaterial({ color: 0xd62828 }),
  marketWall: new THREE.MeshLambertMaterial({ color: 0xd8d1bf }),
  marketBrick: new THREE.MeshLambertMaterial({ color: 0x9a5c45 }),
  marketBlue: new THREE.MeshBasicMaterial({ color: 0x1b8fe8 }),
  marketGlow: new THREE.MeshBasicMaterial({ color: 0x68cfff, transparent: true, opacity: 0.42, depthWrite: false }),
  entranceGreen: new THREE.MeshBasicMaterial({ color: 0x39ff72, transparent: true, opacity: 0.64, depthWrite: false }),
  entranceGreenSolid: new THREE.MeshBasicMaterial({ color: 0x39ff72 }),
  storeFloor: new THREE.MeshLambertMaterial({ color: 0x9ea18f }),
  storeWall: new THREE.MeshLambertMaterial({ color: 0xd8d1bf }),
  shelf: new THREE.MeshLambertMaterial({ color: 0x315d42 }),
  productRed: new THREE.MeshLambertMaterial({ color: 0xd4483f }),
  productYellow: new THREE.MeshLambertMaterial({ color: 0xe6d45c }),
  cashier: new THREE.MeshLambertMaterial({ color: 0x2a9be8 }),
  personBody: new THREE.MeshLambertMaterial({ color: 0x2f6fd0 }),
  personHead: new THREE.MeshLambertMaterial({ color: 0xf1c08a }),
  pumpBlue: new THREE.MeshLambertMaterial({ color: 0x2a66c9 }),
  pumpRed: new THREE.MeshLambertMaterial({ color: 0xdc2f2f }),
  pumpDark: new THREE.MeshLambertMaterial({ color: 0x1f2427 }),
  redCar: new THREE.MeshLambertMaterial({ color: 0xe91518 }),
  copWhite: new THREE.MeshLambertMaterial({ color: 0xf2f2ee }),
  copBlue: new THREE.MeshLambertMaterial({ color: 0x174fe6 }),
  copRed: new THREE.MeshLambertMaterial({ color: 0xe61521 }),
  traffic: new THREE.MeshLambertMaterial({ color: 0xe39a42 }),
  grandma: new THREE.MeshLambertMaterial({ color: 0x70a8d9 }),
  drunk: new THREE.MeshLambertMaterial({ color: 0xa15ad9 }),
  remoteCar: new THREE.MeshLambertMaterial({ color: 0x18d2ff }),
  glass: new THREE.MeshLambertMaterial({ color: 0x141b20 }),
  tire: new THREE.MeshLambertMaterial({ color: 0x101010 }),
  hubcap: new THREE.MeshLambertMaterial({ color: 0xd8d8cf }),
  outline: new THREE.MeshBasicMaterial({ color: 0x090b0c }),
  light: new THREE.MeshBasicMaterial({ color: 0xffee80 }),
  skid: new THREE.MeshBasicMaterial({ color: 0x111111, transparent: true, opacity: 0.34, depthWrite: false }),
  speedLine: new THREE.MeshBasicMaterial({ color: 0xf8f2b6, transparent: true, opacity: 0.48, depthWrite: false }),
  arrestZone: new THREE.MeshBasicMaterial({ color: 0xfff3a0, transparent: true, opacity: 0.28, depthWrite: false }),
  trunk: new THREE.MeshLambertMaterial({ color: 0x74502f }),
  leaves: new THREE.MeshLambertMaterial({ color: 0x23843c }),
  leaves2: new THREE.MeshLambertMaterial({ color: 0x34a853 }),
  roof: new THREE.MeshLambertMaterial({ color: 0x8b2d2d }),
};

const buildingMats = [
  new THREE.MeshLambertMaterial({ color: 0xc56d50 }),
  new THREE.MeshLambertMaterial({ color: 0xddc97e }),
  new THREE.MeshLambertMaterial({ color: 0xbad1d1 }),
  new THREE.MeshLambertMaterial({ color: 0xd7ad48 }),
  new THREE.MeshLambertMaterial({ color: 0x6f8191 }),
];

const chunks = new Map();
const colliders = [];
const cops = [];
const traffic = [];
const remotePlayers = new Map();
const smoke = [];
const skidMarks = [];
const speedLines = [];
const debris = [];
const tireParticles = [];
const fallingTrees = [];
const glowingObjects = [];

const effectGeometry = {
  dust: new THREE.CircleGeometry(1, 12),
  grit: new THREE.BoxGeometry(1, 1, 1),
};

let running = false;
let gameOver = false;
let money = 0;
let arrestTime = 0;
let chaseTime = 0;
let backupTime = 0;
let idleHeat = 0;
let lastPlayerX = 0;
let lastPlayerZ = 48;
let playerName = localStorage.getItem("policeGetawayName") || "";
let playerColor = colorForName(playerName || "Driver");
let lastWantedNoticeLevel = 0;
let gameMode = "driving";
let transitionLock = false;

const SMARKET_ENTRANCE = { x: -646, z: 20, radius: 42 };
const SMARKET_EXIT = { x: 6000, z: 318, radius: 48 };
const storeState = {
  group: null,
  character: null,
  fist: null,
  x: 6000,
  z: 220,
  angle: Math.PI,
  pitch: 0,
  turnVelocity: 0,
  walkCycle: 0,
  punchCharging: false,
  punchCharge: 0,
  punchTimer: 0,
  lastPunchDamage: 0,
  damageTimer: 0,
  damageShake: 0,
  hp: 100,
  dead: false,
  deathY: 0,
  deathVy: 0,
  deathVx: 0,
  deathVz: 0,
  deathRoll: 0,
  deathPitch: 0,
  deathSpin: 0,
  colliders: [],
};

const cameraState = {
  position: new THREE.Vector3(0, 136, 190),
  target: new THREE.Vector3(0, 10, -17),
  shake: 0,
  tilt: 0,
};

const PEER_PREFIX = "police-getaway-";
const PUBLIC_SERVER_CODE = "PUBLIC";
const PUBLIC_SERVER_PEER_ID = `${PEER_PREFIX}public`;
const PUBLIC_SERVER_SEED = 735201;
const multiplayer = {
  mode: "singleplayer",
  publicServer: false,
  peer: null,
  code: "",
  peerId: "",
  connections: new Map(),
  hostConnection: null,
  status: "",
  sendTimer: 0,
  worldSendTimer: 0,
};

function makeTaperedBoxGeometry(width, height, depth, topScaleX = 0.72, topScaleZ = 0.82) {
  const bx = width * 0.5;
  const bz = depth * 0.5;
  const tx = bx * topScaleX;
  const tz = bz * topScaleZ;
  const y0 = 0;
  const y1 = height;
  const vertices = new Float32Array([
    -bx, y0, -bz, bx, y0, -bz, bx, y0, bz, -bx, y0, bz,
    -tx, y1, -tz, tx, y1, -tz, tx, y1, tz, -tx, y1, tz,
  ]);
  const indices = [
    0, 1, 2, 0, 2, 3,
    4, 6, 5, 4, 7, 6,
    0, 4, 5, 0, 5, 1,
    1, 5, 6, 1, 6, 2,
    2, 6, 7, 2, 7, 3,
    3, 7, 4, 3, 4, 0,
  ];
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function makeHoodGeometry(width, height, depth) {
  const bx = width * 0.5;
  const bz = depth * 0.5;
  const vertices = new Float32Array([
    -bx, 0, -bz, bx, 0, -bz, bx, 0, bz, -bx, 0, bz,
    -bx * 0.86, height, -bz * 0.92, bx * 0.86, height, -bz * 0.92, bx * 0.72, height * 0.72, bz, -bx * 0.72, height * 0.72, bz,
  ]);
  const indices = [
    0, 1, 2, 0, 2, 3,
    4, 6, 5, 4, 7, 6,
    0, 4, 5, 0, 5, 1,
    1, 5, 6, 1, 6, 2,
    2, 6, 7, 2, 7, 3,
    3, 7, 4, 3, 4, 0,
  ];
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function makeCarShellGeometry(width, height, depth) {
  const bx = width * 0.5;
  const bz = depth * 0.5;
  const y0 = 0;
  const y1 = height * 0.45;
  const y2 = height;
  const vertices = new Float32Array([
    -bx * 0.86, y0, -bz * 0.96, bx * 0.86, y0, -bz * 0.96, bx * 0.92, y0, bz * 0.92, -bx * 0.92, y0, bz * 0.92,
    -bx, y1, -bz * 0.86, bx, y1, -bz * 0.86, bx * 0.95, y1, bz * 0.86, -bx * 0.95, y1, bz * 0.86,
    -bx * 0.72, y2, -bz * 0.52, bx * 0.72, y2, -bz * 0.52, bx * 0.66, y2 * 0.88, bz * 0.52, -bx * 0.66, y2 * 0.88, bz * 0.52,
  ]);
  const indices = [
    0, 1, 2, 0, 2, 3,
    0, 4, 5, 0, 5, 1,
    1, 5, 6, 1, 6, 2,
    2, 6, 7, 2, 7, 3,
    3, 7, 4, 3, 4, 0,
    4, 8, 9, 4, 9, 5,
    5, 9, 10, 5, 10, 6,
    6, 10, 11, 6, 11, 7,
    7, 11, 8, 7, 8, 4,
    8, 10, 9, 8, 11, 10,
  ];
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

const carGeometry = {
  body: new THREE.BoxGeometry(28, 8.8, 50),
  hood: new THREE.BoxGeometry(26, 5.2, 17),
  trunkBox: new THREE.BoxGeometry(26, 5.8, 15),
  cabinFrame: new THREE.BoxGeometry(21.5, 15.5, 23),
  roof: new THREE.BoxGeometry(19.2, 3.3, 20),
  topGlass: new THREE.BoxGeometry(15.5, 0.75, 15.8),
  sideWindow: new THREE.BoxGeometry(0.85, 8.2, 8.5),
  windshield: new THREE.BoxGeometry(15.5, 7.5, 0.9),
  hoodLine: new THREE.BoxGeometry(0.8, 0.65, 13),
  trunkLine: new THREE.BoxGeometry(0.8, 0.65, 10),
  windowDivider: new THREE.BoxGeometry(0.9, 0.8, 16.2),
  doorLine: new THREE.BoxGeometry(0.85, 10.5, 0.75),
  handle: new THREE.BoxGeometry(0.9, 1.1, 4),
  light: new THREE.BoxGeometry(5.2, 2, 1.1),
  tailLight: new THREE.BoxGeometry(4.5, 2, 1.1),
  bumper: new THREE.BoxGeometry(22, 2.5, 2.2),
  policeBeacon: new THREE.BoxGeometry(7.4, 2.4, 4.2),
  policeGlow: new THREE.CircleGeometry(32, 24),
  arrestZone: new THREE.RingGeometry(COP_ARREST_RADIUS - 2.8, COP_ARREST_RADIUS, 72),
  wheel: new THREE.CylinderGeometry(4.8, 4.8, 5.4, 20),
  hubcap: new THREE.CylinderGeometry(2.45, 2.45, 0.7, 18),
  fender: new THREE.BoxGeometry(5.4, 3.4, 10.8),
  policeTopStripe: new THREE.BoxGeometry(4.2, 0.7, 36),
  policeSideStripe: new THREE.BoxGeometry(0.9, 3.1, 34),
};

const player = makeVehicle("player", 0, 48, 0);
scene.add(player.group);

function resize() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}

function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function moveToward(value, target, amount) {
  if (value < target) return Math.min(value + amount, target);
  return Math.max(value - amount, target);
}

function angleDelta(a, b) {
  let d = b - a;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

function dist(a, b) {
  return Math.hypot(a.x - b.x, a.z - b.z);
}

function colorForName(name) {
  const palette = [0x18d2ff, 0xffd64f, 0xff58b7, 0x72f06a, 0xb276ff, 0xff8b3d, 0x40ffe2, 0xf0ff5c];
  let h = 2166136261;
  for (let i = 0; i < String(name || "").length; i++) {
    h ^= String(name).charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return palette[(h >>> 0) % palette.length];
}

function hash(x, z, salt = 0) {
  let n = x * 374761393 + z * 668265263 + salt * 1442695041 + seed * 1597334677;
  n = (n ^ (n >>> 13)) * 1274126177;
  return (n ^ (n >>> 16)) >>> 0;
}

function rngFor(x, z, salt = 0) {
  let n = hash(x, z, salt);
  return () => {
    n += 0x6d2b79f5;
    let t = n;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function mainRoadExists(id) {
  return id === 0 || hash(id, 9, 41) % 100 < 82;
}

function sideRoadExists(id) {
  return id === 0 || hash(id, -13, 77) % 100 < 46;
}

function roadCenterX(id, z) {
  const phase = id === 0 ? 0 : (hash(id, 0, 12) % 1000) * 0.01;
  return id * ROAD_SPACING + Math.sin(z * 0.0022 + phase) * 82 + Math.sin(z * 0.0046 + phase * 1.7) * 24;
}

function roadCenterZ(id, x) {
  const phase = id === 0 ? 0 : (hash(0, id, 18) % 1000) * 0.01;
  return id * SIDE_ROAD_SPACING + Math.sin(x * 0.0019 + phase) * 86 + Math.sin(x * 0.0041 + phase * 1.3) * 22;
}

function angleFromForward(fx, fz) {
  return Math.atan2(-fx, -fz);
}

function trafficAngle(axis, dir, x = 0, z = 0, id = 0) {
  if (axis === "x") {
    const dzdx = (roadCenterZ(id, x + 8) - roadCenterZ(id, x - 8)) / 16;
    return angleFromForward(dir, dzdx * dir);
  }

  const dxdz = (roadCenterX(id, z + 8) - roadCenterX(id, z - 8)) / 16;
  return angleFromForward(dxdz * dir, dir);
}

function nearestRoad(x, z) {
  let best = { distance: Infinity, axis: "z", id: 0 };
  const mainGuess = Math.round(x / ROAD_SPACING);
  for (let id = mainGuess - 2; id <= mainGuess + 2; id++) {
    if (!mainRoadExists(id)) continue;
    const centerX = roadCenterX(id, z);
    const distance = Math.abs(x - centerX);
    if (distance < best.distance) best = { distance, axis: "z", id, centerX };
  }

  const sideGuess = Math.round(z / SIDE_ROAD_SPACING);
  for (let id = sideGuess - 2; id <= sideGuess + 2; id++) {
    if (!sideRoadExists(id)) continue;
    const centerZ = roadCenterZ(id, x);
    const distance = Math.abs(z - centerZ);
    if (distance < best.distance) best = { distance, axis: "x", id, centerZ };
  }

  return best;
}

function nearestRoadIdForAxis(axis, x, z) {
  if (axis === "x") {
    const guess = Math.round(z / SIDE_ROAD_SPACING);
    let bestId = sideRoadExists(guess) ? guess : 0;
    let bestDistance = Infinity;
    for (let id = guess - 3; id <= guess + 3; id++) {
      if (!sideRoadExists(id)) continue;
      const distance = Math.abs(z - roadCenterZ(id, x));
      if (distance < bestDistance) {
        bestDistance = distance;
        bestId = id;
      }
    }
    return bestId;
  }

  const guess = Math.round(x / ROAD_SPACING);
  let bestId = mainRoadExists(guess) ? guess : 0;
  let bestDistance = Infinity;
  for (let id = guess - 3; id <= guess + 3; id++) {
    if (!mainRoadExists(id)) continue;
    const distance = Math.abs(x - roadCenterX(id, z));
    if (distance < bestDistance) {
      bestDistance = distance;
      bestId = id;
    }
  }
  return bestId;
}

function roadDistanceForAxis(axis, x, z) {
  const id = nearestRoadIdForAxis(axis, x, z);
  return axis === "x" ? Math.abs(z - roadCenterZ(id, x)) : Math.abs(x - roadCenterX(id, z));
}

function isRoad(x, z) {
  if (inSpawnRoadKeepout(x, z)) return false;
  return nearestRoad(x, z).distance < ROAD * 0.5;
}

function laneCenterFor(axis, dir, x, z, id = null) {
  if (axis === "x") {
    const roadId = id ?? nearestRoadIdForAxis(axis, x, z);
    const centerZ = roadCenterZ(roadId, x);
    return { x, z: centerZ + dir * LANE_OFFSET };
  }

  const roadId = id ?? nearestRoadIdForAxis(axis, x, z);
  const centerX = roadCenterX(roadId, z);
  return { x: centerX - dir * LANE_OFFSET, z };
}

function isParking(x, z) {
  return x > -900 && x < 520 && z > -210 && z < 250;
}

function playerSurfaceTuning() {
  const onRoad = isRoad(player.x, player.z) || isParking(player.x, player.z);
  return {
    onRoad,
    tune: onRoad
      ? {
          accel: 188,
          brake: 460,
          reverseAccel: 105,
          maxSpeed: 330,
          reverseMax: 50,
          grip: 6.25,
          driftSlip: 36,
          driftThreshold: 78,
          throttleGripLoss: 0.22,
          coast: 118,
          turnRate: 2.95,
          steerSharpness: 6.8,
          steerBuild: 2.25,
        }
      : {
          accel: 76,
          brake: 360,
          reverseAccel: 75,
          maxSpeed: 275,
          reverseMax: 38,
          grip: 1.85,
          driftSlip: 58,
          driftThreshold: 42,
          throttleGripLoss: 0.46,
          coast: 76,
          turnRate: 2.55,
          steerSharpness: 5.2,
          steerBuild: 1.75,
        },
  };
}

function areaTouchesRoad(x, z, w, d, margin = 12) {
  const samples = [
    [x, z],
    [x - w * 0.5, z - d * 0.5],
    [x + w * 0.5, z - d * 0.5],
    [x - w * 0.5, z + d * 0.5],
    [x + w * 0.5, z + d * 0.5],
  ];
  return samples.some(([sx, sz]) => nearestRoad(sx, sz).distance < ROAD * 0.5 + margin);
}

function randomOffRoadSpot(baseX, baseZ, halfW, halfD, rng) {
  for (let i = 0; i < 16; i++) {
    const x = baseX + (rng() - 0.5) * (CHUNK - halfW * 2 - 16);
    const z = baseZ + (rng() - 0.5) * (CHUNK - halfD * 2 - 16);
    if (inSpawnRoadKeepout(x, z)) continue;
    if (!areaTouchesRoad(x, z, halfW * 2, halfD * 2, 16)) return { x, z };
  }
  return null;
}

function inSpawnRoadKeepout(x, z) {
  return x > -930 && x < 540 && z > -230 && z < 270;
}

function makePlane(w, d, material, y) {
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, d), material);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = y;
  mesh.receiveShadow = true;
  return mesh;
}

function makeBox(w, h, d, material) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  mesh.position.y = h * 0.5;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function makeRoadSegment(x1, z1, x2, z2, width, material, y, parent, renderOrder = 1) {
  const dx = x2 - x1;
  const dz = z2 - z1;
  const length = Math.hypot(dx, dz);
  if (length < 1) return null;

  const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, 0.08, length + 2), material);
  mesh.position.set((x1 + x2) * 0.5, y, (z1 + z2) * 0.5);
  mesh.rotation.y = Math.atan2(dx, dz);
  mesh.receiveShadow = true;
  mesh.renderOrder = renderOrder;
  parent.add(mesh);
  return mesh;
}

function drawRoadPath(points, parent, axis) {
  for (let i = 0; i < points.length - 1; i++) {
    const midX = (points[i].x + points[i + 1].x) * 0.5;
    const midZ = (points[i].z + points[i + 1].z) * 0.5;
    if (inSpawnRoadKeepout(midX, midZ)) continue;
    makeRoadSegment(points[i].x, points[i].z, points[i + 1].x, points[i + 1].z, ROAD, mats.road, 0.1, parent, 1);
    const otherAxis = axis === "x" ? "z" : "x";
    const nearIntersection = roadDistanceForAxis(otherAxis, midX, midZ) < ROAD * 0.78;
    if (i % 2 === 0 && !nearIntersection && !isParking(midX, midZ)) {
      makeRoadSegment(points[i].x, points[i].z, points[i + 1].x, points[i + 1].z, 5.2, mats.line, 0.28, parent, 2);
    }
  }
}

function addRoadsForChunk(cx, cz, baseX, baseZ, parent) {
  const minX = baseX - CHUNK * 0.5 - ROAD;
  const maxX = baseX + CHUNK * 0.5 + ROAD;
  const minZ = baseZ - CHUNK * 0.5 - ROAD;
  const maxZ = baseZ + CHUNK * 0.5 + ROAD;
  const step = 34;

  const mainMin = Math.floor((minX - 130) / ROAD_SPACING) - 1;
  const mainMax = Math.ceil((maxX + 130) / ROAD_SPACING) + 1;
  for (let id = mainMin; id <= mainMax; id++) {
    if (!mainRoadExists(id)) continue;
    const points = [];
    for (let z = minZ; z <= maxZ + step; z += step) {
      const x = roadCenterX(id, z);
      if (x > minX - ROAD && x < maxX + ROAD) points.push({ x, z });
      else if (points.length > 1) {
        drawRoadPath(points, parent, "z");
        points.length = 0;
      }
    }
    if (points.length > 1) drawRoadPath(points, parent, "z");
  }

  const sideMin = Math.floor((minZ - 130) / SIDE_ROAD_SPACING) - 1;
  const sideMax = Math.ceil((maxZ + 130) / SIDE_ROAD_SPACING) + 1;
  for (let id = sideMin; id <= sideMax; id++) {
    if (!sideRoadExists(id)) continue;
    const points = [];
    for (let x = minX; x <= maxX + step; x += step) {
      const z = roadCenterZ(id, x);
      if (z > minZ - ROAD && z < maxZ + ROAD) points.push({ x, z });
      else if (points.length > 1) {
        drawRoadPath(points, parent, "x");
        points.length = 0;
      }
    }
    if (points.length > 1) drawRoadPath(points, parent, "x");
  }
}

function makeNameTagTexture(name, color) {
  const canvas = document.createElement("canvas");
  canvas.width = 384;
  canvas.height = 96;
  const ctx = canvas.getContext("2d");
  const text = cleanPlayerName(name);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "rgba(7, 9, 9, 0.78)";
  ctx.strokeStyle = `#${color.toString(16).padStart(6, "0")}`;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.roundRect(18, 18, 348, 54, 8);
  ctx.fill();
  ctx.stroke();
  ctx.font = "900 30px Arial, Helvetica, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.lineWidth = 6;
  ctx.strokeStyle = "rgba(0, 0, 0, 0.9)";
  ctx.strokeText(text.toUpperCase(), 192, 46);
  ctx.fillStyle = "#ffffff";
  ctx.fillText(text.toUpperCase(), 192, 46);
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

function setVehicleNameTag(v, name, color) {
  const cleanName = cleanPlayerName(name);
  const tagColor = color || colorForName(cleanName);
  if (!v.nameTag) {
    const material = new THREE.SpriteMaterial({ map: makeNameTagTexture(cleanName, tagColor), transparent: true, depthTest: false });
    const sprite = new THREE.Sprite(material);
    sprite.position.set(0, 56, 0);
    sprite.scale.set(92, 23, 1);
    sprite.renderOrder = 30;
    v.group.add(sprite);
    v.nameTag = sprite;
  } else if (v.nameTagText !== cleanName || v.nameTagColor !== tagColor) {
    const oldMap = v.nameTag.material.map;
    v.nameTag.material.map = makeNameTagTexture(cleanName, tagColor);
    if (oldMap) oldMap.dispose();
  }
  v.nameTagText = cleanName;
  v.nameTagColor = tagColor;
}

function makeStoreNameTagTexture(name, color, hp) {
  const canvas = document.createElement("canvas");
  canvas.width = 384;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  const cleanName = cleanPlayerName(name).toUpperCase();
  const clampedHp = clamp(hp, 0, 100);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "rgba(7, 9, 9, 0.78)";
  ctx.strokeStyle = `#${color.toString(16).padStart(6, "0")}`;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.roundRect(24, 16, 336, 76, 8);
  ctx.fill();
  ctx.stroke();
  ctx.font = "900 28px Arial, Helvetica, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.lineWidth = 5;
  ctx.strokeStyle = "rgba(0, 0, 0, 0.88)";
  ctx.strokeText(cleanName, 192, 42);
  ctx.fillStyle = "#ffffff";
  ctx.fillText(cleanName, 192, 42);
  ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
  ctx.fillRect(54, 66, 276, 14);
  ctx.fillStyle = clampedHp < 28 ? "#e20718" : clampedHp < 58 ? "#ffbe2f" : "#32f06a";
  ctx.fillRect(54, 66, 276 * (clampedHp / 100), 14);
  ctx.strokeStyle = "rgba(0, 0, 0, 0.7)";
  ctx.lineWidth = 2;
  ctx.strokeRect(54, 66, 276, 14);
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

function setStoreNameTag(remote) {
  if (!remote.storeCharacter) return;
  const hp = remote.storeTarget?.hp ?? 100;
  const tagColor = remote.paintColor || colorForName(remote.playerName || "Driver");
  if (!remote.storeNameTag) {
    const material = new THREE.SpriteMaterial({
      map: makeStoreNameTagTexture(remote.playerName || "Driver", tagColor, hp),
      transparent: true,
      depthTest: false,
    });
    const sprite = new THREE.Sprite(material);
    sprite.position.set(0, 76, 0);
    sprite.scale.set(84, 28, 1);
    sprite.renderOrder = 35;
    remote.storeCharacter.add(sprite);
    remote.storeNameTag = sprite;
  } else if (remote.storeNameTagText !== remote.playerName || remote.storeNameTagHp !== Math.round(hp) || remote.storeNameTagColor !== tagColor) {
    const oldMap = remote.storeNameTag.material.map;
    remote.storeNameTag.material.map = makeStoreNameTagTexture(remote.playerName || "Driver", tagColor, hp);
    if (oldMap) oldMap.dispose();
  }
  remote.storeNameTagText = remote.playerName;
  remote.storeNameTagHp = Math.round(hp);
  remote.storeNameTagColor = tagColor;
}

function makeMarketSign() {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 160;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#0f75c8";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "rgba(255, 255, 255, 0.18)";
  ctx.fillRect(0, 0, canvas.width, 12);
  ctx.font = "900 58px Arial, Helvetica, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.lineWidth = 8;
  ctx.strokeStyle = "rgba(0, 34, 70, 0.8)";
  ctx.strokeText("S-MARKET", 256, 69);
  ctx.fillStyle = "#ffffff";
  ctx.fillText("S-MARKET", 256, 69);
  ctx.font = "900 25px Arial, Helvetica, sans-serif";
  ctx.fillText("7-22  11-19", 256, 122);
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return new THREE.MeshBasicMaterial({ map: texture, transparent: true });
}

function makeVehicle(kind, x, z, angle, paintColor = null) {
  const group = new THREE.Group();
  const trafficPalette = [0xe39a42, 0x58a6d6, 0xe0d35b, 0x58b66d, 0xb86bd6, 0xe36b78];
  const trafficColor = paintColor ?? trafficPalette[Math.floor(Math.random() * trafficPalette.length)];
  const remoteColor = paintColor ?? 0x18d2ff;
  const mat =
    kind === "player" ? mats.redCar :
    kind === "cop" ? mats.copWhite :
    kind === "grandma" ? mats.grandma :
    kind === "drunk" ? mats.drunk :
    kind === "remote" ? new THREE.MeshLambertMaterial({ color: remoteColor }) :
    new THREE.MeshLambertMaterial({ color: trafficColor });

  const addPart = (geometry, material, px, py, pz, rx = 0, ry = 0, rz = 0) => {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(px, py, pz);
    mesh.rotation.set(rx, ry, rz);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  };

  addPart(carGeometry.body, mat, 0, 7.4, 0);
  addPart(carGeometry.hood, mat, 0, 13.3, -16.8);
  addPart(carGeometry.trunkBox, mat, 0, 13.6, 18.4);
  addPart(carGeometry.cabinFrame, mat, 0, 18.5, -1.4);
  addPart(carGeometry.roof, mat, 0, 27.7, -1.4);
  addPart(carGeometry.topGlass, mats.glass, 0, 29.65, -1.4);
  addPart(carGeometry.windowDivider, mats.outline, 0, 30.1, -1.4);
  addPart(carGeometry.hoodLine, mats.outline, 0, 16.05, -16.8);
  addPart(carGeometry.trunkLine, mats.outline, 0, 16.85, 18.4);
  addPart(carGeometry.windshield, mats.glass, 0, 20.5, -13.2, -0.14);
  addPart(carGeometry.windshield, mats.glass, 0, 20.2, 10.6, 0.12);

  for (const sx of [-1, 1]) {
    addPart(carGeometry.sideWindow, mats.glass, sx * 11.1, 21.1, -6.2);
    addPart(carGeometry.sideWindow, mats.glass, sx * 11.1, 21.1, 3.6);
    addPart(carGeometry.doorLine, mats.outline, sx * 14.2, 13.8, -1.1);
    addPart(carGeometry.handle, mats.outline, sx * 14.35, 16.4, -6.5);
    addPart(carGeometry.handle, mats.outline, sx * 14.35, 16.4, 4.8);
  }

  if (kind === "cop") {
    const blueBeaconMat = new THREE.MeshBasicMaterial({ color: 0x1b58ff });
    const redBeaconMat = new THREE.MeshBasicMaterial({ color: 0xff1028 });
    const blueGlowMat = new THREE.MeshBasicMaterial({
      color: 0x1b58ff,
      transparent: true,
      opacity: 0.16,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const redGlowMat = new THREE.MeshBasicMaterial({
      color: 0xff1028,
      transparent: true,
      opacity: 0.16,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const blueBeacon = addPart(carGeometry.policeBeacon, blueBeaconMat, -4, 31.2, -1.4);
    const redBeacon = addPart(carGeometry.policeBeacon, redBeaconMat, 4, 31.2, -1.4);
    const blueGlow = addPart(carGeometry.policeGlow, blueGlowMat, -11, 0.55, -1.4, -Math.PI / 2);
    const redGlow = addPart(carGeometry.policeGlow, redGlowMat, 11, 0.58, -1.4, -Math.PI / 2);
    const arrestZone = addPart(carGeometry.arrestZone, mats.arrestZone.clone(), 0, 0.72, 0, -Math.PI / 2);
    const blueLight = new THREE.PointLight(0x1b58ff, 0, 150, 2.1);
    blueLight.position.set(-6, 28, -1.4);
    const redLight = new THREE.PointLight(0xff1028, 0, 150, 2.1);
    redLight.position.set(6, 28, -1.4);
    group.add(blueLight, redLight);
    group.userData.policeLights = {
      blueBeacon,
      redBeacon,
      blueGlow,
      redGlow,
      blueLight,
      redLight,
      arrestZone,
      phase: Math.random() * Math.PI * 2,
    };
    addPart(carGeometry.policeTopStripe, mats.copBlue, 0, 18.05, 1.5);
    addPart(carGeometry.policeSideStripe, mats.copBlue, -14.45, 13.2, 1.5);
    addPart(carGeometry.policeSideStripe, mats.copBlue, 14.45, 13.2, 1.5);
  }

  addPart(carGeometry.light, mats.light, -6.9, 10.6, -25.5);
  addPart(carGeometry.light, mats.light, 6.9, 10.6, -25.5);
  addPart(carGeometry.tailLight, mats.copRed, -7.2, 10.2, 25.5);
  addPart(carGeometry.tailLight, mats.copRed, 7.2, 10.2, 25.5);
  addPart(carGeometry.bumper, mats.tire, 0, 6.2, -26.4);
  addPart(carGeometry.bumper, mats.tire, 0, 6.2, 26.4);

  for (const sx of [-11.8, 11.8]) {
    for (const sz of [-15.6, 15.6]) {
      addPart(carGeometry.fender, mat, sx, 8.4, sz);
      addPart(carGeometry.wheel, mats.tire, sx * 1.09, 5.2, sz, 0, 0, Math.PI / 2);
      addPart(carGeometry.hubcap, mats.hubcap, sx * 1.09, 5.2, sz, 0, 0, Math.PI / 2);
    }
  }

  const car = {
    group,
    kind,
    x,
    z,
    vx: 0,
    vz: 0,
    angle,
    steer: 0,
    steerCharge: 0,
    radius: 20.5,
    halfWidth: 14.4,
    halfLength: 26.2,
    roadAxis: Math.random() < 0.5 ? "x" : "z",
    dir: Math.random() < 0.5 ? -1 : 1,
    timer: Math.random() * 10,
    personality: kind,
    jamTime: 0,
    escapeTimer: 0,
    escapeSide: Math.random() < 0.5 ? -1 : 1,
    reverseTimer: 0,
    escapeCooldown: 0,
    paintColor: kind === "remote" ? remoteColor : kind === "normal" ? trafficColor : null,
  };
  syncVehicle(car);
  return car;
}

function syncVehicle(v) {
  v.group.position.set(v.x, 0, v.z);
  v.group.rotation.y = v.angle;
}

function driveVehicle(v, input, dt, tune) {
  const maxSpeed = tune.maxSpeed;
  const reverseMax = tune.reverseMax ?? 52;
  const accel = tune.accel;
  const brake = tune.brake ?? accel * 1.8;
  const reverseAccel = tune.reverseAccel ?? accel * 0.58;
  const coast = tune.coast ?? accel * 0.72;
  const turnRate = tune.turnRate ?? 2.45;
  const steerSharpness = tune.steerSharpness ?? 5.6;
  const steerBuild = tune.steerBuild ?? 2.35;
  const driftSlip = tune.driftSlip ?? 22;
  const driftThreshold = tune.driftThreshold ?? 74;
  const throttleGripLoss = tune.throttleGripLoss ?? 0.18;

  let fx = -Math.sin(v.angle);
  let fz = -Math.cos(v.angle);
  let rx = Math.cos(v.angle);
  let rz = -Math.sin(v.angle);
  let forwardSpeed = v.vx * fx + v.vz * fz;
  let sideSpeed = v.vx * rx + v.vz * rz;

  v.steer = lerp(v.steer, input.steer, 1 - Math.exp(-dt * steerSharpness));
  v.steerCharge = lerp(v.steerCharge, Math.abs(input.steer) > 0.04 ? 1 : 0, 1 - Math.exp(-dt * steerBuild));
  if (Math.abs(input.steer) < 0.04 && Math.abs(v.steer) < 0.015) v.steer = 0;

  if (input.throttle > 0) {
    forwardSpeed += input.throttle * accel * dt;
  } else if (input.throttle < 0) {
    if (forwardSpeed > 8) forwardSpeed -= brake * dt;
    else forwardSpeed += input.throttle * reverseAccel * dt;
  } else {
    forwardSpeed = moveToward(forwardSpeed, 0, coast * dt);
  }

  forwardSpeed = clamp(forwardSpeed, -reverseMax, maxSpeed);
  const absForward = Math.abs(forwardSpeed);
  const steerForce = Math.abs(v.steer);
  const slipRamp = clamp((absForward - driftThreshold) / 110, 0, 1);
  const throttleSlip = input.throttle > 0 ? input.throttle * throttleGripLoss : 0;
  const effectiveGrip = Math.max(0.85, (tune.grip ?? 4.6) * (1 - slipRamp * steerForce * 0.55 - throttleSlip));
  const driftDirection = Math.sign(v.steer || 0);
  const driftPush = driftDirection * driftSlip * steerForce * slipRamp * (0.35 + v.steerCharge * 0.65) * dt;

  sideSpeed += driftPush * Math.sign(forwardSpeed || 1);
  sideSpeed *= Math.exp(-effectiveGrip * dt);
  if (Math.abs(input.steer) < 0.04 && Math.abs(sideSpeed) < 0.8) sideSpeed = 0;

  const turnSpeed = clamp(Math.abs(forwardSpeed) / 62, 0, 1);
  const steerRamp = 0.38 + v.steerCharge * 0.62;
  v.angle += v.steer * turnRate * steerRamp * turnSpeed * dt * Math.sign(forwardSpeed || 1);

  fx = -Math.sin(v.angle);
  fz = -Math.cos(v.angle);
  rx = Math.cos(v.angle);
  rz = -Math.sin(v.angle);
  v.vx = fx * forwardSpeed + rx * sideSpeed;
  v.vz = fz * forwardSpeed + rz * sideSpeed;
  v.x += v.vx * dt;
  v.z += v.vz * dt;

  const total = Math.hypot(v.vx, v.vz);
  v.group.rotation.z = -v.steer * clamp(total / maxSpeed, 0, 1) * 0.08 + clamp(sideSpeed / 180, -0.12, 0.12);
  syncVehicle(v);
  return { speed: forwardSpeed, side: sideSpeed, total, slip: slipRamp * steerForce };
}

function makeTree(x, z, scale, parent) {
  const group = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(2.8 * scale, 4 * scale, 22 * scale, 7), mats.trunk);
  trunk.position.y = 11 * scale;
  trunk.castShadow = true;
  const lower = new THREE.Mesh(new THREE.ConeGeometry(18 * scale, 42 * scale, 9), mats.leaves);
  lower.position.y = 39 * scale;
  lower.castShadow = true;
  const upper = new THREE.Mesh(new THREE.ConeGeometry(13 * scale, 32 * scale, 9), mats.leaves2);
  upper.position.y = 62 * scale;
  upper.castShadow = true;
  group.position.set(x, 0, z);
  group.add(trunk, lower, upper);
  parent.add(group);
  colliders.push({ type: "tree", x, z, r: 12 * scale, scale, group, knocked: false, chunkKey: parent.userData.chunkKey });
}

function makeBuilding(x, z, w, d, h, type, rng, parent) {
  const group = new THREE.Group();
  const mat = type === "shop" ? buildingMats[3] : type === "special" ? buildingMats[4] : buildingMats[Math.floor(rng() * 3)];
  const base = makeBox(w, h, d, mat);
  const roof = makeBox(w + 8, 8, d + 8, type === "shop" ? mats.glass : mats.roof);
  roof.position.y = h + 4;
  group.add(base, roof);

  if (type === "shop") {
    const sign = makeBox(w * 0.66, 13, 3, mats.glass);
    sign.position.set(0, h * 0.68, -d * 0.5 - 2);
    group.add(sign);
  }

  if (type === "special") {
    const tower = new THREE.Mesh(new THREE.CylinderGeometry(7, 10, 54, 10), buildingMats[4]);
    tower.position.set(w * 0.28, h + 27, d * 0.2);
    tower.castShadow = true;
    group.add(tower);
  }

  group.position.set(x, 0, z);
  parent.add(group);
  colliders.push({ type: "building", x, z, w, d, r: Math.hypot(w, d) * 0.5, chunkKey: parent.userData.chunkKey });
}

function addParkingStripe(parent, x, z, w, d, rot = 0) {
  const stripe = makePlane(w, d, mats.line, 0.32);
  stripe.position.set(x, 0.32, z);
  stripe.rotation.z = rot;
  stripe.renderOrder = 4;
  parent.add(stripe);
}

function addParkingBayRow(parent, centerX, frontZ, count, stallW = 34, stallD = 60, side = 1) {
  const totalW = count * stallW;
  const backZ = frontZ + side * stallD;
  const midZ = frontZ + side * stallD * 0.5;
  addParkingStripe(parent, centerX, frontZ, totalW, 3.6);
  addParkingStripe(parent, centerX, backZ, totalW, 3.6);

  for (let i = 0; i <= count; i++) {
    const x = centerX - totalW * 0.5 + i * stallW;
    addParkingStripe(parent, x, midZ, 3.2, stallD);
  }
}

function addDashedLaneLine(parent, x1, z1, x2, z2, pieces = 5) {
  const dx = x2 - x1;
  const dz = z2 - z1;
  const angle = Math.atan2(dx, dz);
  for (let i = 0; i < pieces; i++) {
    const t = (i + 0.5) / pieces;
    addParkingStripe(parent, x1 + dx * t, z1 + dz * t, 4, 24, angle);
  }
}

function addCurb(parent, x, z, w, d) {
  const curb = makeBox(w, 1.4, d, mats.curb);
  curb.position.set(x, 0.7, z);
  parent.add(curb);
}

function addSolidRect(parent, x, z, w, d, padding = 0) {
  colliders.push({
    type: "building",
    x,
    z,
    w: w + padding * 2,
    d: d + padding * 2,
    r: Math.hypot(w + padding * 2, d + padding * 2) * 0.5,
    chunkKey: parent.userData.chunkKey,
  });
}

function makeGlowMaterial(color, opacity) {
  return new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
}

function addSMarketEntranceGlow(parent, x, z) {
  const doorBack = makeBox(108, 48, 4, mats.pumpDark);
  doorBack.position.set(x, 24, z + 1);
  const doorLeft = makeBox(39, 39, 3, makeGlowMaterial(0x9cf8df, 0.62));
  doorLeft.position.set(x - 20, 20, z - 2);
  const doorRight = makeBox(39, 39, 3, makeGlowMaterial(0x9cf8df, 0.62));
  doorRight.position.set(x + 20, 20, z - 2);
  const divider = makeBox(3, 39, 4, mats.marketBlue);
  divider.position.set(x, 20, z - 3);

  const leftGlow = makeBox(5, 47, 4, makeGlowMaterial(0x39ff72, 0.72));
  leftGlow.position.set(x - 56, 24, z - 3);
  const rightGlow = makeBox(5, 47, 4, makeGlowMaterial(0x39ff72, 0.72));
  rightGlow.position.set(x + 56, 24, z - 3);
  const topGlow = makeBox(116, 5, 4, makeGlowMaterial(0x39ff72, 0.74));
  topGlow.position.set(x, 49, z - 3);

  const groundGlow = makePlane(98, 34, makeGlowMaterial(0x39ff72, 0.25), 0.72);
  groundGlow.position.set(x, 0.72, z - 24);
  groundGlow.renderOrder = 9;

  const canopy = makeBox(132, 8, 32, mats.marketBlue);
  canopy.position.set(x, 55, z - 12);
  const canopyLight = makeBox(106, 3, 24, makeGlowMaterial(0xb7ffe0, 0.38));
  canopyLight.position.set(x, 50, z - 13);

  for (const mesh of [doorLeft, doorRight, leftGlow, rightGlow, topGlow, groundGlow, canopyLight]) {
    mesh.userData.pulseOpacity = true;
  }
  parent.add(doorBack, doorLeft, doorRight, divider, leftGlow, rightGlow, topGlow, groundGlow, canopy, canopyLight);
  glowingObjects.push(doorLeft, doorRight, leftGlow, rightGlow, topGlow, groundGlow, canopyLight);
}

function addPump(parent, x, z, colorMat) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);

  const island = makeBox(25, 1.4, 38, mats.concrete);
  island.position.y = 0.6;
  const body = makeBox(8.8, 17, 7, colorMat);
  body.position.set(0, 9.1, 0);
  const screen = makeBox(6.2, 4.2, 0.55, mats.glass);
  screen.position.set(0, 15.2, -3.85);
  const hose = makeBox(1, 11, 1, mats.pumpDark);
  hose.position.set(5.8, 10.6, -2.6);
  const nozzle = makeBox(3, 1.4, 1.3, mats.pumpDark);
  nozzle.position.set(7, 6.5, -3);
  group.add(island, body, screen, hose, nozzle);

  for (const sx of [-10.8, 10.8]) {
    for (const sz of [-14, 14]) {
      const bollard = new THREE.Mesh(new THREE.CylinderGeometry(1.35, 1.35, 11, 8), mats.stationTrim);
      bollard.position.set(sx, 5.5, sz);
      group.add(bollard);
    }
  }

  parent.add(group);
  addSolidRect(parent, x, z, 24, 36, 2);
}

function addSpawnStore(parent, x, z) {
  const pad = makePlane(190, 150, mats.concrete, 0.17);
  pad.position.set(x, 0.17, z);
  pad.renderOrder = 1;
  parent.add(pad);

  addCurb(parent, x - 97, z, 4, 150);
  addCurb(parent, x + 97, z, 4, 150);
  addCurb(parent, x, z - 77, 190, 4);
  addCurb(parent, x, z + 77, 190, 4);

  const store = makeBox(118, 42, 72, buildingMats[3]);
  store.position.set(x, 21, z + 20);
  const roof = makeBox(136, 8, 88, mats.roof);
  roof.position.set(x, 46, z + 20);
  const sign = makeBox(88, 13, 3, mats.stationTrim);
  sign.position.set(x, 35, z - 26.8);
  const glass = makeBox(56, 20, 1.4, mats.glass);
  glass.position.set(x - 20, 18, z - 36.8);
  const door = makeBox(20, 24, 1.6, mats.pumpDark);
  door.position.set(x + 32, 13, z - 36.9);
  parent.add(store, roof, sign, glass, door);
  colliders.push({ type: "building", x, z: z + 20, w: 136, d: 88, r: 82, chunkKey: parent.userData.chunkKey });

  for (let i = -2; i <= 2; i++) {
    addParkingStripe(parent, x + i * 26, z - 44, 3, 50);
  }
  addParkingStripe(parent, x, z - 18, 130, 3.5);
}

function addSMarket(parent, x, z) {
  const pad = makePlane(680, 340, mats.parking, 0.155);
  pad.position.set(x, 0.155, z - 10);
  pad.renderOrder = 1;
  parent.add(pad);

  const driveway = makePlane(250, 110, mats.parking, 0.165);
  driveway.position.set(x + 340, 0.165, z - 18);
  driveway.renderOrder = 1;
  parent.add(driveway);

  addCurb(parent, x - 344, z - 10, 4, 340);
  addCurb(parent, x + 344, z - 10, 4, 340);
  addCurb(parent, x, z - 182, 680, 4);
  addCurb(parent, x, z + 162, 680, 4);

  const building = makeBox(440, 76, 132, mats.marketBrick);
  building.position.set(x + 42, 38, z + 82);
  const frontHall = makeBox(172, 108, 140, mats.marketWall);
  frontHall.position.set(x - 176, 54, z + 76);
  const rightWing = makeBox(190, 62, 120, mats.stationWall);
  rightWing.position.set(x + 338, 31, z + 74);
  const roof = makeBox(466, 10, 154, mats.roof);
  roof.position.set(x + 42, 83, z + 82);
  const hallRoof = makeBox(194, 10, 160, mats.roof);
  hallRoof.position.set(x - 176, 113, z + 76);
  const wingRoof = makeBox(206, 9, 138, mats.roof);
  wingRoof.position.set(x + 338, 67, z + 74);
  parent.add(building, frontHall, rightWing, roof, hallRoof, wingRoof);

  const blueFacade = makeBox(186, 46, 5, mats.marketBlue);
  blueFacade.position.set(x - 176, 74, z + 3);
  const signBack = makeBox(190, 56, 4, mats.marketGlow);
  signBack.position.set(x - 176, 75, z - 0.5);
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(170, 52), makeMarketSign());
  sign.position.set(x - 176, 77, z - 3.2);
  sign.rotation.y = Math.PI;
  sign.renderOrder = 8;
  parent.add(blueFacade, signBack, sign);

  const entryPad = makePlane(210, 96, mats.concrete, 0.24);
  entryPad.position.set(x - 176, 0.24, z - 52);
  entryPad.renderOrder = 3;
  parent.add(entryPad);

  const entryFrame = makeBox(126, 52, 5, mats.marketBlue);
  entryFrame.position.set(x - 176, 26, z - 2);
  parent.add(entryFrame);
  addSMarketEntranceGlow(parent, x - 176, z - 5);

  for (let i = 0; i < 12; i++) {
    const window = makeBox(22, 24, 1.4, mats.glass);
    window.position.set(x - 64 + i * 32, 24, z + 12);
    parent.add(window);
  }

  addParkingBayRow(parent, x - 16, z - 160, 13, 42, 62, 1);
  addParkingBayRow(parent, x - 16, z + 84, 13, 42, 62, -1);
  addDashedLaneLine(parent, x - 294, z - 88, x + 274, z - 88, 12);
  addDashedLaneLine(parent, x - 294, z + 48, x + 274, z + 48, 12);

  const hangout = makePlane(270, 112, mats.concrete, 0.26);
  hangout.position.set(x - 176, 0.26, z - 58);
  hangout.renderOrder = 2;
  parent.add(hangout);

  for (const [lx, lz] of [[x - 300, z - 130], [x + 250, z - 130], [x - 300, z + 28], [x + 250, z + 28]]) {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 56, 8), mats.pumpDark);
    pole.position.set(lx, 28, lz);
    const lamp = makeBox(22, 4, 10, mats.light);
    lamp.position.set(lx, 58, lz);
    parent.add(pole, lamp);
  }

  const cartShelterRoof = makeBox(72, 5, 34, mats.marketBlue);
  cartShelterRoof.position.set(x + 212, 18, z - 56);
  const cartShelterBase = makeBox(64, 2, 28, mats.concrete);
  cartShelterBase.position.set(x + 212, 1.2, z - 56);
  parent.add(cartShelterRoof, cartShelterBase);
  for (const sx of [-28, 28]) {
    for (const sz of [-12, 12]) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 17, 8), mats.curb);
      leg.position.set(x + 212 + sx, 8.5, z - 56 + sz);
      parent.add(leg);
    }
  }

  addSolidRect(parent, x + 42, z + 82, 440, 132, 4);
  addSolidRect(parent, x - 176, z + 76, 172, 140, 4);
  addSolidRect(parent, x + 338, z + 74, 190, 120, 4);
}

function addStoreCollider(x, z, w, d) {
  storeState.colliders.push({ x, z, w, d });
}

function addStoreBox(parent, x, z, w, h, d, material, solid = true) {
  const mesh = makeBox(w, h, d, material);
  mesh.position.set(x, h * 0.5, z);
  parent.add(mesh);
  if (solid) addStoreCollider(x, z, w, d);
  return mesh;
}

function makePerson() {
  const group = new THREE.Group();

  const hips = makeBox(17, 7, 10, mats.personBody);
  hips.position.set(0, 17, 0);
  const torso = makeBox(19, 23, 11, mats.personBody);
  torso.position.set(0, 30, 0);
  const neck = makeBox(7, 4, 6, mats.personHead);
  neck.position.set(0, 44, 0);
  const head = new THREE.Mesh(new THREE.SphereGeometry(7.2, 16, 12), mats.personHead);
  head.position.set(0, 52, 0);
  const hair = makeBox(13, 4, 11, mats.pumpDark);
  hair.position.set(0, 58, -1);

  function limb(w, h, d, material, foot = false) {
    const pivot = new THREE.Group();
    const mesh = makeBox(w, h, d, material);
    mesh.position.y = -h * 0.5;
    pivot.add(mesh);
    if (foot) {
      const shoe = makeBox(w + 1.5, 3, d + 5, mats.pumpDark);
      shoe.position.set(0, -h - 1.5, -2.5);
      pivot.add(shoe);
    }
    return pivot;
  }

  const leftArm = limb(5, 24, 5, mats.personHead);
  leftArm.position.set(-13, 40, 0);
  const rightArm = limb(5, 24, 5, mats.personHead);
  rightArm.position.set(13, 40, 0);
  const leftLeg = limb(6, 22, 6, mats.personBody, true);
  leftLeg.position.set(-5, 17, 0);
  const rightLeg = limb(6, 22, 6, mats.personBody, true);
  rightLeg.position.set(5, 17, 0);

  const face = makeBox(8, 3, 1.2, mats.glass);
  face.position.set(0, 52, -6.6);

  group.add(hips, torso, neck, head, hair, face, leftArm, rightArm, leftLeg, rightLeg);
  group.userData.leftArm = leftArm;
  group.userData.rightArm = rightArm;
  group.userData.leftLeg = leftLeg;
  group.userData.rightLeg = rightLeg;
  group.userData.head = head;
  return group;
}

function makeFirstPersonFist() {
  const group = new THREE.Group();
  group.visible = false;

  const sleeve = makeBox(8, 8, 18, mats.personBody);
  sleeve.position.set(0, 0, 8);
  const wrist = makeBox(6, 6, 6, mats.personHead);
  wrist.position.set(0, 0, -4);
  const fist = makeBox(10, 8, 9, mats.personHead);
  fist.position.set(0, 0, -12);
  const knuckles = makeBox(10, 2, 3, mats.pumpDark);
  knuckles.position.set(0, 3.8, -16);

  group.add(sleeve, wrist, fist, knuckles);
  group.position.set(17, -13, -36);
  group.rotation.set(-0.18, -0.28, 0.08);
  camera.add(group);
  return group;
}

function createSMarketInterior() {
  const group = new THREE.Group();
  group.visible = false;
  scene.add(group);
  storeState.group = group;
  storeState.colliders.length = 0;

  const floor = makePlane(760, 560, mats.storeFloor, 0.06);
  floor.position.set(6000, 0.06, 0);
  group.add(floor);

  addStoreBox(group, 6000, -286, 790, 58, 18, mats.storeWall);
  addStoreBox(group, 6000, 286, 790, 58, 18, mats.storeWall);
  addStoreBox(group, 5604, 0, 18, 58, 560, mats.storeWall);
  addStoreBox(group, 6396, 0, 18, 58, 560, mats.storeWall);

  const entranceMat = makeGlowMaterial(0x39ff72, 0.42);
  const innerEntry = makeBox(116, 42, 4, entranceMat);
  innerEntry.position.set(6000, 22, 278);
  group.add(innerEntry);
  glowingObjects.push(innerEntry);

  for (const z of [-120, 30]) {
    for (const x of [5795, 5925, 6055, 6185]) {
      addStoreBox(group, x, z, 72, 26, 86, mats.shelf);
      for (let i = 0; i < 5; i++) {
        const product = makeBox(10, 6, 12, i % 2 ? mats.productYellow : mats.productRed);
        product.position.set(x - 24 + i * 12, 31, z - 35);
        group.add(product);
        const product2 = makeBox(10, 6, 12, i % 2 ? mats.productRed : mats.productYellow);
        product2.position.set(x - 24 + i * 12, 31, z + 35);
        group.add(product2);
      }
      const shelfTop = makeBox(70, 2, 84, mats.marketBlue);
      shelfTop.position.set(x, 40, z);
      group.add(shelfTop);
    }
  }

  for (const x of [5705, 5765, 5825]) {
    addStoreBox(group, x, 175, 46, 22, 64, mats.cashier);
    const belt = makeBox(40, 3, 42, mats.pumpDark);
    belt.position.set(x, 25, 174);
    group.add(belt);
  }

  for (const x of [6255, 6315]) {
    addStoreBox(group, x, -160, 48, 48, 102, mats.glass);
    const handle = makeBox(2, 26, 3, mats.curb);
    handle.position.set(x - 15, 26, -211);
    group.add(handle);
  }

  const produceTable = addStoreBox(group, 6290, 88, 118, 18, 72, mats.field);
  produceTable.position.y = 9;
  for (let i = 0; i < 12; i++) {
    const fruit = new THREE.Mesh(new THREE.SphereGeometry(5, 10, 8), i % 3 ? mats.productRed : mats.productYellow);
    fruit.position.set(6242 + (i % 6) * 18, 23, 66 + Math.floor(i / 6) * 28);
    group.add(fruit);
  }

  const sign = makeBox(170, 18, 5, mats.marketBlue);
  sign.position.set(6000, 54, -274);
  group.add(sign);

  const exitRing = new THREE.Mesh(new THREE.RingGeometry(24, 40, 32), makeGlowMaterial(0x39ff72, 0.72));
  exitRing.rotation.x = -Math.PI / 2;
  exitRing.position.set(SMARKET_EXIT.x, 0.5, SMARKET_EXIT.z);
  const exitCore = new THREE.Mesh(new THREE.CircleGeometry(25, 32), makeGlowMaterial(0x39ff72, 0.24));
  exitCore.rotation.x = -Math.PI / 2;
  exitCore.position.set(SMARKET_EXIT.x, 0.51, SMARKET_EXIT.z);
  group.add(exitRing, exitCore);
  glowingObjects.push(exitRing, exitCore);

  const character = makePerson();
  character.position.set(storeState.x, 0, storeState.z);
  group.add(character);
  storeState.character = character;
  storeState.fist = makeFirstPersonFist();
}

function storeRectCollision(x, z, radius, rect) {
  const hx = rect.w * 0.5;
  const hz = rect.d * 0.5;
  const closestX = clamp(x, rect.x - hx, rect.x + hx);
  const closestZ = clamp(z, rect.z - hz, rect.z + hz);
  const dx = x - closestX;
  const dz = z - closestZ;
  const d = Math.hypot(dx, dz);
  if (d >= radius) return null;
  if (d > 0.001) return { nx: dx / d, nz: dz / d, overlap: radius - d };

  const left = Math.abs(x - (rect.x - hx));
  const right = Math.abs((rect.x + hx) - x);
  const top = Math.abs(z - (rect.z - hz));
  const bottom = Math.abs((rect.z + hz) - z);
  const min = Math.min(left, right, top, bottom);
  if (min === left) return { nx: -1, nz: 0, overlap: radius };
  if (min === right) return { nx: 1, nz: 0, overlap: radius };
  if (min === top) return { nx: 0, nz: -1, overlap: radius };
  return { nx: 0, nz: 1, overlap: radius };
}

function moveStoreCharacter(dt) {
  if (storeState.dead) return;
  const mouseLocked = document.pointerLockElement === canvas;
  const steerInput = inputState.mobile
    ? inputState.steer
    : mouseLocked
      ? 0
      : (keys.has("a") || keys.has("arrowleft") ? 1 : 0) + (keys.has("d") || keys.has("arrowright") ? -1 : 0);
  const moveInput = inputState.mobile
    ? inputState.throttle
    : (keys.has("w") || keys.has("arrowup") ? 1 : 0) + (keys.has("s") || keys.has("arrowdown") ? -1 : 0);

  const targetTurnVelocity = steerInput * 2.35;
  storeState.turnVelocity = lerp(storeState.turnVelocity, targetTurnVelocity, 1 - Math.exp(-dt * 8));
  storeState.angle += storeState.turnVelocity * dt;

  const walkSpeed = 138;
  const forwardX = Math.sin(storeState.angle);
  const forwardZ = Math.cos(storeState.angle);
  const moving = Math.abs(moveInput) > 0.05;
  if (moving) {
    storeState.x += forwardX * moveInput * walkSpeed * dt;
    storeState.z += forwardZ * moveInput * walkSpeed * dt;
    storeState.walkCycle += Math.abs(moveInput) * dt * 8.5;
  } else {
    storeState.walkCycle = lerp(storeState.walkCycle, Math.round(storeState.walkCycle / Math.PI) * Math.PI, 1 - Math.exp(-dt * 5));
  }

  const radius = 13;
  for (const rect of storeState.colliders) {
    const hit = storeRectCollision(storeState.x, storeState.z, radius, rect);
    if (!hit) continue;
    storeState.x += hit.nx * (hit.overlap + 0.4);
    storeState.z += hit.nz * (hit.overlap + 0.4);
  }

  storeState.x = clamp(storeState.x, 5628, 6372);
  storeState.z = clamp(storeState.z, -252, 318);
  storeState.character.position.set(storeState.x, 0, storeState.z);
  storeState.character.rotation.y = storeState.angle;
  animateStoreCharacter(dt, moving);

  if (Math.hypot(storeState.x - SMARKET_EXIT.x, storeState.z - SMARKET_EXIT.z) < SMARKET_EXIT.radius && !transitionLock) {
    enterDrivingMode();
  }
}

function animateStoreCharacter(dt, moving) {
  const character = storeState.character;
  if (!character) return;
  const t = storeState.walkCycle;
  const swing = moving ? Math.sin(t) * 0.72 : 0;
  const side = moving ? Math.sin(t * 2) * 0.05 : 0;
  const bounce = moving ? Math.abs(Math.sin(t)) * 1.8 : 0;
  const ease = 1 - Math.exp(-dt * 12);
  character.position.y = lerp(character.position.y, bounce, ease);
  character.userData.leftArm.rotation.x = lerp(character.userData.leftArm.rotation.x, swing, ease);
  character.userData.rightArm.rotation.x = lerp(character.userData.rightArm.rotation.x, -swing, ease);
  character.userData.leftLeg.rotation.x = lerp(character.userData.leftLeg.rotation.x, -swing * 0.82, ease);
  character.userData.rightLeg.rotation.x = lerp(character.userData.rightLeg.rotation.x, swing * 0.82, ease);
  character.userData.head.rotation.z = lerp(character.userData.head.rotation.z, side, ease);
}

function updateStorePunch(dt) {
  if (!storeState.fist) return;
  storeState.fist.visible = gameMode === "store" && !transitionLock && !storeState.dead;

  if (storeState.punchCharging) {
    storeState.punchCharge = Math.min(1, storeState.punchCharge + dt * 1.55);
  }
  storeState.punchTimer = Math.max(0, storeState.punchTimer - dt * 4.7);

  const windup = storeState.punchCharging ? storeState.punchCharge : 0;
  const strike = storeState.punchTimer > 0 ? Math.sin(storeState.punchTimer * Math.PI) : 0;
  const settle = 1 - Math.exp(-dt * 14);
  const wantedX = 17 - strike * 6;
  const wantedY = -13 + strike * 4;
  const wantedZ = -36 + windup * 22 - strike * (36 + storeState.lastPunchDamage * 0.16);
  storeState.fist.position.x = lerp(storeState.fist.position.x, wantedX, settle);
  storeState.fist.position.y = lerp(storeState.fist.position.y, wantedY, settle);
  storeState.fist.position.z = lerp(storeState.fist.position.z, wantedZ, settle);
  storeState.fist.rotation.x = lerp(storeState.fist.rotation.x, -0.18 - windup * 0.62 + strike * 0.42, settle);
  storeState.fist.rotation.y = lerp(storeState.fist.rotation.y, -0.28 + strike * 0.22, settle);
  storeState.fist.rotation.z = lerp(storeState.fist.rotation.z, 0.08 + windup * 0.18 - strike * 0.16, settle);

  storeState.damageTimer = Math.max(0, storeState.damageTimer - dt * 1.75);
  storeState.damageShake = Math.max(0, storeState.damageShake - dt * 4.4);
  damageFxEl.style.opacity = clamp(storeState.damageTimer, 0, 0.82).toFixed(2);
}

function startStorePunch(event) {
  if (event.button !== 0 || gameMode !== "store" || transitionLock || storeState.dead) return;
  if (!inputState.mobile && document.pointerLockElement !== canvas) requestStorePointerLock();
  storeState.punchCharging = true;
  storeState.punchCharge = 0;
  storeState.punchTimer = 0;
}

function releaseStorePunch(event) {
  if (event.button !== 0 || !storeState.punchCharging || storeState.dead) return;
  storeState.punchCharging = false;
  storeState.lastPunchDamage = Math.round(18 + storeState.punchCharge * 82);
  storeState.punchTimer = 1;
  cameraState.shake = Math.max(cameraState.shake, 0.08 + storeState.punchCharge * 0.24);
  const hit = findStorePunchTarget(storeState.lastPunchDamage);
  showNotification(hit ? `Hit ${hit.name} for ${storeState.lastPunchDamage}` : `Punch damage ${storeState.lastPunchDamage}`);
  sendStorePunch(hit ? hit.peerId : "");
  storeState.punchCharge = 0;
}

function findStorePunchTarget(damage) {
  const forwardX = Math.sin(storeState.angle);
  const forwardZ = Math.cos(storeState.angle);
  let best = null;
  for (const [peerId, remote] of remotePlayers) {
    const target = remote.storeTarget;
    if (!target || target.gameMode !== "store") continue;
    if (target.dead || target.hp <= 0) continue;
    const dx = target.x - storeState.x;
    const dz = target.z - storeState.z;
    const distance = Math.hypot(dx, dz);
    if (distance > 74 || distance < 0.001) continue;
    const dot = (dx / distance) * forwardX + (dz / distance) * forwardZ;
    if (dot < 0.48) continue;
    const score = dot * 100 - distance;
    if (!best || score > best.score) {
      best = { peerId, name: remote.playerName || "Driver", damage, score };
    }
  }
  return best;
}

function sendStorePunch(targetPeerId) {
  if (multiplayer.mode === "singleplayer") return;
  const message = {
    type: "event",
    event: "store-punch",
    attackerPeerId: multiplayer.peerId,
    attackerName: playerName,
    targetPeerId,
    damage: storeState.lastPunchDamage,
    x: storeState.x,
    z: storeState.z,
    angle: storeState.angle,
  };
  if (multiplayer.mode === "host") {
    broadcastNetworkMessage(message);
  } else {
    sendToConnection(multiplayer.hostConnection, message);
  }
}

function applyStorePunchEvent(message) {
  if (!message || message.attackerPeerId === multiplayer.peerId) return;
  if (gameMode !== "store") return;
  const attacker = message.attackerName || "Someone";
  const damage = clamp(Math.round(message.damage || 20), 1, 120);
  const targetedAtMe = message.targetPeerId && message.targetPeerId === multiplayer.peerId;
  let areaHit = false;
  if (!message.targetPeerId) {
    const dx = storeState.x - (message.x || 0);
    const dz = storeState.z - (message.z || 0);
    const distance = Math.hypot(dx, dz);
    if (distance < 64 && distance > 0.001) {
      const forwardX = Math.sin(message.angle || 0);
      const forwardZ = Math.cos(message.angle || 0);
      areaHit = ((dx / distance) * forwardX + (dz / distance) * forwardZ) > 0.52;
    }
  }

  if (targetedAtMe || areaHit) {
    applyStoreDamage(damage, attacker, message);
  }
}

function applyStoreDamage(damage, attacker, message = {}) {
  if (storeState.dead) return;
  storeState.hp = clamp(storeState.hp - damage, 0, 100);
  storeState.damageTimer = clamp(0.25 + damage / 115, 0.35, 0.95);
  storeState.damageShake = Math.max(storeState.damageShake, 0.8 + damage * 0.018);
  showNotification(`${attacker} hit you for ${damage}`, true);
  updateStoreHealthHud();
  if (storeState.hp <= 0) {
    killStorePlayer(attacker, message);
  }
}

function killStorePlayer(attacker, message = {}) {
  storeState.dead = true;
  storeState.punchCharging = false;
  storeState.punchCharge = 0;
  storeState.punchTimer = 0;
  if (storeState.fist) storeState.fist.visible = false;
  if (document.pointerLockElement === canvas) document.exitPointerLock();

  const awayX = storeState.x - (message.x || storeState.x - Math.sin(storeState.angle) * 20);
  const awayZ = storeState.z - (message.z || storeState.z - Math.cos(storeState.angle) * 20);
  const awayLen = Math.max(Math.hypot(awayX, awayZ), 0.001);
  storeState.deathVx = (awayX / awayLen) * 135;
  storeState.deathVz = (awayZ / awayLen) * 135;
  storeState.deathVy = 95;
  storeState.deathY = 0;
  storeState.deathRoll = 0;
  storeState.deathPitch = 0;
  storeState.deathSpin = 3.8;
  storeState.character.visible = true;
  showNotification(`${playerName} got knocked out by ${attacker}`, true);
}

function updateStoreDeath(dt) {
  if (!storeState.dead || !storeState.character) return;
  storeState.deathVy -= 360 * dt;
  storeState.deathY += storeState.deathVy * dt;
  storeState.x += storeState.deathVx * dt;
  storeState.z += storeState.deathVz * dt;
  storeState.deathVx *= Math.exp(-dt * 2.6);
  storeState.deathVz *= Math.exp(-dt * 2.6);
  storeState.deathRoll += storeState.deathSpin * dt;
  storeState.deathPitch = lerp(storeState.deathPitch, Math.PI * 0.5, 1 - Math.exp(-dt * 6));

  if (storeState.deathY <= 0) {
    storeState.deathY = 0;
    storeState.deathVy = 0;
    storeState.deathSpin = lerp(storeState.deathSpin, 0, 1 - Math.exp(-dt * 7));
    storeState.deathRoll = lerp(storeState.deathRoll, 0.18, 1 - Math.exp(-dt * 5));
  }

  storeState.x = clamp(storeState.x, 5628, 6372);
  storeState.z = clamp(storeState.z, -252, 318);
  storeState.character.visible = true;
  storeState.character.position.set(storeState.x, storeState.deathY, storeState.z);
  storeState.character.rotation.set(storeState.deathPitch, storeState.angle, storeState.deathRoll);
}

function updateStoreHealthHud() {
  const visible = gameMode === "store";
  storeHealthEl.classList.toggle("hidden", !visible);
  if (!visible) return;
  const hp = clamp(storeState.hp, 0, 100);
  storeHealthFillEl.style.width = `${hp}%`;
  storeHealthFillEl.style.background = hp < 28
    ? "linear-gradient(90deg, #d50019, #ff6a4d)"
    : hp < 58
      ? "linear-gradient(90deg, #ffb000, #fff052)"
      : "linear-gradient(90deg, #2dff64, #e9ff52)";
}

function updateStoreCamera(dt) {
  if (storeState.dead) {
    const desired = new THREE.Vector3(storeState.x - 34, 98, storeState.z + 124);
    const target = new THREE.Vector3(storeState.x, 12, storeState.z);
    cameraState.position.lerp(desired, 1 - Math.exp(-dt * 5.2));
    cameraState.target.lerp(target, 1 - Math.exp(-dt * 6.5));
    camera.position.copy(cameraState.position);
    if (storeState.damageShake > 0) {
      const hitShake = storeState.damageShake;
      const pulse = performance.now() * 0.045;
      camera.position.x += Math.sin(pulse) * hitShake;
      camera.position.y += Math.cos(pulse * 1.2) * hitShake * 0.45;
    }
    camera.lookAt(cameraState.target);
    camera.fov = lerp(camera.fov, 58, 1 - Math.exp(-dt * 5));
    camera.updateProjectionMatrix();
    return;
  }

  const bob = Math.abs(Math.sin(storeState.walkCycle)) * 1.6;
  const pitch = clamp(storeState.pitch, -0.58, 0.52);
  const forwardX = Math.sin(storeState.angle);
  const forwardZ = Math.cos(storeState.angle);
  const flatAim = Math.cos(pitch) * 95;
  const desired = new THREE.Vector3(storeState.x, 43 + bob, storeState.z);
  const target = new THREE.Vector3(
    storeState.x + forwardX * flatAim,
    43 + bob + Math.sin(pitch) * 95,
    storeState.z + forwardZ * flatAim
  );
  cameraState.position.lerp(desired, 1 - Math.exp(-dt * 16));
  cameraState.target.lerp(target, 1 - Math.exp(-dt * 13));
  camera.position.copy(cameraState.position);
  if (storeState.punchTimer > 0) {
    const kick = Math.sin(storeState.punchTimer * Math.PI) * (0.35 + storeState.lastPunchDamage * 0.006);
    camera.position.x += Math.sin(performance.now() * 0.04) * kick;
    camera.position.y += kick * 0.4;
  }
  if (storeState.damageShake > 0) {
    const hitShake = storeState.damageShake;
    const pulse = performance.now() * 0.045;
    camera.position.x += Math.sin(pulse) * hitShake;
    camera.position.y += Math.cos(pulse * 1.2) * hitShake * 0.45;
  }
  camera.lookAt(cameraState.target);
  camera.fov = lerp(camera.fov, 66, 1 - Math.exp(-dt * 5));
  camera.updateProjectionMatrix();
}

function setTransition(active) {
  transitionFadeEl.classList.toggle("active", active);
}

function enterStoreMode() {
  if (transitionLock || gameMode !== "driving") return;
  transitionLock = true;
  setTransition(true);
  window.setTimeout(() => {
    gameMode = "store";
    world.visible = false;
    player.group.visible = false;
    storeState.group.visible = true;
    minimapEl.classList.add("hidden");
    storeState.x = 6000;
    storeState.z = 220;
    storeState.angle = Math.PI;
    storeState.pitch = 0;
    storeState.turnVelocity = 0;
    storeState.walkCycle = 0;
    storeState.punchCharging = false;
    storeState.punchCharge = 0;
    storeState.punchTimer = 0;
    storeState.lastPunchDamage = 0;
    storeState.damageTimer = 0;
    storeState.damageShake = 0;
    storeState.hp = 100;
    storeState.dead = false;
    storeState.deathY = 0;
    storeState.deathVy = 0;
    storeState.deathVx = 0;
    storeState.deathVz = 0;
    storeState.deathRoll = 0;
    storeState.deathPitch = 0;
    storeState.deathSpin = 0;
    damageFxEl.style.opacity = "0";
    storeState.character.position.set(storeState.x, 0, storeState.z);
    storeState.character.rotation.set(0, storeState.angle, 0);
    storeState.character.visible = false;
    cameraState.position.set(storeState.x, 43, storeState.z);
    cameraState.target.set(storeState.x, 39, storeState.z - 95);
    hintEl.textContent = inputState.mobile ? "Joystick walk + turn | green exit" : "Click to lock mouse | W/S walk";
    updateStoreHealthHud();
    arrestFx.style.opacity = "0";
    window.setTimeout(() => {
      setTransition(false);
      transitionLock = false;
    }, 260);
  }, 420);
}

function enterDrivingMode() {
  if (transitionLock || gameMode !== "store") return;
  transitionLock = true;
  setTransition(true);
  if (document.pointerLockElement === canvas) document.exitPointerLock();
  window.setTimeout(() => {
    gameMode = "driving";
    world.visible = true;
    player.group.visible = true;
    minimapEl.classList.remove("hidden");
    player.x = SMARKET_ENTRANCE.x;
    player.z = SMARKET_ENTRANCE.z - 70;
    player.vx = 0;
    player.vz = 0;
    player.angle = 0;
    syncVehicle(player);
    storeState.punchCharging = false;
    storeState.punchCharge = 0;
    storeState.punchTimer = 0;
    storeState.damageTimer = 0;
    storeState.damageShake = 0;
    damageFxEl.style.opacity = "0";
    updateStoreHealthHud();
    if (storeState.fist) storeState.fist.visible = false;
    storeState.character.visible = true;
    storeState.group.visible = false;
    cameraState.position.set(player.x, 210, player.z + 210);
    cameraState.target.set(player.x, 0, player.z - 28);
    hintEl.textContent = inputState.mobile ? "Joystick drive" : "W/S drive, A/D turn";
    window.setTimeout(() => {
      setTransition(false);
      transitionLock = false;
    }, 260);
  }, 420);
}

function requestStorePointerLock() {
  if (gameMode !== "store" || transitionLock || inputState.mobile) return;
  if (document.pointerLockElement !== canvas && canvas.requestPointerLock) {
    canvas.requestPointerLock();
  }
}

function updatePointerLockHint() {
  if (gameMode !== "store" || inputState.mobile) return;
  hintEl.textContent = document.pointerLockElement === canvas
    ? "Mouse look | W/S walk | Esc unlocks"
    : "Click to lock mouse | W/S walk";
}

function handleStoreMouseLook(event) {
  if (gameMode !== "store" || document.pointerLockElement !== canvas) return;
  storeState.angle -= event.movementX * 0.0027;
  storeState.pitch = clamp(storeState.pitch - event.movementY * 0.0021, -0.58, 0.52);
}

function updateGlows(dt) {
  const t = performance.now() * 0.004;
  for (let i = glowingObjects.length - 1; i >= 0; i--) {
    const mesh = glowingObjects[i];
    if (!mesh.parent) {
      glowingObjects.splice(i, 1);
      continue;
    }
    const pulse = 0.78 + Math.sin(t + i * 0.7) * 0.16;
    if (!mesh.userData.pulseOpacity) mesh.scale.setScalar(pulse);
    if (mesh.material && "opacity" in mesh.material) {
      mesh.material.opacity = clamp(0.22 + pulse * 0.42, 0.2, 0.78);
    }
  }
}

function checkSMarketEntrance() {
  if (transitionLock || gameMode !== "driving") return;
  if (Math.hypot(player.x - SMARKET_ENTRANCE.x, player.z - SMARKET_ENTRANCE.z) < SMARKET_ENTRANCE.radius) {
    enterStoreMode();
  }
}

function biomeForChunk(cx, cz) {
  const biomeRng = rngFor(Math.floor(cx / 3), Math.floor(cz / 3), 901);
  const roll = biomeRng();
  if (roll < 0.12) return "denseForest";
  if (roll < 0.32) return "sparseForest";
  if (roll < 0.55) return "field";
  if (roll < 0.62) return "playground";
  return "open";
}

function addFieldPatch(parent, x, z, w, d, rng) {
  const field = makePlane(w, d, mats.field, 0.03);
  field.position.set(x, 0.03, z);
  field.rotation.z = (rng() - 0.5) * 0.18;
  field.renderOrder = 0;
  parent.add(field);

  const stripeCount = Math.max(4, Math.floor(d / 18));
  for (let i = 0; i < stripeCount; i++) {
    const stripe = makePlane(w * 0.92, 1.4, mats.cropLine, 0.07);
    stripe.position.set(x, 0.07, z - d * 0.42 + i * (d * 0.84 / Math.max(1, stripeCount - 1)));
    stripe.rotation.z = field.rotation.z;
    stripe.renderOrder = 2;
    parent.add(stripe);
  }
}

function addPlayground(parent, x, z, rng) {
  const w = 142 + rng() * 30;
  const d = 92 + rng() * 24;
  const pitch = makePlane(w, d, mats.playground, 0.04);
  pitch.position.set(x, 0.04, z);
  pitch.rotation.z = (rng() - 0.5) * 0.22;
  pitch.renderOrder = 0;
  parent.add(pitch);

  const addLine = (lx, lz, lw, ld) => {
    const line = makePlane(lw, ld, mats.chalk, 0.09);
    line.position.set(x + lx, 0.09, z + lz);
    line.rotation.z = pitch.rotation.z;
    line.renderOrder = 3;
    parent.add(line);
  };
  addLine(0, -d * 0.5, w, 2.2);
  addLine(0, d * 0.5, w, 2.2);
  addLine(-w * 0.5, 0, 2.2, d);
  addLine(w * 0.5, 0, 2.2, d);
  addLine(0, 0, 2.2, d);
  const center = new THREE.Mesh(new THREE.RingGeometry(14, 16, 32), mats.chalk);
  center.rotation.x = -Math.PI / 2;
  center.rotation.z = pitch.rotation.z;
  center.position.set(x, 0.1, z);
  center.renderOrder = 3;
  parent.add(center);
}

function makeSpawnArea(parent) {
  const lot = makePlane(340, 250, mats.parking, 0.16);
  lot.position.set(0, 0.16, 48);
  lot.renderOrder = 1;
  parent.add(lot);

  addCurb(parent, -172, 48, 4, 250);
  addCurb(parent, 172, 48, 4, 250);
  addCurb(parent, 0, -79, 340, 4);
  addCurb(parent, 0, 175, 340, 4);

  addParkingBayRow(parent, -42, -58, 6, 34, 56, 1);
  addParkingBayRow(parent, 56, 154, 6, 34, 56, -1);
  addParkingBayRow(parent, -132, 24, 3, 34, 56, 1);
  addParkingBayRow(parent, 132, 78, 3, 34, 56, -1);
  addDashedLaneLine(parent, -148, 48, 148, 48, 7);
  addDashedLaneLine(parent, 0, -52, 0, 148, 5);

  const crosswalkZ = -58;
  for (let i = -4; i <= 4; i++) addParkingStripe(parent, i * 14, crosswalkZ, 9, 2.8);

  const stationPad = makePlane(300, 220, mats.concrete, 0.18);
  stationPad.position.set(338, 0.18, 50);
  stationPad.renderOrder = 1;
  parent.add(stationPad);

  addCurb(parent, 186, 50, 4, 220);
  addCurb(parent, 490, 50, 4, 220);
  addCurb(parent, 338, -62, 300, 4);
  addCurb(parent, 338, 162, 300, 4);

  const shop = makeBox(112, 42, 72, mats.stationWall);
  shop.position.set(414, 21, 103);
  const shopRoof = makeBox(132, 8, 90, mats.stationTrim);
  shopRoof.position.set(414, 46, 103);
  const shopGlass = makeBox(64, 20, 1.4, mats.glass);
  shopGlass.position.set(392, 19, 57);
  const shopDoor = makeBox(18, 24, 1.5, mats.pumpDark);
  shopDoor.position.set(432, 13, 56.8);
  const sign = makeBox(82, 12, 3, mats.pumpBlue);
  sign.position.set(414, 36, 56.5);
  parent.add(shop, shopRoof, shopGlass, shopDoor, sign);
  addSolidRect(parent, 414, 103, 112, 72, 4);

  const canopyRoof = makeBox(160, 7, 96, mats.stationTrim);
  canopyRoof.position.set(292, 41, 20);
  parent.add(canopyRoof);
  for (const sx of [222, 362]) {
    for (const sz of [-20, 60]) {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(2.3, 2.3, 39, 8), mats.curb);
      pole.position.set(sx, 18, sz);
      parent.add(pole);
    }
  }

  addPump(parent, 260, 20, mats.pumpBlue);
  addPump(parent, 324, 20, mats.pumpRed);
  addPump(parent, 260, 72, mats.pumpRed);
  addPump(parent, 324, 72, mats.pumpBlue);

  addParkingBayRow(parent, 410, -44, 3, 34, 54, 1);
  addParkingBayRow(parent, 410, 140, 3, 34, 54, -1);
  addDashedLaneLine(parent, 214, 104, 462, 104, 6);

  const priceSignPole = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.2, 42, 8), mats.pumpDark);
  priceSignPole.position.set(198, 21, 122);
  const priceSign = makeBox(34, 26, 4, mats.stationTrim);
  priceSign.position.set(198, 48, 122);
  parent.add(priceSignPole, priceSign);

  addSMarket(parent, -470, 42);
}

function generateChunk(cx, cz) {
  const key = `${cx},${cz}`;
  if (chunks.has(key)) return;

  const rng = rngFor(cx, cz);
  const baseX = cx * CHUNK;
  const baseZ = cz * CHUNK;
  const group = new THREE.Group();
  group.userData.chunkKey = key;
  group.userData.cx = cx;
  group.userData.cz = cz;
  world.add(group);
  chunks.set(key, group);

  const grass = makePlane(CHUNK, CHUNK, mats.grass, -0.08);
  grass.position.set(baseX, -0.08, baseZ);
  group.add(grass);

  addRoadsForChunk(cx, cz, baseX, baseZ, group);

  if (cx === 0 && cz === 0) {
    makeSpawnArea(group);
  }

  if (Math.abs(cx) <= 1 && Math.abs(cz) <= 1) return;

  const biome = biomeForChunk(cx, cz);
  const forestZone = biome === "denseForest";
  const openZone = biome === "open" || biome === "field" || biome === "playground";
  const reserved = [];
  if (biome === "field") {
    const w = 150 + rng() * 56;
    const d = 110 + rng() * 52;
    const spot = randomOffRoadSpot(baseX, baseZ, w * 0.5, d * 0.5, rng);
    if (spot && !areaTouchesRoad(spot.x, spot.z, w, d, 20)) {
      addFieldPatch(group, spot.x, spot.z, w, d, rng);
      reserved.push({ x: spot.x, z: spot.z, w, d });
    }
  } else if (biome === "playground") {
    const spot = randomOffRoadSpot(baseX, baseZ, 86, 60, rng);
    if (spot && !areaTouchesRoad(spot.x, spot.z, 172, 120, 22)) {
      addPlayground(group, spot.x, spot.z, rng);
      reserved.push({ x: spot.x, z: spot.z, w: 190, d: 138 });
    }
  }

  const special = rng() < 0.04;
  const shop = !special && rng() < 0.08;
  const buildingCount = forestZone ? (rng() < 0.04 ? 1 : 0) : special || shop ? 1 : openZone ? (rng() < 0.42 ? 1 : 0) : 1 + (rng() < 0.18 ? 1 : 0);
  const placed = [];
  for (let i = 0; i < buildingCount; i++) {
    const type = special && i === 0 ? "special" : shop && i === 0 ? "shop" : "house";
    const w = type === "special" ? 82 + rng() * 36 : type === "shop" ? 76 + rng() * 34 : 58 + rng() * 38;
    const d = type === "special" ? 78 + rng() * 38 : type === "shop" ? 68 + rng() * 30 : 54 + rng() * 36;
    const h = type === "special" ? 76 + rng() * 62 : type === "shop" ? 42 + rng() * 24 : 42 + rng() * 40;
    const spot = randomOffRoadSpot(baseX, baseZ, w * 0.5, d * 0.5, rng);
    if (!spot) continue;
    const x = spot.x;
    const z = spot.z;
    if (areaTouchesRoad(x, z, w, d, 12)) continue;
    if (reserved.some((p) => Math.abs(p.x - x) < (p.w + w) * 0.55 && Math.abs(p.z - z) < (p.d + d) * 0.55)) continue;
    if (placed.some((p) => Math.abs(p.x - x) < (p.w + w) * 0.65 && Math.abs(p.z - z) < (p.d + d) * 0.65)) continue;
    makeBuilding(x, z, w, d, h, type, rng, group);
    placed.push({ x, z, w, d });
  }

  const treeCount =
    biome === "denseForest" ? 11 + Math.floor(rng() * 12) :
    biome === "sparseForest" ? 4 + Math.floor(rng() * 6) :
    biome === "field" ? Math.floor(rng() * 3) :
    biome === "playground" ? Math.floor(rng() * 2) :
    rng() < 0.35 ? 1 + Math.floor(rng() * 3) : 0;
  for (let i = 0; i < treeCount; i++) {
    const scale = 0.95 + rng() * 1.05;
    const radius = 14 * scale;
    const spot = randomOffRoadSpot(baseX, baseZ, radius, radius, rng);
    if (!spot) continue;
    const x = spot.x;
    const z = spot.z;
    if (areaTouchesRoad(x, z, radius * 2, radius * 2, 10)) continue;
    if (reserved.some((p) => Math.abs(p.x - x) < p.w * 0.58 && Math.abs(p.z - z) < p.d * 0.58)) continue;
    if (placed.some((p) => Math.abs(p.x - x) < p.w * 0.7 && Math.abs(p.z - z) < p.d * 0.7)) continue;
    makeTree(x, z, scale, group);
  }
}

function disposeChunk(group) {
  group.traverse((obj) => {
    if (obj.geometry) obj.geometry.dispose();
  });
  world.remove(group);
}

function updateChunks() {
  const pcx = Math.round(player.x / CHUNK);
  const pcz = Math.round(player.z / CHUNK);
  for (let x = pcx - MAP_PRELOAD_RADIUS; x <= pcx + MAP_PRELOAD_RADIUS; x++) {
    for (let z = pcz - MAP_PRELOAD_RADIUS; z <= pcz + MAP_PRELOAD_RADIUS; z++) generateChunk(x, z);
  }

  for (const [key, chunk] of chunks) {
    const dx = Math.abs((chunk.userData.cx ?? 0) - pcx);
    const dz = Math.abs((chunk.userData.cz ?? 0) - pcz);
    if (dx <= MAP_KEEP_RADIUS && dz <= MAP_KEEP_RADIUS) continue;

    for (let i = colliders.length - 1; i >= 0; i--) {
      if (colliders[i].chunkKey === key) colliders.splice(i, 1);
    }
    for (let i = fallingTrees.length - 1; i >= 0; i--) {
      if (fallingTrees[i].tree.chunkKey === key) fallingTrees.splice(i, 1);
    }
    disposeChunk(chunk);
    chunks.delete(key);
  }
}

function closestPointOnVehicle(v, x, z) {
  const right = vehicleRight(v);
  const forward = vehicleForward(v);
  const dx = x - v.x;
  const dz = z - v.z;
  const localX = clamp(dx * right.x + dz * right.z, -(v.halfWidth || 12.8), v.halfWidth || 12.8);
  const localZ = clamp(dx * forward.x + dz * forward.z, -(v.halfLength || 24.2), v.halfLength || 24.2);
  return {
    x: v.x + right.x * localX + forward.x * localZ,
    z: v.z + right.z * localX + forward.z * localZ,
  };
}

function pushVehicleNormal(v, nx, nz, amount, damping) {
  v.x += nx * amount;
  v.z += nz * amount;
  const into = v.vx * -nx + v.vz * -nz;
  if (into > 0) {
    v.vx += nx * into * 1.1;
    v.vz += nz * into * 1.1;
  }
  v.vx *= damping;
  v.vz *= damping;
  if (v === player) cameraState.shake = Math.max(cameraState.shake, 0.65);
  syncVehicle(v);
}

function collideVehicleCircle(v, x, z, radius, damping) {
  const point = closestPointOnVehicle(v, x, z);
  let dx = point.x - x;
  let dz = point.z - z;
  let d = Math.hypot(dx, dz);
  if (d >= radius) return false;
  if (d < 0.001) {
    dx = v.x - x;
    dz = v.z - z;
    d = Math.hypot(dx, dz) || 1;
  }
  const nx = dx / d;
  const nz = dz / d;
  pushVehicleNormal(v, nx, nz, radius - d + 0.25, damping);
  return true;
}

function projectRectOnAxis(c, axis) {
  const center = c.x * axis.x + c.z * axis.z;
  const radius = Math.abs(axis.x) * (c.w * 0.5 + 4) + Math.abs(axis.z) * (c.d * 0.5 + 4);
  return { min: center - radius, max: center + radius };
}

function vehicleRectCollision(v, c) {
  const axes = [...vehicleCollisionAxes(v), { x: 1, z: 0 }, { x: 0, z: 1 }];
  let smallestOverlap = Infinity;
  let bestAxis = null;
  for (const axis of axes) {
    const pv = projectVehicleOnAxis(v, axis);
    const pr = projectRectOnAxis(c, axis);
    const overlap = Math.min(pv.max, pr.max) - Math.max(pv.min, pr.min);
    if (overlap <= 0) return null;
    if (overlap < smallestOverlap) {
      smallestOverlap = overlap;
      bestAxis = axis;
    }
  }

  let nx = bestAxis.x;
  let nz = bestAxis.z;
  if ((v.x - c.x) * nx + (v.z - c.z) * nz < 0) {
    nx = -nx;
    nz = -nz;
  }
  return { nx, nz, overlap: smallestOverlap };
}

function collideWorld(v) {
  for (const c of colliders) {
    if (c.disabled) continue;
    if (Math.hypot(v.x - c.x, v.z - c.z) > (c.r || 55) + 55) continue;
    if (c.type === "tree") {
      if (v !== player && v.escapeTimer > 0) continue;
      const speed = Math.hypot(v.vx, v.vz);
      if (v === player && !c.knocked && speed > 92 && collideVehicleCircle(v, c.x, c.z, c.r + 2, 0.68)) {
        knockTree(c, v.x, v.z, speed);
        c.disabled = true;
        cameraState.shake = Math.max(cameraState.shake, 1.35);
        continue;
      }
      collideVehicleCircle(v, c.x, c.z, c.r + 1.2, 0.42);
    } else {
      const before = Math.hypot(v.vx, v.vz);
      const hit = vehicleRectCollision(v, c);
      if (hit) pushVehicleNormal(v, hit.nx, hit.nz, hit.overlap + 0.3, v === player && before > 115 ? 0.58 : 0.34);
      if (hit && v === player && before > 115 && performance.now() > (player.nextCrashFx || 0)) {
        player.nextCrashFx = performance.now() + 450;
        hardCrashFx(v.x - hit.nx * (v.halfWidth || 12.8), v.z - hit.nz * (v.halfLength || 24.2), before);
      }
    }
  }
}

function pushCircle(v, x, z, minDistance, damping) {
  const dx = v.x - x;
  const dz = v.z - z;
  const d = Math.hypot(dx, dz);
  if (d >= minDistance) return false;
  const nx = dx / Math.max(d, 0.001);
  const nz = dz / Math.max(d, 0.001);
  v.x += nx * (minDistance - d + 0.4);
  v.z += nz * (minDistance - d + 0.4);
  v.vx *= damping;
  v.vz *= damping;
  if (v === player) cameraState.shake = Math.max(cameraState.shake, 0.65);
  syncVehicle(v);
  return true;
}

function snapToRoad(v) {
  const gx = Math.round(v.x / CHUNK) * CHUNK;
  const gz = Math.round(v.z / CHUNK) * CHUNK;
  const useOwnLane = v.roadAxis && Number.isFinite(v.dir);
  if (useOwnLane) {
    const lane = laneCenterFor(v.roadAxis, v.dir, v.x, v.z);
    v.x = lane.x;
    v.z = lane.z;
  } else if (Math.abs(v.x - gx) < Math.abs(v.z - gz)) {
    v.x = gx + (Math.random() < 0.5 ? -LANE_OFFSET : LANE_OFFSET);
  } else {
    v.z = gz + (Math.random() < 0.5 ? -LANE_OFFSET : LANE_OFFSET);
  }
  syncVehicle(v);
}

function vehicleForward(v) {
  return { x: -Math.sin(v.angle), z: -Math.cos(v.angle) };
}

function vehicleRight(v) {
  return { x: Math.cos(v.angle), z: -Math.sin(v.angle) };
}

function vehicleSpeed(v) {
  return Math.hypot(v.vx, v.vz);
}

function findBlockingVehicle(v, range = 118, laneWidth = 34) {
  const forward = vehicleForward(v);
  const right = vehicleRight(v);
  let best = null;
  let bestAhead = Infinity;
  const candidates = [player, ...remotePlayers.values(), ...traffic, ...cops];

  for (const other of candidates) {
    if (other === v || other.airborne) continue;
    const dx = other.x - v.x;
    const dz = other.z - v.z;
    const ahead = dx * forward.x + dz * forward.z;
    if (ahead <= 0 || ahead > range) continue;

    const side = dx * right.x + dz * right.z;
    const sameLane = Math.abs(side) < laneWidth;
    const crossingClose = ahead < 58 && Math.abs(side) < laneWidth + 12;
    if ((sameLane || crossingClose) && ahead < bestAhead) {
      bestAhead = ahead;
      best = { other, ahead, side };
    }
  }

  return best;
}

function trafficAvoidance(v, baseSteer, baseThrottle) {
  const blocker = findBlockingVehicle(v, v.kind === "grandma" ? 95 : 126, ROAD * 0.42);
  if (!blocker) return { steer: baseSteer, throttle: baseThrottle };

  const mySpeed = vehicleSpeed(v);
  const otherSpeed = vehicleSpeed(blocker.other);
  const closingFast = mySpeed > otherSpeed + 12;
  const panic = blocker.ahead < 48 || closingFast;
  const patience = v.kind === "drunk" ? 0.55 : v.kind === "grandma" ? 1.25 : 1;
  const avoidSide = blocker.side >= 0 ? -1 : 1;
  const steer = clamp(baseSteer + avoidSide * (panic ? 0.72 : 0.34), -1, 1);
  const throttle =
    blocker.ahead < 38 ? -0.35 * patience :
    blocker.ahead < 70 ? 0.04 :
    Math.min(baseThrottle, 0.38);

  return { steer, throttle };
}

function beginEscapeManeuver(v, blocker = null, duration = 3.4) {
  if (v === player || v.airborne || v.wrecked) return;
  const now = performance.now();
  if (v.escapeTimer > 0) {
    v.escapeTimer = Math.max(v.escapeTimer, duration * 0.55);
    return;
  }
  if (now < (v.escapeCooldown || 0)) return;

  v.escapeSide = blocker ? (blocker.side >= 0 ? -1 : 1) : (v.escapeSide || (Math.random() < 0.5 ? -1 : 1));
  v.escapeTimer = duration + Math.random() * 0.9;
  v.reverseTimer = 0.22 + Math.random() * 0.18;
  v.escapeCooldown = now + 3200;
  v.jamTime = 0;
}

function escapeTargetFor(v, ahead = 115, sideDistance = ROAD * 0.9) {
  const lane = laneCenterFor(v.roadAxis, v.dir, v.x, v.z, v.roadId);
  if (v.roadAxis === "x") {
    return {
      x: v.x + v.dir * ahead,
      z: lane.z + v.escapeSide * sideDistance,
    };
  }

  return {
    x: lane.x + v.escapeSide * sideDistance,
    z: v.z + v.dir * ahead,
  };
}

function steerTowardPoint(v, target, turnAggression = 2) {
  const desired = Math.atan2(-(target.x - v.x), -(target.z - v.z));
  return clamp(angleDelta(v.angle, desired) * turnAggression, -1, 1);
}

function isHiddenSpawnPoint(x, z, minDistance) {
  const dx = x - player.x;
  const dz = z - player.z;
  const distance = Math.hypot(dx, dz);
  if (distance < minDistance) return false;

  const forward = vehicleForward(player);
  const right = vehicleRight(player);
  const ahead = dx * forward.x + dz * forward.z;
  const side = dx * right.x + dz * right.z;

  if (ahead > -180 && ahead < 1120 && Math.abs(side) < 620) return false;
  if (distance < 760) return false;
  return true;
}

function chooseRoadSpawn(distanceMin, distanceMax) {
  const axis = Math.random() < 0.7 ? "z" : "x";
  const dir = Math.random() < 0.5 ? -1 : 1;
  const ahead = (distanceMin + Math.random() * (distanceMax - distanceMin)) * (Math.random() < 0.5 ? -1 : 1);

  if (axis === "x") {
    let id = nearestRoadIdForAxis("x", player.x, player.z);
    if (Math.random() < 0.55) id += Math.floor(Math.random() * 3) - 1;
    while (!sideRoadExists(id)) id += id < nearestRoadIdForAxis("x", player.x, player.z) ? 1 : -1;
    const x = player.x + ahead;
    const z = roadCenterZ(id, x);
    const lane = laneCenterFor("x", dir, x, z, id);
    return { axis, id, dir, x: lane.x, z: lane.z, angle: trafficAngle("x", dir, lane.x, lane.z, id) };
  }

  let id = nearestRoadIdForAxis("z", player.x, player.z);
  if (Math.random() < 0.55) id += Math.floor(Math.random() * 3) - 1;
  while (!mainRoadExists(id)) id += id < nearestRoadIdForAxis("z", player.x, player.z) ? 1 : -1;
  const z = player.z + ahead;
  const x = roadCenterX(id, z);
  const lane = laneCenterFor("z", dir, x, z, id);
  return { axis, id, dir, x: lane.x, z: lane.z, angle: trafficAngle("z", dir, lane.x, lane.z, id) };
}

function chooseHiddenRoadSpawn(distanceMin, distanceMax, tries = 24) {
  for (let i = 0; i < tries; i++) {
    const spawn = chooseRoadSpawn(distanceMin, distanceMax);
    if (isHiddenSpawnPoint(spawn.x, spawn.z, distanceMin)) return spawn;
  }
  return chooseRoadSpawn(distanceMax, distanceMax + 420);
}

function spawnCop() {
  const spawn = chooseHiddenRoadSpawn(COP_SPAWN_MIN, COP_SPAWN_MAX);
  const cop = makeVehicle("cop", spawn.x, spawn.z, spawn.angle);
  cop.roadAxis = spawn.axis;
  cop.roadId = spawn.id;
  cop.dir = spawn.dir;
  cop.personality = Math.random() < 0.42 ? "aggressive" : Math.random() < 0.55 ? "calm" : "blocker";
  scene.add(cop.group);
  cops.push(cop);
}

function spawnTraffic() {
  for (let attempt = 0; attempt < 10; attempt++) {
    const spawn = chooseHiddenRoadSpawn(TRAFFIC_SPAWN_MIN, TRAFFIC_SPAWN_MAX);
    const kind = Math.random() < 0.22 ? "grandma" : Math.random() < 0.36 ? "drunk" : "normal";
    const car = makeVehicle(kind, spawn.x, spawn.z, spawn.angle);
    car.roadAxis = spawn.axis;
    car.roadId = spawn.id;
    car.dir = spawn.dir;

    const clear = traffic.every((other) => dist(car, other) > 76) && cops.every((other) => dist(car, other) > 92) && isHiddenSpawnPoint(car.x, car.z, TRAFFIC_SPAWN_MIN);
    if (!clear) {
      continue;
    }

    syncVehicle(car);
    scene.add(car.group);
    traffic.push(car);
    return true;
  }
  return false;
}

function makeSmoke(x, z, size = 4, color = 0xd8d2ca, life = 0.55) {
  const mesh = new THREE.Mesh(effectGeometry.dust, new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.18, depthWrite: false, side: THREE.DoubleSide }));
  mesh.position.set(x, 0.72 + Math.random() * 0.8, z);
  mesh.rotation.x = -Math.PI / 2;
  mesh.rotation.z = Math.random() * Math.PI * 2;
  mesh.scale.setScalar(size);
  mesh.renderOrder = 5;
  scene.add(mesh);
  smoke.push({ mesh, life, startLife: life, size, grow: 7 + Math.random() * 5, rise: 1.1 + Math.random() * 1.8 });
}

function rearWheelSpots(v, rearOffset = 17, sideOffset = 10.5) {
  const fx = -Math.sin(v.angle);
  const fz = -Math.cos(v.angle);
  const rx = Math.cos(v.angle);
  const rz = -Math.sin(v.angle);
  return [-1, 1].map((side) => ({
    x: v.x - fx * rearOffset + rx * side * sideOffset,
    z: v.z - fz * rearOffset + rz * side * sideOffset,
    fx,
    fz,
    rx,
    rz,
    side,
  }));
}

function makeTireSpray(v, intensity, onRoad) {
  const color = onRoad ? 0xcac5b8 : 0x8b7448;
  const gritColor = onRoad ? 0x3a3933 : 0x6f5a34;
  const speed = vehicleSpeed(v);
  const count = Math.ceil(1 + intensity * 5);

  for (const spot of rearWheelSpots(v)) {
    if (Math.random() < 0.85) {
      makeSmoke(
        spot.x + (Math.random() - 0.5) * 3,
        spot.z + (Math.random() - 0.5) * 3,
        1.15 + intensity * (onRoad ? 2.3 : 3.2),
        color,
        0.32 + intensity * 0.28
      );
    }

    for (let i = 0; i < count; i++) {
      const size = 0.6 + Math.random() * (onRoad ? 0.9 : 1.5);
      const mesh = new THREE.Mesh(effectGeometry.grit, new THREE.MeshBasicMaterial({ color: gritColor, transparent: true, opacity: 0.75, depthWrite: false }));
      const sideKick = spot.side * (10 + Math.random() * 26) * intensity;
      const backKick = 18 + speed * 0.18 + Math.random() * 22;
      mesh.scale.set(size, size * 0.55, size * 1.3);
      mesh.position.set(spot.x, 1.2 + Math.random() * 1.8, spot.z);
      mesh.rotation.y = v.angle + (Math.random() - 0.5) * 0.8;
      scene.add(mesh);
      tireParticles.push({
        mesh,
        vx: spot.fx * -backKick + spot.rx * sideKick + (Math.random() - 0.5) * 16,
        vz: spot.fz * -backKick + spot.rz * sideKick + (Math.random() - 0.5) * 16,
        vy: 8 + Math.random() * 14 + intensity * 10,
        life: 0.45 + Math.random() * 0.28,
        startLife: 0.65,
      });
    }
  }

  while (tireParticles.length > 110) {
    const old = tireParticles.shift();
    scene.remove(old.mesh);
    old.mesh.material.dispose();
  }
}

function makeImpactSparks(x, z, power) {
  const count = 6 + Math.floor(clamp(power / 24, 0, 10));
  for (let i = 0; i < count; i++) {
    const size = 0.55 + Math.random() * 0.9;
    const mesh = new THREE.Mesh(
      effectGeometry.grit,
      new THREE.MeshBasicMaterial({ color: Math.random() < 0.55 ? 0xffd35a : 0xff7b35, transparent: true, opacity: 0.9, depthWrite: false })
    );
    const angle = Math.random() * Math.PI * 2;
    const speed = 28 + Math.random() * (34 + power * 0.22);
    mesh.scale.set(size * 0.7, size * 0.35, size * 2.8);
    mesh.position.set(x + (Math.random() - 0.5) * 7, 3 + Math.random() * 3, z + (Math.random() - 0.5) * 7);
    mesh.rotation.y = angle;
    scene.add(mesh);
    tireParticles.push({
      mesh,
      vx: Math.sin(angle) * speed,
      vz: Math.cos(angle) * speed,
      vy: 14 + Math.random() * 18,
      life: 0.22 + Math.random() * 0.18,
      startLife: 0.4,
    });
  }
}

function makeSkidMarks(v, intensity) {
  for (const spot of rearWheelSpots(v, 18, 10.6)) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(2.4 + intensity * 1.2, 0.06, 15 + intensity * 17), mats.skid.clone());
    mesh.material.opacity = 0.16 + intensity * 0.34;
    mesh.position.set(spot.x, 0.36, spot.z);
    mesh.rotation.y = v.angle;
    mesh.renderOrder = 3;
    scene.add(mesh);
    skidMarks.push({ mesh, life: 3.8, startLife: 3.8 });
  }

  while (skidMarks.length > 72) {
    const old = skidMarks.shift();
    scene.remove(old.mesh);
    old.mesh.geometry.dispose();
    old.mesh.material.dispose();
  }
}

function makeSpeedLines(v, intensity) {
  const fx = -Math.sin(v.angle);
  const fz = -Math.cos(v.angle);
  const rx = Math.cos(v.angle);
  const rz = -Math.sin(v.angle);
  for (const side of [-1, 1]) {
    const behind = 34 + Math.random() * 32;
    const offset = side * (24 + Math.random() * 18);
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.08, 28 + intensity * 30), mats.speedLine.clone());
    mesh.material.opacity = 0.22 + intensity * 0.34;
    mesh.position.set(v.x - fx * behind + rx * offset, 0.55, v.z - fz * behind + rz * offset);
    mesh.rotation.y = v.angle;
    mesh.renderOrder = 4;
    scene.add(mesh);
    speedLines.push({ mesh, life: 0.22, startLife: 0.22 });
  }
}

function makeDebrisBurst(x, z, count, power, color = 0x2b2b2b) {
  for (let i = 0; i < count; i++) {
    const size = 1.5 + Math.random() * 3.8;
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(size, size, size), new THREE.MeshLambertMaterial({ color }));
    const angle = Math.random() * Math.PI * 2;
    const speed = power * (0.35 + Math.random() * 0.8);
    mesh.position.set(x + (Math.random() - 0.5) * 10, 4 + Math.random() * 8, z + (Math.random() - 0.5) * 10);
    mesh.castShadow = true;
    scene.add(mesh);
    debris.push({
      mesh,
      vx: Math.sin(angle) * speed,
      vz: Math.cos(angle) * speed,
      vy: 35 + Math.random() * power * 0.55,
      rx: (Math.random() - 0.5) * 8,
      ry: (Math.random() - 0.5) * 8,
      rz: (Math.random() - 0.5) * 8,
      life: 1.5 + Math.random() * 1.2,
      startLife: 2.3,
    });
  }
}

function hardCrashFx(x, z, power) {
  const intensity = clamp(power / 210, 0.35, 1.4);
  for (let i = 0; i < 5 + intensity * 5; i++) {
    makeSmoke(x + (Math.random() - 0.5) * 12, z + (Math.random() - 0.5) * 12, 2.4 + intensity * 3.1, 0xc8c2b7, 0.42 + intensity * 0.2);
  }
  makeImpactSparks(x, z, power);
  cameraState.shake = Math.max(cameraState.shake, 1.2 + intensity * 1.1);
}

function knockTree(tree, hitX, hitZ, power) {
  if (tree.knocked) return;
  tree.knocked = true;
  tree.r = 4;
  const dx = tree.x - hitX;
  const dz = tree.z - hitZ;
  const fallAngle = Math.atan2(dx, dz);
  fallingTrees.push({
    tree,
    fallAngle,
    fall: 0,
    speed: 1.7 + clamp(power / 160, 0, 1.4),
    life: 5,
    broken: false,
  });
  makeDebrisBurst(tree.x, tree.z, 8, 42 + power * 0.18, 0x6b4a2c);
  makeSmoke(tree.x, tree.z, 5.5, 0x9b8a66, 0.75);
}

function launchVehicle(v, dirX, dirZ, power) {
  if (v.kind === "player" || v.kind === "cop" || v.kind === "remote") return;
  const now = performance.now();
  if (v.airborne || now < (v.nextLaunchTime || 0)) return;
  v.nextLaunchTime = now + 1100;
  const impulse = clamp(power, 90, 260);
  v.airborne = true;
  v.wrecked = true;
  v.y = Math.max(v.y || 0, 4);
  v.vx += dirX * impulse * 0.82;
  v.vz += dirZ * impulse * 0.82;
  v.vy = 55 + impulse * 0.28;
  v.roll = v.roll || 0;
  v.pitch = v.pitch || 0;
  v.rollVel = (Math.random() - 0.5) * 8 + dirX * 2;
  v.pitchVel = (Math.random() - 0.5) * 8 + dirZ * 2;
  v.spinVel = (Math.random() - 0.5) * 5;
  v.wreckLife = 4.5;
  hardCrashFx(v.x, v.z, power);
}

function updateDriveEffects(dt) {
  for (let i = smoke.length - 1; i >= 0; i--) {
    const p = smoke[i];
    p.life -= dt;
    p.size += dt * (p.grow || 4);
    p.mesh.scale.set(p.size * 1.25, p.size * 0.82, 1);
    p.mesh.position.y += dt * (p.rise || 2);
    p.mesh.material.opacity = Math.max(0, (p.life / p.startLife) * 0.2);
    if (p.life <= 0) {
      scene.remove(p.mesh);
      p.mesh.material.dispose();
      smoke.splice(i, 1);
    }
  }

  for (let i = skidMarks.length - 1; i >= 0; i--) {
    const mark = skidMarks[i];
    mark.life -= dt;
    mark.mesh.material.opacity = Math.max(0, (mark.life / mark.startLife) * 0.34);
    if (mark.life <= 0) {
      scene.remove(mark.mesh);
      mark.mesh.geometry.dispose();
      mark.mesh.material.dispose();
      skidMarks.splice(i, 1);
    }
  }

  for (let i = speedLines.length - 1; i >= 0; i--) {
    const line = speedLines[i];
    line.life -= dt;
    line.mesh.position.y += dt * 1.6;
    line.mesh.material.opacity = Math.max(0, (line.life / line.startLife) * 0.48);
    if (line.life <= 0) {
      scene.remove(line.mesh);
      line.mesh.geometry.dispose();
      line.mesh.material.dispose();
      speedLines.splice(i, 1);
    }
  }

  for (let i = tireParticles.length - 1; i >= 0; i--) {
    const p = tireParticles[i];
    p.life -= dt;
    p.vy -= 42 * dt;
    p.mesh.position.x += p.vx * dt;
    p.mesh.position.y = Math.max(0.45, p.mesh.position.y + p.vy * dt);
    p.mesh.position.z += p.vz * dt;
    p.mesh.rotation.x += dt * 8;
    p.mesh.rotation.z += dt * 10;
    p.vx *= Math.pow(0.86, dt * 60);
    p.vz *= Math.pow(0.86, dt * 60);
    p.mesh.material.opacity = Math.max(0, (p.life / p.startLife) * 0.75);
    if (p.life <= 0) {
      scene.remove(p.mesh);
      p.mesh.material.dispose();
      tireParticles.splice(i, 1);
    }
  }

  for (let i = debris.length - 1; i >= 0; i--) {
    const part = debris[i];
    part.life -= dt;
    part.vy -= 92 * dt;
    part.mesh.position.x += part.vx * dt;
    part.mesh.position.y += part.vy * dt;
    part.mesh.position.z += part.vz * dt;
    part.mesh.rotation.x += part.rx * dt;
    part.mesh.rotation.y += part.ry * dt;
    part.mesh.rotation.z += part.rz * dt;
    if (part.mesh.position.y < 1) {
      part.mesh.position.y = 1;
      part.vy *= -0.18;
      part.vx *= 0.72;
      part.vz *= 0.72;
    }
    if (part.life <= 0) {
      scene.remove(part.mesh);
      part.mesh.geometry.dispose();
      part.mesh.material.dispose();
      debris.splice(i, 1);
    }
  }

  for (let i = fallingTrees.length - 1; i >= 0; i--) {
    const item = fallingTrees[i];
    item.life -= dt;
    item.fall = Math.min(Math.PI * 0.5, item.fall + item.speed * dt);
    item.tree.group.rotation.x = Math.sin(item.fall) * Math.sin(item.fallAngle) * 1.35;
    item.tree.group.rotation.z = -Math.sin(item.fall) * Math.cos(item.fallAngle) * 1.35;
    item.tree.group.position.y = -Math.sin(item.fall) * 3;

    if (!item.broken && item.fall >= Math.PI * 0.48) {
      item.broken = true;
      if (item.tree.group.children[1]) item.tree.group.children[1].scale.setScalar(0.62);
      if (item.tree.group.children[2]) item.tree.group.children[2].visible = false;
      makeDebrisBurst(item.tree.x, item.tree.z, 10, 45, 0x1f7435);
      makeDebrisBurst(item.tree.x, item.tree.z, 5, 35, 0x6b4a2c);
      makeSmoke(item.tree.x, item.tree.z, 4.5, 0x8a7a58, 0.65);
    }

    if (item.life <= 0) fallingTrees.splice(i, 1);
  }
}

function updatePlayer(dt) {
  const steer = inputState.mobile
    ? inputState.steer
    : (keys.has("a") || keys.has("arrowleft") ? 1 : 0) + (keys.has("d") || keys.has("arrowright") ? -1 : 0);
  const throttle = inputState.mobile
    ? inputState.throttle
    : (keys.has("w") || keys.has("arrowup") ? 1 : 0) + (keys.has("s") || keys.has("arrowdown") ? -1 : 0);
  const surface = playerSurfaceTuning();
  const motion = driveVehicle(player, { steer, throttle }, dt, surface.tune);
  collideWorld(player);

  if (motion.total > 95) money += (motion.total - 90) * dt * (surface.onRoad ? 0.18 : 0.11);

  const driftAmount = Math.abs(motion.side);
  const driftTrigger = motion.slip > 0.08 || driftAmount > (surface.onRoad ? 16 : 10);
  if (motion.total > 48 && driftTrigger) {
    const intensity = clamp(Math.max((driftAmount - 10) / 54, motion.slip * 1.35), 0, 1);
    money += driftAmount * dt * (surface.onRoad ? 0.42 : 0.24);
    if (Math.random() < (surface.onRoad ? 0.82 : 0.98)) makeTireSpray(player, 0.55 + intensity * 0.9, surface.onRoad);
    if (Math.random() < (surface.onRoad ? 0.32 : 0.54)) makeSmoke(player.x + Math.sin(player.angle) * 16, player.z + Math.cos(player.angle) * 16, 2.2 + intensity * 1.7, surface.onRoad ? 0xd0d0d0 : 0xbba36f, 0.34 + intensity * 0.18);
    if (surface.onRoad && Math.random() < 0.82) makeSkidMarks(player, intensity);
  } else if (throttle > 0 && motion.total > 18 && Math.random() < (surface.onRoad ? 0.16 : 0.36)) {
    const intensity = clamp(motion.total / 135, 0.18, surface.onRoad ? 0.62 : 0.9);
    makeTireSpray(player, intensity, surface.onRoad);
  }

  moneyEl.textContent = "$" + Math.floor(money);
  hintEl.textContent = surface.onRoad ? "Road boost: speed + grip" : "Grass slows the car";

}

function updateTraffic(dt) {
  let spawnAttempts = 0;
  while (traffic.length < MAX_TRAFFIC && spawnAttempts < 8) {
    spawnAttempts++;
    if (!spawnTraffic()) break;
  }
  for (let i = traffic.length - 1; i >= 0; i--) {
    const car = traffic[i];
    if (dist(car, player) > TRAFFIC_DESPAWN_DISTANCE) {
      scene.remove(car.group);
      traffic.splice(i, 1);
      continue;
    }

    if (updateVehicleRagdoll(car, dt)) continue;

    car.timer += dt;
    const baseAngle = trafficAngle(car.roadAxis, car.dir, car.x, car.z, car.roadId);
    const wobble = car.kind === "drunk" ? Math.sin(car.timer * 2.7) * 0.18 : 0;
    const desired = baseAngle + wobble;
    const baseSteer = clamp(angleDelta(car.angle, desired) * 1.7, -1, 1);
    const avoidance = trafficAvoidance(car, baseSteer, 0.72);
    const blocker = findBlockingVehicle(car, car.kind === "grandma" ? 92 : 120, ROAD * 0.45);
    if (blocker && blocker.ahead < 68 && vehicleSpeed(car) < 24) car.jamTime += dt;
    else car.jamTime = Math.max(0, car.jamTime - dt * 1.8);
    if (car.jamTime > 0.7 && car.escapeTimer <= 0) beginEscapeManeuver(car, blocker, car.kind === "grandma" ? 3.8 : 3.2);

    let steer = avoidance.steer;
    let throttle = avoidance.throttle;
    let escaping = false;
    if (car.escapeTimer > 0) {
      car.escapeTimer -= dt;
      escaping = true;
      if (car.reverseTimer > 0 && blocker && blocker.ahead < 44) {
        car.reverseTimer -= dt;
        steer = -car.escapeSide * 0.45;
        throttle = -0.55;
      } else {
        const escapeTarget = escapeTargetFor(car, 120, ROAD * (car.kind === "grandma" ? 0.76 : 0.92));
        steer = steerTowardPoint(car, escapeTarget, car.kind === "drunk" ? 2.25 : 2.05);
        throttle = car.kind === "grandma" ? 0.62 : 0.86;
      }
    }

    const maxSpeed = car.kind === "grandma" ? 56 : car.kind === "drunk" ? 118 : 88;
    driveVehicle(car, { steer, throttle }, dt, {
      accel: escaping ? 96 : 92,
      brake: 180,
      reverseAccel: 35,
      maxSpeed: escaping ? Math.min(maxSpeed + 18, 96) : maxSpeed,
      reverseMax: 38,
      grip: escaping ? 3.15 : car.kind === "drunk" ? 2.3 : 5.6,
      coast: 65,
      turnRate: escaping ? 2.55 : car.kind === "drunk" ? 2.2 : 1.8,
    });
    const lane = laneCenterFor(car.roadAxis, car.dir, car.x, car.z, car.roadId);
    const lanePull = escaping ? 0.22 : car.kind === "drunk" ? 1.9 : throttle < 0.1 ? 2.6 : 5.8;
    car.x = lerp(car.x, lane.x, 1 - Math.exp(-dt * lanePull));
    car.z = lerp(car.z, lane.z, 1 - Math.exp(-dt * lanePull));
    if (!escaping && !isRoad(car.x, car.z)) snapToRoad(car);
    collideWorld(car);
    syncVehicle(car);
  }
}

function updateVehicleRagdoll(v, dt) {
  if (!v.airborne && !v.wrecked) return false;

  v.x += v.vx * dt;
  v.z += v.vz * dt;
  v.y = (v.y || 0) + (v.vy || 0) * dt;
  v.vy = (v.vy || 0) - 120 * dt;
  v.vx *= Math.pow(0.985, dt * 60);
  v.vz *= Math.pow(0.985, dt * 60);
  v.angle += (v.spinVel || 0) * dt;
  v.roll = (v.roll || 0) + (v.rollVel || 0) * dt;
  v.pitch = (v.pitch || 0) + (v.pitchVel || 0) * dt;

  if (v.y <= 0) {
    v.y = 0;
    if (v.airborne && Math.abs(v.vy || 0) > 35) {
      makeSmoke(v.x, v.z, 4.2, 0xc0bbb2, 0.5);
    }
    v.airborne = false;
    v.vy = 0;
    v.vx *= 0.82;
    v.vz *= 0.82;
    v.rollVel = (v.rollVel || 0) * 0.35;
    v.pitchVel = (v.pitchVel || 0) * 0.35;
    v.spinVel = (v.spinVel || 0) * 0.35;
  }

  v.wreckLife = (v.wreckLife ?? 3) - dt;
  if (v.wreckLife <= 0 && !v.airborne) {
    v.wrecked = false;
    v.roll = lerp(v.roll || 0, 0, 0.08);
    v.pitch = lerp(v.pitch || 0, 0, 0.08);
  }

  const tiltLift = Math.max(
    Math.abs(Math.sin(v.roll || 0)) * 8,
    Math.abs(Math.sin(v.pitch || 0)) * 18
  );
  const visualY = Math.max(v.y || 0, v.wrecked ? 3 + tiltLift : 0);
  v.group.position.set(v.x, visualY, v.z);
  v.group.rotation.set(v.pitch || 0, v.angle, v.roll || 0);
  return true;
}

function playerChaseTargets() {
  return [player, ...remotePlayers.values()].filter((target) => !target.airborne && !target.wrecked);
}

function nearestChaseTarget(from) {
  let best = player;
  let bestDistance = dist(from, player);
  for (const target of remotePlayers.values()) {
    const distance = dist(from, target);
    if (distance < bestDistance) {
      best = target;
      bestDistance = distance;
    }
  }
  return { target: best, distance: bestDistance };
}

function updatePoliceLights(dt) {
  for (const cop of cops) {
    const lights = cop.group.userData.policeLights;
    if (!lights) continue;
    cop.lightTimer = (cop.lightTimer || lights.phase || 0) + dt * 9.5;

    const bluePulse = Math.max(0, Math.sin(cop.lightTimer));
    const redPulse = Math.max(0, Math.sin(cop.lightTimer + Math.PI));
    const blueStrong = bluePulse > 0.42 ? 1 : 0.32;
    const redStrong = redPulse > 0.42 ? 1 : 0.32;

    lights.blueBeacon.material.color.setHex(blueStrong > 0.5 ? 0x3f7cff : 0x08194a);
    lights.redBeacon.material.color.setHex(redStrong > 0.5 ? 0xff2438 : 0x4a070d);
    lights.blueGlow.material.opacity = 0.05 + bluePulse * 0.3;
    lights.redGlow.material.opacity = 0.05 + redPulse * 0.3;
    lights.blueGlow.scale.setScalar(0.78 + bluePulse * 0.55);
    lights.redGlow.scale.setScalar(0.78 + redPulse * 0.55);
    lights.blueLight.intensity = bluePulse * 2.6;
    lights.redLight.intensity = redPulse * 2.6;
    lights.arrestZone.material.opacity = 0.16 + Math.max(bluePulse, redPulse) * 0.18;
  }
}

function updateCops(dt) {
  chaseTime += dt;
  backupTime += dt;
  if (chaseTime > 3 && cops.length === 0) spawnCop();

  if (Math.hypot(player.x - lastPlayerX, player.z - lastPlayerZ) < 42) idleHeat += dt;
  else {
    idleHeat = Math.max(0, idleHeat - dt * 1.6);
    lastPlayerX = player.x;
    lastPlayerZ = player.z;
  }

  const wanted = clamp(1 + Math.floor(idleHeat / 7), 1, MAX_COPS);
  if (backupTime > 5.5 && cops.length < wanted) {
    backupTime = 0;
    spawnCop();
  }

  for (let i = cops.length - 1; i >= 0; i--) {
    const cop = cops[i];
    const chase = nearestChaseTarget(cop);
    const targetPlayer = chase.target;
    const distanceToPlayer = chase.distance;
    const farFromAllPlayers = playerChaseTargets().every((target) => dist(cop, target) > COP_DESPAWN_DISTANCE);
    if (farFromAllPlayers) {
      scene.remove(cop.group);
      cops.splice(i, 1);
      continue;
    }
    if (updateVehicleRagdoll(cop, dt)) continue;
    if (vehicleSpeed(cop) < 16 && distanceToPlayer > 62) cop.jamTime += dt;
    else cop.jamTime = Math.max(0, cop.jamTime - dt * 1.5);
    if (cop.jamTime > 0.58 && cop.escapeTimer <= 0) {
      const blocker = findBlockingVehicle(cop, 110, ROAD * 0.5);
      beginEscapeManeuver(cop, blocker, 2.4);
      if (!blocker) cop.escapeSide = angleDelta(cop.angle, Math.atan2(-(targetPlayer.x - cop.x), -(targetPlayer.z - cop.z))) > 0 ? 1 : -1;
    }

    const lead = distanceToPlayer > 180 ? 0.65 : cop.personality === "blocker" ? 0.48 : cop.personality === "aggressive" ? 0.32 : 0.22;
    const targetX = targetPlayer.x + targetPlayer.vx * lead;
    const targetZ = targetPlayer.z + targetPlayer.vz * lead;
    const desired = Math.atan2(-(targetX - cop.x), -(targetZ - cop.z));
    const close = distanceToPlayer < 58;
    const angleError = Math.abs(angleDelta(cop.angle, desired));
    let steering = clamp(angleDelta(cop.angle, desired) * (cop.personality === "calm" ? 1.65 : 2.45), -1, 1);
    let throttle = close ? 0.68 : angleError > 1.35 ? 0.45 : 1;
    const blocker = findBlockingVehicle(cop, 98, ROAD * 0.45);
    if (blocker && blocker.other !== player) {
      const avoidSide = blocker.side >= 0 ? -1 : 1;
      steering = clamp(steering + avoidSide * (blocker.ahead < 52 ? 0.55 : 0.28), -1, 1);
      throttle = Math.min(throttle, blocker.ahead < 42 ? 0.12 : 0.46);
      if (blocker.ahead < 45 && vehicleSpeed(cop) < 22) beginEscapeManeuver(cop, blocker, 2.7);
    }
    if (cop.escapeTimer > 0) {
      cop.escapeTimer -= dt;
      if (cop.reverseTimer > 0 && blocker && blocker.other !== player && blocker.ahead < 44) {
        cop.reverseTimer -= dt;
        steering = -cop.escapeSide * 0.55;
        throttle = -0.48;
      } else {
        const towardPlayer = { x: targetPlayer.x + targetPlayer.vx * 0.22, z: targetPlayer.z + targetPlayer.vz * 0.22 };
        const bypass = escapeTargetFor(cop, 120, ROAD * 0.96);
        const blend = clamp(distanceToPlayer / 220, 0.25, 0.82);
        const target = {
          x: lerp(towardPlayer.x, bypass.x, blend),
          z: lerp(towardPlayer.z, bypass.z, blend),
        };
        steering = steerTowardPoint(cop, target, cop.personality === "aggressive" ? 2.65 : 2.35);
        throttle = 0.92;
      }
    }
    const boost = cop.personality === "aggressive" ? 1.15 : cop.personality === "calm" ? 0.86 : 1;
    driveVehicle(cop, { steer: steering, throttle }, dt, {
      accel: 138 * boost,
      brake: 300 * boost,
      reverseAccel: 55,
      maxSpeed: 242 * boost,
      reverseMax: 34,
      grip: cop.escapeTimer > 0 ? 3.55 : cop.personality === "aggressive" ? 4.9 : 5.8,
      coast: 95,
      turnRate: cop.escapeTimer > 0 ? 2.95 : cop.personality === "aggressive" ? 2.8 : 2.35,
    });
    collideWorld(cop);
  }
}

function vehicleCollisionAxes(v) {
  const right = vehicleRight(v);
  const forward = vehicleForward(v);
  return [right, forward];
}

function projectVehicleOnAxis(v, axis) {
  const right = vehicleRight(v);
  const forward = vehicleForward(v);
  const center = v.x * axis.x + v.z * axis.z;
  const radius =
    Math.abs(right.x * axis.x + right.z * axis.z) * (v.halfWidth || 12.5) +
    Math.abs(forward.x * axis.x + forward.z * axis.z) * (v.halfLength || 22.5);
  return { min: center - radius, max: center + radius };
}

function vehicleObbCollision(a, b) {
  const broad = Math.hypot((a.halfWidth || 12.5) + (b.halfWidth || 12.5), (a.halfLength || 22.5) + (b.halfLength || 22.5));
  if (dist(a, b) > broad) return null;

  let smallestOverlap = Infinity;
  let bestAxis = null;
  for (const axis of [...vehicleCollisionAxes(a), ...vehicleCollisionAxes(b)]) {
    const pa = projectVehicleOnAxis(a, axis);
    const pb = projectVehicleOnAxis(b, axis);
    const overlap = Math.min(pa.max, pb.max) - Math.max(pa.min, pb.min);
    if (overlap <= 0) return null;
    if (overlap < smallestOverlap) {
      smallestOverlap = overlap;
      bestAxis = axis;
    }
  }

  const centerDx = a.x - b.x;
  const centerDz = a.z - b.z;
  let nx = bestAxis.x;
  let nz = bestAxis.z;
  if (centerDx * nx + centerDz * nz < 0) {
    nx = -nx;
    nz = -nz;
  }
  return { nx, nz, overlap: smallestOverlap };
}

function collideVehicles(a, b) {
  if ((a.airborne && (a.y || 0) > 3) || (b.airborne && (b.y || 0) > 3)) return false;
  const hit = vehicleObbCollision(a, b);
  if (!hit) return false;
  const nx = hit.nx;
  const nz = hit.nz;
  const relVx = a.vx - b.vx;
  const relVz = a.vz - b.vz;
  const impactSpeed = Math.abs(relVx * nx + relVz * nz);
  const push = hit.overlap + 0.35;
  const aMass = a === player ? 1.12 : a.kind === "cop" ? 1.08 : 1;
  const bMass = b === player ? 1.12 : b.kind === "cop" ? 1.08 : 1;
  const totalMass = aMass + bMass;
  a.x += nx * push * (bMass / totalMass);
  a.z += nz * push * (bMass / totalMass);
  b.x -= nx * push * (aMass / totalMass);
  b.z -= nz * push * (aMass / totalMass);

  const aIntoB = a.vx * -nx + a.vz * -nz;
  const bIntoA = b.vx * nx + b.vz * nz;
  if (aIntoB > bIntoA) {
    a.vx *= 0.38;
    a.vz *= 0.38;
    b.vx *= 0.8;
    b.vz *= 0.8;
  } else {
    b.vx *= 0.38;
    b.vz *= 0.38;
    a.vx *= 0.8;
    a.vz *= 0.8;
  }
  if (a !== player && b !== player && impactSpeed < 38) {
    const aBlocker = { other: b, ahead: 34, side: -1 };
    const bBlocker = { other: a, ahead: 34, side: 1 };
    beginEscapeManeuver(a, aBlocker, a.kind === "cop" ? 2.4 : 3.1);
    if (Math.random() < 0.45) beginEscapeManeuver(b, bBlocker, b.kind === "cop" ? 2.2 : 2.9);
  }
  if (a === player && b.kind !== "cop" && impactSpeed < 55) beginEscapeManeuver(b, { other: a, ahead: 34, side: 1 }, 3.2);
  if (b === player && a.kind !== "cop" && impactSpeed < 55) beginEscapeManeuver(a, { other: b, ahead: 34, side: -1 }, 3.2);
  if (a !== player) {
    a.vx += nx * 8;
    a.vz += nz * 8;
  }
  if (b !== player) {
    b.vx -= nx * 8;
    b.vz -= nz * 8;
  }
  syncVehicle(a);
  syncVehicle(b);
  if (a === player || b === player) cameraState.shake = Math.max(cameraState.shake, 0.55);
  if (impactSpeed > 105 && (a === player || b === player)) {
    const other = a === player ? b : a;
    const dirX = other === b ? -nx : nx;
    const dirZ = other === b ? -nz : nz;
    if (other.kind !== "player") {
      if (other.kind === "cop") {
        other.vx += dirX * impactSpeed * 0.18;
        other.vz += dirZ * impactSpeed * 0.18;
        hardCrashFx((a.x + b.x) * 0.5, (a.z + b.z) * 0.5, impactSpeed);
      } else {
        launchVehicle(other, dirX, dirZ, impactSpeed);
      }
      player.vx *= 0.72;
      player.vz *= 0.72;
    } else {
      hardCrashFx((a.x + b.x) * 0.5, (a.z + b.z) * 0.5, impactSpeed);
    }
  }
  return true;
}

function collideRemotePlayers() {
  for (const remote of remotePlayers.values()) {
    if (remote.airborne || remote.wrecked) continue;
    const beforePlayerSpeed = vehicleSpeed(player);
    const beforeRemote = {
      x: remote.x,
      z: remote.z,
      y: remote.y,
      vx: remote.vx,
      vz: remote.vz,
      vy: remote.vy,
      roll: remote.roll,
      pitch: remote.pitch,
      spinVel: remote.spinVel,
      rollVel: remote.rollVel,
      pitchVel: remote.pitchVel,
      airborne: remote.airborne,
      wrecked: remote.wrecked,
      escapeTimer: remote.escapeTimer,
      reverseTimer: remote.reverseTimer,
      jamTime: remote.jamTime,
    };
    const hit = collideVehicles(player, remote);
    if (!hit) continue;

    Object.assign(remote, beforeRemote);
    syncVehicle(remote);
    if (beforePlayerSpeed > 80) {
      cameraState.shake = Math.max(cameraState.shake, 0.36);
    }
  }
}

function wantedLevel() {
  if (!running || gameOver || chaseTime < 3) return 0;
  const heatLevel = 1 + Math.floor(idleHeat / 7);
  const arrestLevel = Math.floor(arrestTime / 1.2);
  return clamp(Math.max(cops.length, heatLevel) + arrestLevel, 1, 5);
}

function updateWantedMeter() {
  const level = wantedLevel();
  for (let i = 0; i < wantedStarEls.length; i++) {
    wantedStarEls[i].classList.toggle("active", i < level);
  }

  if (!running || gameOver) {
    lastWantedNoticeLevel = 0;
    return;
  }

  if (level >= 3 && level > lastWantedNoticeLevel) {
    showNotification(level >= 5 ? `${playerName} is max wanted` : `${playerName} reached ${level} stars`, true);
  }
  lastWantedNoticeLevel = level;
}

function updateCollisions(dt, fullWorldCollisions = true) {
  if (fullWorldCollisions) {
    const vehicles = [player, ...cops, ...traffic];
    for (let i = 0; i < vehicles.length; i++) {
      for (let j = i + 1; j < vehicles.length; j++) {
        collideVehicles(vehicles[i], vehicles[j]);
      }
    }
  } else {
    for (const cop of cops) collideVehicles(player, cop);
    for (const car of traffic) collideVehicles(player, car);
  }
  collideRemotePlayers();

  let arrestPressure = 0;
  for (const cop of cops) {
    if (cop.airborne || cop.wrecked) continue;
    const d = dist(player, cop);
    const contact = d < player.radius + cop.radius + 10;
    const inArrestZone = d < COP_ARREST_RADIUS;
    const boxedIn = d < 55 && vehicleSpeed(player) < 78;
    const copStillPushing = d < 48 && vehicleSpeed(cop) > 8;
    if (contact || inArrestZone || boxedIn || copStillPushing) {
      const zonePressure = 0.68 + clamp((COP_ARREST_RADIUS - d) / COP_ARREST_RADIUS, 0, 1) * 0.48;
      arrestPressure = Math.max(arrestPressure, boxedIn ? 1.35 : contact ? 1.12 : copStillPushing ? 0.9 : zonePressure);
    }
  }

  arrestTime = arrestPressure > 0 ? arrestTime + dt * arrestPressure : Math.max(0, arrestTime - dt * 2);
  arrestFx.style.opacity = clamp(arrestTime / 4, 0, 0.92).toFixed(2);
  if (arrestTime >= 4) loseGame();
}

function updateCamera(dt) {
  const speed = Math.hypot(player.vx, player.vz);
  const forwardX = -Math.sin(player.angle);
  const forwardZ = -Math.cos(player.angle);
  const speedFeel = clamp(speed / 330, 0, 1);
  const idleView = 1 - speedFeel;
  const cameraDistance = lerp(210, 170 + speed * 0.16, speedFeel);
  const cameraHeight = lerp(210, 136 + speed * 0.15, speedFeel);
  const lookAhead = clamp(speed / 210, 0, 1);
  const desired = new THREE.Vector3(
    player.x - forwardX * cameraDistance,
    cameraHeight,
    player.z - forwardZ * cameraDistance
  );
  const target = new THREE.Vector3(
    player.x + forwardX * lerp(28, 65 + speed * 0.23, lookAhead),
    lerp(0, 10, speedFeel),
    player.z + forwardZ * lerp(28, 65 + speed * 0.23, lookAhead)
  );
  cameraState.position.lerp(desired, 1 - Math.exp(-dt * lerp(3.1, 4.2, speedFeel)));
  cameraState.target.lerp(target, 1 - Math.exp(-dt * lerp(4.4, 6.6, speedFeel)));
  cameraState.tilt = lerp(cameraState.tilt, player.steer * clamp(speed / 145, 0, 1), 1 - Math.exp(-dt * 5));
  cameraState.shake = Math.max(0, cameraState.shake - dt * 5.5);
  const wantedFov = 54 + speedFeel * 5 - idleView * 1.5;
  if (Math.abs(camera.fov - wantedFov) > 0.01) {
    camera.fov = lerp(camera.fov, wantedFov, 1 - Math.exp(-dt * 2.2));
    camera.updateProjectionMatrix();
  }
  camera.position.copy(cameraState.position);
  if (cameraState.shake > 0) {
    const pulse = performance.now() * 0.018;
    camera.position.x += Math.sin(pulse) * cameraState.shake;
    camera.position.z += Math.cos(pulse * 1.27) * cameraState.shake;
  }
  camera.lookAt(cameraState.target);
  camera.rotation.z += cameraState.tilt * 0.025;
  sun.position.set(player.x - 260, 520, player.z + 180);
  sun.target.position.set(player.x, 0, player.z);
}

function drawMinimap() {
  const c = miniCtx;
  const w = minimap.width;
  const h = minimap.height;
  const scale = 0.22;
  c.clearRect(0, 0, w, h);
  c.save();
  c.beginPath();
  c.arc(w / 2, h / 2, w / 2 - 2, 0, Math.PI * 2);
  c.clip();
  c.fillStyle = "#5f9a57";
  c.fillRect(0, 0, w, h);

  const mx = (x) => w / 2 + (x - player.x) * scale;
  const mz = (z) => h / 2 + (z - player.z) * scale;

  c.strokeStyle = "#383832";
  c.lineWidth = ROAD * scale;
  c.lineCap = "round";
  c.lineJoin = "round";

  const minX = player.x - 520;
  const maxX = player.x + 520;
  const minZ = player.z - 520;
  const maxZ = player.z + 520;
  const mainMin = Math.floor((minX - 120) / ROAD_SPACING) - 1;
  const mainMax = Math.ceil((maxX + 120) / ROAD_SPACING) + 1;
  for (let id = mainMin; id <= mainMax; id++) {
    if (!mainRoadExists(id)) continue;
    c.beginPath();
    let started = false;
    for (let z = minZ; z <= maxZ; z += 24) {
      const x = roadCenterX(id, z);
      if (!started) {
        c.moveTo(mx(x), mz(z));
        started = true;
      } else {
        c.lineTo(mx(x), mz(z));
      }
    }
    c.stroke();
  }

  const sideMin = Math.floor((minZ - 120) / SIDE_ROAD_SPACING) - 1;
  const sideMax = Math.ceil((maxZ + 120) / SIDE_ROAD_SPACING) + 1;
  for (let id = sideMin; id <= sideMax; id++) {
    if (!sideRoadExists(id)) continue;
    c.beginPath();
    let started = false;
    for (let x = minX; x <= maxX; x += 24) {
      const z = roadCenterZ(id, x);
      if (!started) {
        c.moveTo(mx(x), mz(z));
        started = true;
      } else {
        c.lineTo(mx(x), mz(z));
      }
    }
    c.stroke();
  }

  c.fillStyle = "#e2a047";
  for (const car of traffic) c.fillRect(mx(car.x) - 2, mz(car.z) - 2, 4, 4);
  c.fillStyle = "#2254ff";
  for (const cop of cops) {
    c.beginPath();
    c.arc(mx(cop.x), mz(cop.z), 4, 0, Math.PI * 2);
    c.fill();
  }
  c.fillStyle = "#18d2ff";
  for (const remote of remotePlayers.values()) {
    c.beginPath();
    c.arc(mx(remote.x), mz(remote.z), 4, 0, Math.PI * 2);
    c.fill();
  }
  c.fillStyle = "#f01818";
  c.beginPath();
  c.arc(w / 2, h / 2, 5, 0, Math.PI * 2);
  c.fill();
  c.restore();
}

function setMenuStatus(text) {
  menuStatusEl.textContent = text || "";
}

function cleanPlayerName(value) {
  const cleaned = String(value || "")
    .replace(/[^\w \-]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 16);
  return cleaned || "Driver";
}

function showNotification(text, hot = false) {
  const item = document.createElement("div");
  item.className = `notification${hot ? " hot" : ""}`;
  const label = document.createElement("span");
  label.textContent = text;
  item.appendChild(label);
  notificationFeedEl.appendChild(item);

  while (notificationFeedEl.children.length > 5) notificationFeedEl.firstElementChild.remove();

  window.setTimeout(() => item.classList.add("fade-out"), 4300);
  window.setTimeout(() => item.remove(), 4700);
}

function submitPlayerName() {
  playerName = cleanPlayerName(playerNameInput.value);
  playerColor = colorForName(playerName);
  localStorage.setItem("policeGetawayName", playerName);
  nameScreenEl.classList.add("hidden");
  deviceChoiceEl.classList.remove("hidden");
  showNotification(`${playerName} entered the city`);
}

function setMultiplayerStatus(text) {
  multiplayer.status = text || "";
  const label = gameCodeEl.querySelector("small");
  if (label) label.textContent = multiplayer.status;
}

function updateGameCodeHud() {
  const multiplayerOn = multiplayer.mode !== "singleplayer" && multiplayer.code;
  gameCodeEl.classList.toggle("hidden", !multiplayerOn);
  if (!multiplayerOn) return;
  const code = gameCodeEl.querySelector("strong");
  if (code) code.textContent = multiplayer.code;
  setMultiplayerStatus(multiplayer.status || (multiplayer.mode === "host" ? "Waiting for players" : "Connecting"));
}

function peerLibraryReady() {
  return typeof window.Peer === "function";
}

function randomGameCode() {
  return String(100000 + Math.floor(Math.random() * 900000));
}

function sendToConnection(conn, message) {
  if (conn && conn.open) conn.send(message);
}

function broadcastNetworkMessage(message, exceptPeer = "") {
  for (const [peerId, conn] of multiplayer.connections) {
    if (peerId !== exceptPeer) sendToConnection(conn, message);
  }
}

function removeRemotePlayer(peerId, announce = true) {
  const remote = remotePlayers.get(peerId);
  if (!remote) return;
  scene.remove(remote.group);
  if (remote.storeCharacter && remote.storeCharacter.parent) remote.storeCharacter.parent.remove(remote.storeCharacter);
  remotePlayers.delete(peerId);
  if (announce && running && !gameOver) showNotification(`${remote.playerName || "Driver"} left the city`);
}

function clearRemotePlayers() {
  for (const peerId of remotePlayers.keys()) removeRemotePlayer(peerId, false);
}

function worldHostControlsSimulation() {
  return multiplayer.mode !== "client";
}

function localNetworkState() {
  return {
    name: playerName,
    color: playerColor,
    x: player.x,
    z: player.z,
    y: player.y || 0,
    vx: player.vx,
    vz: player.vz,
    angle: player.angle,
    gameMode,
    storeX: storeState.x,
    storeZ: storeState.z,
    storeAngle: storeState.angle,
    storePitch: storeState.pitch,
    storeHp: storeState.hp,
    storeDead: storeState.dead,
    storeDeathY: storeState.deathY,
    storeDeathRoll: storeState.deathRoll,
    storeDeathPitch: storeState.deathPitch,
    money: Math.floor(money),
    wanted: wantedLevel(),
    gameOver,
  };
}

function vehicleNetworkState(v) {
  return {
    kind: v.kind,
    x: v.x,
    z: v.z,
    y: v.y || 0,
    vx: v.vx || 0,
    vz: v.vz || 0,
    vy: v.vy || 0,
    angle: v.angle || 0,
    roll: v.roll || 0,
    pitch: v.pitch || 0,
    roadAxis: v.roadAxis,
    roadId: v.roadId,
    dir: v.dir,
    timer: v.timer || 0,
    personality: v.personality,
    paintColor: v.paintColor || null,
    airborne: !!v.airborne,
    wrecked: !!v.wrecked,
    lightTimer: v.lightTimer || 0,
  };
}

function worldNetworkState() {
  return {
    seed,
    chaseTime,
    backupTime,
    idleHeat,
    cops: cops.map(vehicleNetworkState),
    traffic: traffic.map(vehicleNetworkState),
  };
}

function applyRemoteState(peerId, state) {
  if (!peerId || peerId === multiplayer.peerId || !state) return;
  const remoteName = state.name || "Driver";
  const remoteColor = state.color || colorForName(`${remoteName}-${peerId}`);
  let remote = remotePlayers.get(peerId);
  if (remote && remote.paintColor !== remoteColor) {
    scene.remove(remote.group);
    remotePlayers.delete(peerId);
    remote = null;
  }
  if (!remote) {
    remote = makeVehicle("remote", state.x || 0, state.z || 48, state.angle || 0, remoteColor);
    remote.remoteTarget = { ...state };
    remote.lastSeen = performance.now();
    remote.playerName = remoteName;
    remote.lastWantedNoticeLevel = 0;
    setVehicleNameTag(remote, remote.playerName, remoteColor);
    scene.add(remote.group);
    remotePlayers.set(peerId, remote);
    showNotification(`${remote.playerName} joined the chase`);
  }
  remote.playerName = remoteName || remote.playerName || "Driver";
  setVehicleNameTag(remote, remote.playerName, remoteColor);
  if (!remote.gameOver && state.gameOver) showNotification(`${remote.playerName} got arrested`, true);
  if ((state.wanted || 0) >= 3 && (state.wanted || 0) > (remote.lastWantedNoticeLevel || 0)) {
    showNotification((state.wanted || 0) >= 5 ? `${remote.playerName} is max wanted` : `${remote.playerName} reached ${state.wanted} stars`, true);
  }
  remote.gameOver = !!state.gameOver;
  remote.lastWantedNoticeLevel = state.wanted || remote.lastWantedNoticeLevel || 0;
  remote.remoteTarget = { ...state };
  remote.storeTarget = {
    gameMode: state.gameMode || "driving",
    x: Number.isFinite(state.storeX) ? state.storeX : 6000,
    z: Number.isFinite(state.storeZ) ? state.storeZ : 220,
    angle: Number.isFinite(state.storeAngle) ? state.storeAngle : Math.PI,
    hp: Number.isFinite(state.storeHp) ? state.storeHp : 100,
    dead: !!state.storeDead,
    deathY: Number.isFinite(state.storeDeathY) ? state.storeDeathY : 0,
    deathRoll: Number.isFinite(state.storeDeathRoll) ? state.storeDeathRoll : 0,
    deathPitch: Number.isFinite(state.storeDeathPitch) ? state.storeDeathPitch : 0,
  };
  if (!remote.storeCharacter && storeState.group) {
    remote.storeCharacter = makePerson();
    remote.storeCharacter.position.set(remote.storeTarget.x, 0, remote.storeTarget.z);
    remote.storeCharacter.rotation.y = remote.storeTarget.angle;
    remote.storeCharacter.visible = false;
    storeState.group.add(remote.storeCharacter);
  }
  setStoreNameTag(remote);
  remote.lastSeen = performance.now();
}

function applyVehicleNetworkState(v, state, snap = false) {
  v.kind = state.kind || v.kind;
  v.remoteTarget = { ...state };
  v.vx = state.vx || 0;
  v.vz = state.vz || 0;
  v.vy = state.vy || 0;
  v.roadAxis = state.roadAxis || v.roadAxis;
  v.roadId = state.roadId ?? v.roadId;
  v.dir = state.dir ?? v.dir;
  v.timer = state.timer || 0;
  v.personality = state.personality || v.personality;
  v.airborne = !!state.airborne;
  v.wrecked = !!state.wrecked;
  v.roll = state.roll || 0;
  v.pitch = state.pitch || 0;
  v.lightTimer = state.lightTimer || v.lightTimer || 0;
  v.lastSeen = performance.now();

  if (snap) {
    v.x = state.x || 0;
    v.z = state.z || 0;
    v.y = state.y || 0;
    v.angle = state.angle || 0;
    v.group.position.set(v.x, v.y || 0, v.z);
    v.group.rotation.set(v.pitch || 0, v.angle, v.roll || 0);
  }
}

function syncNetworkVehicleList(list, states) {
  while (list.length > states.length) {
    const removed = list.pop();
    scene.remove(removed.group);
  }

  for (let i = 0; i < states.length; i++) {
    const state = states[i];
    if (!list[i] || list[i].kind !== state.kind || list[i].paintColor !== (state.paintColor || null)) {
      if (list[i]) scene.remove(list[i].group);
      list[i] = makeVehicle(state.kind || "normal", state.x || 0, state.z || 48, state.angle || 0, state.paintColor || null);
      scene.add(list[i].group);
      applyVehicleNetworkState(list[i], state, true);
    } else {
      applyVehicleNetworkState(list[i], state);
    }
  }
}

function applyWorldState(state) {
  if (!state || multiplayer.mode !== "client") return;
  if (Number.isFinite(state.seed) && state.seed !== seed) {
    seed = state.seed;
    for (const chunk of chunks.values()) disposeChunk(chunk);
    chunks.clear();
    colliders.length = 0;
    fallingTrees.length = 0;
    updateChunks();
  }
  chaseTime = state.chaseTime || chaseTime;
  backupTime = state.backupTime || backupTime;
  idleHeat = state.idleHeat || idleHeat;
  syncNetworkVehicleList(cops, Array.isArray(state.cops) ? state.cops : []);
  syncNetworkVehicleList(traffic, Array.isArray(state.traffic) ? state.traffic : []);
}

function updateNetworkWorldVehicles(dt) {
  const follow = 1 - Math.exp(-dt * 16);
  for (const v of [...cops, ...traffic]) {
    const target = v.remoteTarget;
    if (!target) continue;
    v.x = lerp(v.x, target.x || 0, follow);
    v.z = lerp(v.z, target.z || 0, follow);
    v.y = lerp(v.y || 0, target.y || 0, follow);
    v.angle += angleDelta(v.angle, target.angle || 0) * follow;
    v.roll = lerp(v.roll || 0, target.roll || 0, follow);
    v.pitch = lerp(v.pitch || 0, target.pitch || 0, follow);
    v.group.position.set(v.x, v.y || 0, v.z);
    v.group.rotation.set(v.pitch || 0, v.angle, v.roll || 0);
  }
}

function updateRemotePlayers(dt) {
  const now = performance.now();
  for (const [peerId, remote] of remotePlayers) {
    if (now - (remote.lastSeen || now) > 9000) {
      removeRemotePlayer(peerId);
      continue;
    }
    const target = remote.remoteTarget;
    if (!target) continue;
    const follow = 1 - Math.exp(-dt * 14);
    remote.x = lerp(remote.x, target.x, follow);
    remote.z = lerp(remote.z, target.z, follow);
    remote.y = lerp(remote.y || 0, target.y || 0, follow);
    remote.vx = target.vx || 0;
    remote.vz = target.vz || 0;
    remote.angle += angleDelta(remote.angle, target.angle || 0) * follow;
    remote.group.position.set(remote.x, remote.y || 0, remote.z);
    remote.group.rotation.y = remote.angle;

    if (remote.storeCharacter) {
      const storeTarget = remote.storeTarget || {};
      const visibleInStore = gameMode === "store" && storeTarget.gameMode === "store";
      remote.storeCharacter.visible = visibleInStore;
      if (remote.storeNameTag) remote.storeNameTag.visible = visibleInStore && !storeTarget.dead;
      if (visibleInStore) {
        remote.storeCharacter.position.x = lerp(remote.storeCharacter.position.x, storeTarget.x || 6000, follow);
        remote.storeCharacter.position.y = lerp(remote.storeCharacter.position.y, storeTarget.deathY || 0, follow);
        remote.storeCharacter.position.z = lerp(remote.storeCharacter.position.z, storeTarget.z || 220, follow);
        if (storeTarget.dead) {
          remote.storeCharacter.rotation.x = lerp(remote.storeCharacter.rotation.x, storeTarget.deathPitch || Math.PI * 0.5, follow);
          remote.storeCharacter.rotation.y += angleDelta(remote.storeCharacter.rotation.y, storeTarget.angle || Math.PI) * follow;
          remote.storeCharacter.rotation.z = lerp(remote.storeCharacter.rotation.z, storeTarget.deathRoll || 0, follow);
        } else {
          remote.storeCharacter.rotation.x = lerp(remote.storeCharacter.rotation.x, 0, follow);
          remote.storeCharacter.rotation.y += angleDelta(remote.storeCharacter.rotation.y, storeTarget.angle || Math.PI) * follow;
          remote.storeCharacter.rotation.z = lerp(remote.storeCharacter.rotation.z, 0, follow);
        }
      }
    }
  }
}

function handleNetworkMessage(fromPeer, message) {
  if (!message || typeof message !== "object") return;

  if (message.type === "state") {
    applyRemoteState(fromPeer, message.state);
    if (multiplayer.mode === "host") {
      broadcastNetworkMessage({ type: "peer-state", peerId: fromPeer, state: message.state }, fromPeer);
    }
    return;
  }

  if (message.type === "peer-state") {
    applyRemoteState(message.peerId, message.state);
    return;
  }

  if (message.type === "world-state") {
    applyWorldState(message.state);
    return;
  }

  if (message.type === "event") {
    if (message.event === "arrested") showNotification(`${message.name || "Driver"} got arrested`, true);
    if (message.event === "store-punch") applyStorePunchEvent(message);
    if (multiplayer.mode === "host") broadcastNetworkMessage(message, fromPeer);
    return;
  }

  if (message.type === "peer-left") {
    if (message.name) showNotification(`${message.name} left the city`);
    removeRemotePlayer(message.peerId, !message.name);
  }
}

function attachNetworkConnection(conn, options = {}) {
  const peerId = conn.peer;
  if (multiplayer.connections.has(peerId)) {
    try { multiplayer.connections.get(peerId).close(); } catch {}
  }
  multiplayer.connections.set(peerId, conn);
  if (options.hostConnection) multiplayer.hostConnection = conn;

  conn.on("open", () => {
    if (options.startOnOpen) resetGame();
    setMenuStatus("");
    setMultiplayerStatus(multiplayer.mode === "host" ? `${multiplayer.connections.size} player joined` : "Connected");
    updateGameCodeHud();

    if (multiplayer.mode === "host") {
      sendToConnection(conn, { type: "peer-state", peerId: multiplayer.peerId, state: localNetworkState() });
      sendToConnection(conn, { type: "world-state", state: worldNetworkState() });
      for (const [otherPeer, remote] of remotePlayers) {
        if (otherPeer !== peerId && remote.remoteTarget) {
          sendToConnection(conn, { type: "peer-state", peerId: otherPeer, state: remote.remoteTarget });
        }
      }
    }
  });

  conn.on("data", (message) => handleNetworkMessage(peerId, message));
  conn.on("close", () => {
    multiplayer.connections.delete(peerId);
    if (multiplayer.hostConnection === conn) multiplayer.hostConnection = null;
    removeRemotePlayer(peerId);
    if (multiplayer.mode === "host") broadcastNetworkMessage({ type: "peer-left", peerId });
    setMultiplayerStatus(multiplayer.mode === "host" ? `${multiplayer.connections.size} players connected` : "Disconnected");
    updateGameCodeHud();
  });
  conn.on("error", () => {
    setMultiplayerStatus("Connection error");
    updateGameCodeHud();
  });
}

function stopMultiplayer() {
  broadcastNetworkMessage({ type: "peer-left", peerId: multiplayer.peerId, name: playerName });
  for (const conn of multiplayer.connections.values()) {
    try { conn.close(); } catch {}
  }
  if (multiplayer.peer) {
    try { multiplayer.peer.destroy(); } catch {}
  }
  multiplayer.mode = "singleplayer";
  multiplayer.publicServer = false;
  multiplayer.peer = null;
  multiplayer.code = "";
  multiplayer.peerId = "";
  multiplayer.connections.clear();
  multiplayer.hostConnection = null;
  multiplayer.status = "";
  multiplayer.sendTimer = 0;
  multiplayer.worldSendTimer = 0;
  clearRemotePlayers();
  updateGameCodeHud();
}

function startSingleplayer() {
  stopMultiplayer();
  resetGame();
}

function startHostPeer(attempt = 0, options = {}) {
  const publicServer = !!options.publicServer;
  const code = publicServer ? PUBLIC_SERVER_CODE : randomGameCode();
  const peerId = publicServer ? PUBLIC_SERVER_PEER_ID : PEER_PREFIX + code;
  multiplayer.publicServer = publicServer;
  multiplayer.code = code;
  multiplayer.peerId = peerId;
  multiplayer.status = publicServer ? "Opening public server" : "Creating game";
  updateGameCodeHud();
  setMenuStatus(publicServer ? "Joining public server..." : "Creating private game...");

  const peer = new window.Peer(peerId);
  multiplayer.peer = peer;

  peer.on("open", () => {
    multiplayer.mode = "host";
    multiplayer.publicServer = publicServer;
    multiplayer.status = publicServer ? "Public host" : "Waiting for players";
    seed = publicServer ? PUBLIC_SERVER_SEED : Number(code);
    resetGame();
    updateGameCodeHud();
    if (publicServer) showNotification(`${playerName} opened the public server`, true);
  });

  peer.on("connection", (conn) => attachNetworkConnection(conn));

  peer.on("error", (error) => {
    if (publicServer && error && error.type === "unavailable-id") {
      try { peer.destroy(); } catch {}
      joinGame(PUBLIC_SERVER_CODE, { publicServer: true });
      return;
    }
    if (!publicServer && error && error.type === "unavailable-id" && attempt < 4) {
      try { peer.destroy(); } catch {}
      startHostPeer(attempt + 1);
      return;
    }
    setMenuStatus(publicServer ? "Public server failed. Try again." : "Multiplayer failed. Try again or use Singleplayer.");
    setMultiplayerStatus("Network error");
    updateGameCodeHud();
  });
}

function createGame() {
  if (!peerLibraryReady()) {
    setMenuStatus("Multiplayer needs internet access. PeerJS did not load.");
    return;
  }
  stopMultiplayer();
  multiplayer.mode = "host";
  startHostPeer(0, { publicServer: false });
}

function showJoinGame() {
  joinForm.classList.remove("hidden");
  setMenuStatus("Enter the 6 digit game code.");
  joinCodeInput.value = "";
  joinCodeInput.focus();
}

function joinGame(code, options = {}) {
  const publicServer = !!options.publicServer;
  const cleanCode = publicServer ? PUBLIC_SERVER_CODE : String(code || "").replace(/\D/g, "").slice(0, 6);
  if (!publicServer && cleanCode.length !== 6) {
    setMenuStatus("Game code must be 6 numbers.");
    return;
  }
  if (!peerLibraryReady()) {
    setMenuStatus("Multiplayer needs internet access. PeerJS did not load.");
    return;
  }

  stopMultiplayer();
  multiplayer.mode = "client";
  multiplayer.publicServer = publicServer;
  multiplayer.code = cleanCode;
  seed = publicServer ? PUBLIC_SERVER_SEED : Number(cleanCode);
  multiplayer.status = "Joining";
  updateGameCodeHud();
  setMenuStatus(publicServer ? "Joining public server..." : "Joining private game...");

  const peer = new window.Peer();
  multiplayer.peer = peer;
  peer.on("open", (id) => {
    multiplayer.peerId = id;
    const conn = peer.connect(publicServer ? PUBLIC_SERVER_PEER_ID : PEER_PREFIX + cleanCode, { reliable: false });
    attachNetworkConnection(conn, { hostConnection: true, startOnOpen: true });
    window.setTimeout(() => {
      if (multiplayer.mode === "client" && !conn.open) {
        if (publicServer) {
          try { peer.destroy(); } catch {}
          multiplayer.mode = "host";
          startHostPeer(0, { publicServer: true });
        } else {
          setMenuStatus("Could not join. Check the code and that host is still in game.");
          setMultiplayerStatus("No host found");
          updateGameCodeHud();
        }
      }
    }, 6000);
  });
  peer.on("error", () => {
    setMenuStatus(publicServer ? "Could not join public server. Try again." : "Could not connect to multiplayer. Try again.");
    setMultiplayerStatus("Network error");
    updateGameCodeHud();
  });
}

function joinPublicServer() {
  if (!peerLibraryReady()) {
    setMenuStatus("Multiplayer needs internet access. PeerJS did not load.");
    return;
  }
  joinForm.classList.add("hidden");
  joinGame(PUBLIC_SERVER_CODE, { publicServer: true });
}

function sendNetworkState(dt) {
  if (multiplayer.mode === "singleplayer" || !running || gameOver) return;
  multiplayer.sendTimer += dt;
  if (multiplayer.sendTimer < 0.055) return;
  multiplayer.sendTimer = 0;

  const state = localNetworkState();
  if (multiplayer.mode === "host") {
    broadcastNetworkMessage({ type: "peer-state", peerId: multiplayer.peerId, state });
    multiplayer.worldSendTimer += 0.055;
    if (multiplayer.worldSendTimer >= 0.11) {
      multiplayer.worldSendTimer = 0;
      broadcastNetworkMessage({ type: "world-state", state: worldNetworkState() });
    }
  } else {
    sendToConnection(multiplayer.hostConnection, { type: "state", state });
  }
}

function chooseDevice(device) {
  inputState.device = device;
  inputState.mobile = device === "phone";
  deviceChoiceEl.classList.add("hidden");
  menuEl.classList.remove("hidden");
  mobileControlsEl.classList.toggle("hidden", !inputState.mobile);
  resetJoystick();
  hintEl.textContent = inputState.mobile ? "Joystick: up/down drive, left/right turn" : "W/S drive, A/D turn";
}

function resetJoystick() {
  inputState.steer = 0;
  inputState.throttle = 0;
  inputState.joystickPointerId = null;
  joystickStickEl.style.transform = "translate(-50%, -50%)";
}

function updateJoystickFromPointer(event) {
  const rect = joystickEl.getBoundingClientRect();
  const centerX = rect.left + rect.width * 0.5;
  const centerY = rect.top + rect.height * 0.5;
  const maxRadius = rect.width * 0.34;
  const dx = event.clientX - centerX;
  const dy = event.clientY - centerY;
  const distance = Math.hypot(dx, dy);
  const limited = distance > maxRadius ? maxRadius / distance : 1;
  const stickX = dx * limited;
  const stickY = dy * limited;
  const nx = clamp(stickX / maxRadius, -1, 1);
  const ny = clamp(stickY / maxRadius, -1, 1);
  const steerDeadzone = 0.16;
  const throttleDeadzone = 0.1;
  const steerAmount = Math.abs(nx) <= steerDeadzone
    ? 0
    : Math.pow((Math.abs(nx) - steerDeadzone) / (1 - steerDeadzone), 1.55) * Math.sign(nx);
  const throttleAmount = Math.abs(ny) <= throttleDeadzone
    ? 0
    : ((Math.abs(ny) - throttleDeadzone) / (1 - throttleDeadzone)) * Math.sign(ny);

  inputState.steer = -steerAmount * 0.78;
  inputState.throttle = clamp(-throttleAmount, -1, 1);
  joystickStickEl.style.transform = `translate(calc(-50% + ${stickX}px), calc(-50% + ${stickY}px))`;
}

function resetGame() {
  if (document.pointerLockElement === canvas) document.exitPointerLock();
  gameMode = "driving";
  transitionLock = false;
  setTransition(false);
  world.visible = true;
  player.group.visible = true;
  minimapEl.classList.remove("hidden");
  if (storeState.group) storeState.group.visible = false;
  storeState.hp = 100;
  storeState.dead = false;
  storeState.deathY = 0;
  if (storeState.character) storeState.character.rotation.set(0, storeState.angle, 0);
  updateStoreHealthHud();

  player.x = 0;
  player.z = 48;
  player.vx = 0;
  player.vz = 0;
  player.angle = 0;
  player.steer = 0;
  player.steerCharge = 0;
  player.y = 0;
  player.roll = 0;
  player.pitch = 0;
  player.nextCrashFx = 0;
  syncVehicle(player);

  for (const cop of cops) scene.remove(cop.group);
  for (const car of traffic) scene.remove(car.group);
  for (const p of smoke) {
    scene.remove(p.mesh);
    p.mesh.material.dispose();
  }
  for (const mark of skidMarks) {
    scene.remove(mark.mesh);
    mark.mesh.geometry.dispose();
    mark.mesh.material.dispose();
  }
  for (const line of speedLines) {
    scene.remove(line.mesh);
    line.mesh.geometry.dispose();
    line.mesh.material.dispose();
  }
  for (const part of debris) {
    scene.remove(part.mesh);
    part.mesh.geometry.dispose();
    part.mesh.material.dispose();
  }
  for (const p of tireParticles) {
    scene.remove(p.mesh);
    p.mesh.material.dispose();
  }
  for (const chunk of chunks.values()) disposeChunk(chunk);
  chunks.clear();
  colliders.length = 0;
  cops.length = 0;
  traffic.length = 0;
  smoke.length = 0;
  skidMarks.length = 0;
  speedLines.length = 0;
  debris.length = 0;
  tireParticles.length = 0;
  fallingTrees.length = 0;
  updateChunks();

  money = 0;
  arrestTime = 0;
  chaseTime = 0;
  backupTime = 0;
  idleHeat = 0;
  lastPlayerX = player.x;
  lastPlayerZ = player.z;
  cameraState.position.set(player.x, 210, player.z + 210);
  cameraState.target.set(player.x, 0, player.z - 28);
  cameraState.shake = 0;
  cameraState.tilt = 0;
  camera.fov = 52.5;
  camera.updateProjectionMatrix();
  running = true;
  gameOver = false;
  document.body.classList.remove("arrested");
  menuEl.classList.add("hidden");
  gameOverEl.classList.add("hidden");
  arrestFx.style.opacity = "0";
  damageFxEl.style.opacity = "0";
  hintEl.textContent = "Police arrives in 3 seconds";
  updateWantedMeter();
  updateGameCodeHud();
}

function loseGame() {
  if (gameOver) return;
  showNotification(`${playerName} got arrested`, true);
  if (multiplayer.mode === "host") {
    broadcastNetworkMessage({ type: "event", event: "arrested", name: playerName });
  } else if (multiplayer.mode === "client") {
    sendToConnection(multiplayer.hostConnection, { type: "event", event: "arrested", name: playerName });
  }
  gameOver = true;
  running = false;
  document.body.classList.add("arrested");
  gameOverEl.classList.remove("hidden");
  arrestFx.style.opacity = "0.95";
}

function update(dt) {
  if (gameMode === "driving") updateChunks();
  if (running && !gameOver && gameMode === "driving") {
    updatePlayer(dt);
    checkSMarketEntrance();
    if (worldHostControlsSimulation()) {
      updateTraffic(dt);
      updateCops(dt);
    } else {
      updateNetworkWorldVehicles(dt);
    }
    updateCollisions(dt, worldHostControlsSimulation());
    sendNetworkState(dt);
    if (chaseTime > 3.2 && cops.length > 0) hintEl.textContent += ` | ${cops.length} cops`;
  } else if (running && !gameOver && gameMode === "store") {
    moveStoreCharacter(dt);
    updateStorePunch(dt);
    updateStoreDeath(dt);
    updateStoreHealthHud();
  }
  updateWantedMeter();
  updatePoliceLights(dt);
  updateRemotePlayers(dt);
  updateDriveEffects(dt);
  updateGlows(dt);
  if (gameMode === "store") {
    updateStoreCamera(dt);
  } else {
    updateCamera(dt);
    drawMinimap();
  }
}

function loop() {
  const dt = Math.min(clock.getDelta(), 0.033);
  update(dt);
  renderer.render(scene, camera);
  requestAnimationFrame(loop);
}

window.addEventListener("resize", resize);
window.addEventListener("mousemove", handleStoreMouseLook);
window.addEventListener("mousedown", startStorePunch);
window.addEventListener("mouseup", releaseStorePunch);
document.addEventListener("pointerlockchange", updatePointerLockHint);
window.addEventListener("keydown", (event) => {
  keys.add(event.key.toLowerCase());
  if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(event.key)) event.preventDefault();
});
window.addEventListener("keyup", (event) => keys.delete(event.key.toLowerCase()));
playerNameInput.value = playerName;
nameFormEl.addEventListener("submit", (event) => {
  event.preventDefault();
  submitPlayerName();
});
phoneButton.addEventListener("click", () => chooseDevice("phone"));
computerButton.addEventListener("click", () => chooseDevice("computer"));
joystickEl.addEventListener("pointerdown", (event) => {
  if (!inputState.mobile) return;
  inputState.joystickPointerId = event.pointerId;
  joystickEl.setPointerCapture(event.pointerId);
  updateJoystickFromPointer(event);
});
joystickEl.addEventListener("pointermove", (event) => {
  if (!inputState.mobile || inputState.joystickPointerId !== event.pointerId) return;
  updateJoystickFromPointer(event);
});
joystickEl.addEventListener("pointerup", (event) => {
  if (inputState.joystickPointerId === event.pointerId) resetJoystick();
});
joystickEl.addEventListener("pointercancel", (event) => {
  if (inputState.joystickPointerId === event.pointerId) resetJoystick();
});
canvas.addEventListener("click", requestStorePointerLock);
singleplayerButton.addEventListener("click", startSingleplayer);
createGameButton.addEventListener("click", createGame);
joinGameButton.addEventListener("click", showJoinGame);
joinPublicButton.addEventListener("click", joinPublicServer);
joinCodeInput.addEventListener("input", () => {
  joinCodeInput.value = joinCodeInput.value.replace(/\D/g, "").slice(0, 6);
});
joinForm.addEventListener("submit", (event) => {
  event.preventDefault();
  joinGame(joinCodeInput.value);
});
restartButton.addEventListener("click", resetGame);

resize();
createSMarketInterior();
updateChunks();
updateCamera(0.016);
if (new URLSearchParams(window.location.search).has("play")) {
  playerName = cleanPlayerName(playerName || "Driver");
  nameScreenEl.classList.add("hidden");
  chooseDevice("computer");
  resetGame();
}
loop();
