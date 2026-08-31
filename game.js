import * as THREE from "./assets/three.module.js";
import { GLTFLoader } from "./assets/GLTFLoader.js";

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
const mobileJumpButton = document.getElementById("mobileJumpButton");
const mobileActionButton = document.getElementById("mobileActionButton");
const mobilePunchButton = document.getElementById("mobilePunchButton");
const mobileUseButton = document.getElementById("mobileUseButton");
const menuEl = document.getElementById("menu");
const customizeButton = document.getElementById("customizeButton");
const customizeScreenEl = document.getElementById("customizeScreen");
const saveCustomizeButton = document.getElementById("saveCustomizeButton");
const backCustomizeButton = document.getElementById("backCustomizeButton");
const previewHeadEl = document.getElementById("previewHead");
const previewHairEl = document.getElementById("previewHair");
const previewTorsoEl = document.getElementById("previewTorso");
const previewLeftArmEl = document.getElementById("previewLeftArm");
const previewRightArmEl = document.getElementById("previewRightArm");
const previewLeftLegEl = document.getElementById("previewLeftLeg");
const previewRightLegEl = document.getElementById("previewRightLeg");
const gameOverEl = document.getElementById("gameOver");
const storeDeathScreenEl = document.getElementById("storeDeathScreen");
const storeDeathAttackerEl = document.getElementById("storeDeathAttacker");
const storeRespawnButton = document.getElementById("storeRespawnButton");
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
const storeHealthLabelEl = storeHealthEl.querySelector("span");
const storeHealthFillEl = storeHealthEl.querySelector("b");
const purchasePromptEl = document.getElementById("purchasePrompt");
const purchasePromptKeyEl = purchasePromptEl.querySelector("span");

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
  lookPointerId: null,
  lookX: 0,
  lookY: 0,
  jumpQueued: false,
};

const audioState = {
  ctx: null,
  master: null,
  engineOsc: null,
  engineGain: null,
  driftSource: null,
  driftGain: null,
  sirenOsc: null,
  sirenGain: null,
  sirenPhase: 0,
  driveSpeed: 0,
  driveThrottle: 0,
  driftIntensity: 0,
  engineGear: 1,
  engineRpm: 0,
  engineShiftTimer: 0,
  engineRedlineTimer: 0,
  storeMoving: false,
  nextFootstep: 0,
  footstepSide: 0,
  nextDrinkGulp: 0,
  lastCrash: 0,
};
const AUDIO_MASTER_VOLUME = 0.98;
const AUDIO_SFX_BOOST = 3.6;
const clock = new THREE.Clock();
const gltfLoader = new GLTFLoader();
let seed = Math.floor(Math.random() * 999999);
const CHUNK = 260;
const ROAD = 92;
const LANE_OFFSET = ROAD * 0.23;
const ROAD_SPACING = 760;
const SIDE_ROAD_SPACING = 1040;
const MAP_PRELOAD_RADIUS = 5;
const MAP_KEEP_RADIUS = 6;
const MAX_TRAFFIC = 11;
const TRAFFIC_SPAWN_MIN = 980;
const TRAFFIC_SPAWN_MAX = 1550;
const TRAFFIC_DESPAWN_DISTANCE = 1900;
const TRAFFIC_ARCHETYPES = Object.freeze([
  { id: "sedan", label: "Sedan", weight: 30, halfWidth: 14.4, halfLength: 26.2, mass: 1, maxSpeed: 90, accel: 92, grip: 5.6, turnRate: 1.8 },
  { id: "wagon", label: "Farmari", weight: 22, halfWidth: 14.6, halfLength: 28.4, mass: 1.08, maxSpeed: 86, accel: 87, grip: 5.8, turnRate: 1.72 },
  { id: "suv", label: "Maastoauto", weight: 17, halfWidth: 15.8, halfLength: 28.8, mass: 1.3, maxSpeed: 82, accel: 79, grip: 5.25, turnRate: 1.58 },
  { id: "van", label: "Pakettiauto", weight: 12, halfWidth: 16.1, halfLength: 30.2, mass: 1.45, maxSpeed: 76, accel: 70, grip: 5.1, turnRate: 1.42 },
  { id: "pickup", label: "Pickup", weight: 10, halfWidth: 15.7, halfLength: 30.5, mass: 1.34, maxSpeed: 84, accel: 77, grip: 4.9, turnRate: 1.52 },
  { id: "sports", label: "Urheiluauto", weight: 7, halfWidth: 15.2, halfLength: 27.5, mass: 0.94, maxSpeed: 124, accel: 112, grip: 6.25, turnRate: 2.05 },
  { id: "supercar", label: "Superauto", weight: 2, halfWidth: 16.2, halfLength: 28.2, mass: 0.9, maxSpeed: 148, accel: 128, grip: 6.7, turnRate: 2.2 },
]);
const TRAFFIC_ARCHETYPE_BY_ID = Object.freeze(Object.fromEntries(TRAFFIC_ARCHETYPES.map((archetype) => [archetype.id, archetype])));
const COP_DESPAWN_DISTANCE = 2300;
const COP_ARREST_RADIUS = 76;
const POLICE_KINDS = new Set(["cop", "swat", "interceptor"]);
const POLICE_ROLES = Object.freeze({
  PURSUIT: "pursuit",
  INTERCEPTOR: "interceptor",
  ROADBLOCK: "roadblock",
  SEARCH: "search",
  SUPPORT: "support",
});
const WANTED_TIERS = Object.freeze([
  { maxUnits: 0, spawnInterval: 99, loseDelay: 0, escapeDistance: 0, prediction: 0, roadblocks: 0, helicopters: 0 },
  { maxUnits: 4, spawnInterval: 4.8, loseDelay: 12, escapeDistance: 650, prediction: 0.35, roadblocks: 0, helicopters: 0, escalateAfter: 14 },
  { maxUnits: 6, spawnInterval: 3.9, loseDelay: 17, escapeDistance: 740, prediction: 0.9, roadblocks: 1, helicopters: 0, escalateAfter: 19 },
  { maxUnits: 8, spawnInterval: 3.3, loseDelay: 23, escapeDistance: 830, prediction: 1.3, roadblocks: 2, helicopters: 0, escalateAfter: 24 },
  { maxUnits: 10, spawnInterval: 2.8, loseDelay: 31, escapeDistance: 930, prediction: 1.85, roadblocks: 3, helicopters: 0, escalateAfter: 30 },
  { maxUnits: 13, spawnInterval: 2.25, loseDelay: 42, escapeDistance: 1040, prediction: 2.45, roadblocks: 4, helicopters: 2, escalateAfter: Infinity },
]);
const POLICE_SPAWN_MIN = 560;
const POLICE_SPAWN_MAX = 1280;
const POLICE_INITIAL_DISPATCH_DELAY = 1.6;
const ROADBLOCK_LIFETIME = 38;
const MIN_WANTED_LEVEL = 1;
const PLAYER_MAX_HP = 300;
const VENDOR_MAX_HP = 300;
const VENDOR_NAME = "OuTii";
const VENDOR_KNIFE_DAMAGE = 100;
const VENDOR_KNIFE_COOLDOWN = 2;
const OUTSIDE_CHARACTER_SCALE = 0.46;

const mats = {
  grass: new THREE.MeshLambertMaterial({ color: 0x668f59 }),
  field: new THREE.MeshLambertMaterial({ color: 0x9b9d58 }),
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
  counter: new THREE.MeshLambertMaterial({ color: 0x232928 }),
  counterTop: new THREE.MeshLambertMaterial({ color: 0xd8d3be }),
  vendorApron: new THREE.MeshLambertMaterial({ color: 0x159a55 }),
  megaforceBlue: new THREE.MeshBasicMaterial({ color: 0x17a6ff }),
  megaforceGlow: new THREE.MeshBasicMaterial({ color: 0x25ff80, transparent: true, opacity: 0.38, depthWrite: false }),
  megaforceLiquid: new THREE.MeshBasicMaterial({ color: 0xffd84a, transparent: true, opacity: 0.82, depthWrite: false }),
  personBody: new THREE.MeshLambertMaterial({ color: 0x2f6fd0 }),
  personShirtLight: new THREE.MeshLambertMaterial({ color: 0x4b8dff }),
  personPants: new THREE.MeshLambertMaterial({ color: 0x123d87 }),
  personHead: new THREE.MeshLambertMaterial({ color: 0xf1c08a }),
  personSkinShadow: new THREE.MeshLambertMaterial({ color: 0xc99665 }),
  personHair: new THREE.MeshLambertMaterial({ color: 0x171411 }),
  personShoe: new THREE.MeshLambertMaterial({ color: 0x111315 }),
  eyeWhite: new THREE.MeshBasicMaterial({ color: 0xf3f2e8 }),
  pumpBlue: new THREE.MeshLambertMaterial({ color: 0x2a66c9 }),
  pumpRed: new THREE.MeshLambertMaterial({ color: 0xdc2f2f }),
  pumpDark: new THREE.MeshLambertMaterial({ color: 0x1f2427 }),
  redCar: new THREE.MeshLambertMaterial({ color: 0xe91518 }),
  copWhite: new THREE.MeshLambertMaterial({ color: 0xf2f2ee }),
  copBlue: new THREE.MeshLambertMaterial({ color: 0x174fe6 }),
  copRed: new THREE.MeshLambertMaterial({ color: 0xe61521 }),
  swat: new THREE.MeshLambertMaterial({ color: 0x27343b }),
  interceptor: new THREE.MeshLambertMaterial({ color: 0x142a53 }),
  policeBarrier: new THREE.MeshLambertMaterial({ color: 0xf2eee3 }),
  policeBarrierStripe: new THREE.MeshBasicMaterial({ color: 0xf05a28 }),
  spikeStrip: new THREE.MeshLambertMaterial({ color: 0x17191a }),
  helicopter: new THREE.MeshLambertMaterial({ color: 0x263943 }),
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
  roofDark: new THREE.MeshLambertMaterial({ color: 0x4f5558 }),
  window: new THREE.MeshLambertMaterial({ color: 0x91bed0, emissive: 0x182a30 }),
  windowWarm: new THREE.MeshLambertMaterial({ color: 0xe8c77c, emissive: 0x3a2b12 }),
  door: new THREE.MeshLambertMaterial({ color: 0x684735 }),
  foundation: new THREE.MeshLambertMaterial({ color: 0x8b8d86 }),
  lawn: new THREE.MeshLambertMaterial({ color: 0x699e59 }),
  hedge: new THREE.MeshLambertMaterial({ color: 0x376f3f }),
  fence: new THREE.MeshLambertMaterial({ color: 0xb7aa86 }),
  hay: new THREE.MeshLambertMaterial({ color: 0xc7a84c }),
  metal: new THREE.MeshLambertMaterial({ color: 0x687176 }),
};

const buildingMats = [
  new THREE.MeshLambertMaterial({ color: 0xa95845 }),
  new THREE.MeshLambertMaterial({ color: 0xd5c48f }),
  new THREE.MeshLambertMaterial({ color: 0xb8c5c1 }),
  new THREE.MeshLambertMaterial({ color: 0xb89458 }),
  new THREE.MeshLambertMaterial({ color: 0x78868d }),
];

const chunks = new Map();
const colliders = [];
const cops = [];
const policeHelicopters = [];
const policeRoadblocks = [];
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
const policeState = {
  level: MIN_WANTED_LEVEL,
  dispatchPending: true,
  escalationTimer: 0,
  unseenTimer: 0,
  decayTimer: 0,
  spawnTimer: 0,
  roadblockTimer: 0,
  helicopterTimer: 0,
  sightCheckTimer: 0,
  hasVisual: false,
  visualSource: "dispatch",
  lastKnownX: 0,
  lastKnownZ: 48,
  lastKnownVx: 0,
  lastKnownVz: 0,
  lastKnownAngle: 0,
  lastSeenAgo: 0,
  searchPhase: 0,
};
let playerName = localStorage.getItem("policeGetawayName") || "";
let playerColor = colorForName(playerName || "Driver");
const CHARACTER_STYLE_STORAGE = "policeGetawayCharacterStyle";
const CHARACTER_PALETTES = {
  skin: ["#f1c08a", "#d99b64", "#9f6b45", "#6a4532", "#f5d7ad", "#c7866a"],
  hair: ["#171411", "#4a2a14", "#d7b05e", "#7b4930", "#0f0f10", "#c74b31"],
  shirt: ["#12a8c8", "#2f6fd0", "#e2363d", "#1ca35a", "#f0d44e", "#20252b", "#8f52d7"],
  pants: ["#6f8491", "#123d87", "#27313a", "#395642", "#7d512e", "#6d6d72", "#111315"],
};
const DEFAULT_CHARACTER_STYLE = {
  skin: "#f1c08a",
  hair: "#171411",
  shirt: "#12a8c8",
  pants: "#6f8491",
};
let characterStyle = loadCharacterStyle();
let lastWantedNoticeLevel = 0;
let gameMode = "driving";
let transitionLock = false;
let speedBoostUntil = 0;
let megaforceTemplate = null;
let megaforceLoading = false;
const megaforceModelCallbacks = [];

const outsideState = {
  character: null,
  x: 0,
  z: 0,
  angle: 0,
  walkCycle: 0,
  carjackTarget: null,
  carjackTimer: 0,
  carjackDuration: 3,
};

const SMARKET_ENTRANCE = { x: -646, z: 20, radius: 42 };
const SMARKET_EXIT = { x: 6000, z: 306, radius: 64 };
const storeState = {
  group: null,
  character: null,
  fist: null,
  x: 6000,
  y: 0,
  z: 220,
  angle: Math.PI,
  cameraYaw: Math.PI,
  pitch: 0,
  cameraMode: "first",
  turnVelocity: 0,
  walkCycle: 0,
  vy: 0,
  grounded: true,
  punchCharging: false,
  punchCharge: 0,
  punchTimer: 0,
  punchCooldown: 0,
  punchCooldownDuration: 0.72,
  lastPunchDamage: 0,
  damageTimer: 0,
  damageShake: 0,
  hp: PLAYER_MAX_HP,
  dead: false,
  deathY: 0,
  deathVy: 0,
  deathVx: 0,
  deathVz: 0,
  deathRoll: 0,
  deathPitch: 0,
  deathSpin: 0,
  deathTimer: 0,
  deathLanded: false,
  deathAttacker: "",
  colliders: [],
  impactFx: [],
  vendor: null,
  vendorHp: VENDOR_MAX_HP,
  vendorDead: false,
  vendorRespawnTimer: 0,
  vendorDeathY: 0,
  vendorDeathVy: 0,
  vendorDeathVx: 0,
  vendorDeathVz: 0,
  vendorDeathRoll: 0,
  vendorDeathPitch: 0,
  vendorDeathSpin: 0,
  vendorDeathTimer: 0,
  vendorDeathLanded: false,
  vendorAggroPeerId: "",
  vendorAggroTimer: 0,
  vendorAttackCooldown: 0,
  vendorAttackTimer: 0,
  vendorWalkCycle: 0,
  vendorKnife: null,
  scanner: null,
  megaforceDisplay: null,
  purchaseFx: null,
  purchaseTimer: 0,
  purchaseDuration: 0,
  drinkCan: null,
  hasMegaforce: false,
  drinking: false,
  drinkProgress: 0,
  drinkTimer: 0,
  drinkDuration: 0,
  boostReady: false,
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
  body: makeCarShellGeometry(29.5, 10.5, 52),
  hood: makeHoodGeometry(27, 5.2, 18),
  trunkBox: makeHoodGeometry(27, 5.6, 16),
  cabinFrame: makeCarShellGeometry(23, 15.5, 27),
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
  grille: new THREE.BoxGeometry(13, 4.2, 1.2),
  plate: new THREE.BoxGeometry(8.5, 2.4, 0.7),
  sideSkirt: new THREE.BoxGeometry(2.2, 2.5, 35),
  mirror: new THREE.BoxGeometry(3.4, 2.4, 5),
  policeBeacon: new THREE.BoxGeometry(7.4, 2.4, 4.2),
  policeGlow: new THREE.CircleGeometry(32, 24),
  arrestZone: new THREE.RingGeometry(COP_ARREST_RADIUS - 2.8, COP_ARREST_RADIUS, 72),
  wheel: new THREE.CylinderGeometry(4.8, 4.8, 5.4, 20),
  hubcap: new THREE.CylinderGeometry(2.45, 2.45, 0.7, 18),
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

function smoothStep01(t) {
  const x = clamp(t, 0, 1);
  return x * x * (3 - 2 * x);
}

function initAudio() {
  if (audioState.ctx) return audioState.ctx;
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return null;
  const ctx = new AudioCtx();
  const master = ctx.createGain();
  const limiter = ctx.createDynamicsCompressor();
  master.gain.value = AUDIO_MASTER_VOLUME;
  limiter.threshold.value = -7;
  limiter.knee.value = 4;
  limiter.ratio.value = 18;
  limiter.attack.value = 0.002;
  limiter.release.value = 0.12;
  master.connect(limiter);
  limiter.connect(ctx.destination);

  const engineOsc = ctx.createOscillator();
  const engineGain = ctx.createGain();
  const engineFilter = ctx.createBiquadFilter();
  engineOsc.type = "sawtooth";
  engineOsc.frequency.value = 48;
  engineFilter.type = "lowpass";
  engineFilter.frequency.value = 520;
  engineGain.gain.value = 0;
  engineOsc.connect(engineFilter);
  engineFilter.connect(engineGain);
  engineGain.connect(master);
  engineOsc.start();

  const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
  const noise = noiseBuffer.getChannelData(0);
  for (let i = 0; i < noise.length; i++) noise[i] = Math.random() * 2 - 1;
  const driftSource = ctx.createBufferSource();
  const driftFilter = ctx.createBiquadFilter();
  const driftGain = ctx.createGain();
  driftSource.buffer = noiseBuffer;
  driftSource.loop = true;
  driftFilter.type = "bandpass";
  driftFilter.frequency.value = 920;
  driftFilter.Q.value = 1.4;
  driftGain.gain.value = 0;
  driftSource.connect(driftFilter);
  driftFilter.connect(driftGain);
  driftGain.connect(master);
  driftSource.start();

  const sirenOsc = ctx.createOscillator();
  const sirenGain = ctx.createGain();
  sirenOsc.type = "triangle";
  sirenOsc.frequency.value = 520;
  sirenGain.gain.value = 0;
  sirenOsc.connect(sirenGain);
  sirenGain.connect(master);
  sirenOsc.start();

  Object.assign(audioState, { ctx, master, limiter, engineOsc, engineGain, engineFilter, driftSource, driftGain, driftFilter, sirenOsc, sirenGain });
  return ctx;
}

function unlockAudio() {
  const ctx = initAudio();
  if (ctx && ctx.state === "suspended") ctx.resume();
}

function playTone(freq, duration = 0.12, type = "sine", gain = 0.08, delay = 0) {
  const ctx = initAudio();
  if (!ctx || !audioState.master) return;
  const now = ctx.currentTime + delay;
  const boostedGain = Math.min(1.15, Math.max(0.002, gain * AUDIO_SFX_BOOST));
  const osc = ctx.createOscillator();
  const amp = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, now);
  amp.gain.setValueAtTime(0.001, now);
  amp.gain.exponentialRampToValueAtTime(boostedGain, now + 0.012);
  amp.gain.exponentialRampToValueAtTime(0.001, now + duration);
  osc.connect(amp);
  amp.connect(audioState.master);
  osc.start(now);
  osc.stop(now + duration + 0.04);
}

function playNoiseHit(duration = 0.14, gain = 0.12, filterFreq = 520) {
  const ctx = initAudio();
  if (!ctx || !audioState.master) return;
  const boostedGain = Math.min(1.2, Math.max(0.002, gain * AUDIO_SFX_BOOST));
  const buffer = ctx.createBuffer(1, Math.max(1, Math.floor(ctx.sampleRate * duration)), ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
  const source = ctx.createBufferSource();
  const filter = ctx.createBiquadFilter();
  const amp = ctx.createGain();
  source.buffer = buffer;
  filter.type = "lowpass";
  filter.frequency.value = filterFreq;
  amp.gain.value = boostedGain;
  source.connect(filter);
  filter.connect(amp);
  amp.connect(audioState.master);
  source.start();
}

function playUiClick() {
  playTone(620, 0.045, "square", 0.035);
  playTone(920, 0.06, "sine", 0.025, 0.035);
}

function playUiHover() {
  playTone(760, 0.035, "sine", 0.016);
}

function playUiBack() {
  playTone(360, 0.055, "triangle", 0.035);
  playTone(260, 0.075, "triangle", 0.03, 0.045);
}

function playUiError() {
  playTone(150, 0.11, "square", 0.045);
  playTone(118, 0.13, "square", 0.035, 0.09);
}

function playConfirmSound() {
  playTone(520, 0.055, "triangle", 0.045);
  playTone(780, 0.08, "triangle", 0.04, 0.055);
  playTone(1040, 0.09, "sine", 0.03, 0.12);
}

function playPurchaseSound() {
  playTone(740, 0.08, "triangle", 0.08);
  playTone(1040, 0.12, "triangle", 0.075, 0.075);
  playNoiseHit(0.08, 0.035, 2400);
}

function playDrinkSound() {
  playNoiseHit(0.34, 0.055, 1450);
  playTone(260, 0.18, "sine", 0.028, 0.08);
}

function playDrinkGulp(progress = 0) {
  const pitch = 210 + Math.sin(progress * Math.PI * 6) * 34;
  playNoiseHit(0.085, 0.04, 980);
  playTone(pitch, 0.09, "sine", 0.034);
  playTone(pitch * 0.72, 0.075, "triangle", 0.025, 0.055);
}

function playFootstepSound(side = 0) {
  playNoiseHit(0.065, 0.04, side ? 520 : 390);
  playTone(side ? 92 : 78, 0.045, "sine", 0.018);
}

function playPunchSound(hit = false) {
  playNoiseHit(hit ? 0.16 : 0.11, hit ? 0.13 : 0.07, hit ? 620 : 980);
  if (hit) playTone(92, 0.12, "sine", 0.08);
}

function playCrashSound(power = 120) {
  const now = performance.now();
  if (now - audioState.lastCrash < 110) return;
  audioState.lastCrash = now;
  const intensity = clamp(power / 220, 0.25, 1);
  playNoiseHit(0.18 + intensity * 0.18, 0.1 + intensity * 0.2, 260 + intensity * 540);
  playTone(54 + intensity * 28, 0.24, "sawtooth", 0.08 + intensity * 0.08);
}

function playArrestSound() {
  playTone(220, 0.18, "sawtooth", 0.12);
  playTone(164, 0.28, "sawtooth", 0.12, 0.14);
  playTone(98, 0.38, "sawtooth", 0.1, 0.34);
}

function playGearShiftSound() {
  playTone(118, 0.075, "square", 0.035);
  playTone(86, 0.12, "sawtooth", 0.025, 0.045);
}

function updateAudio(dt) {
  if (!audioState.ctx) return;
  const ctx = audioState.ctx;
  const now = ctx.currentTime;
  const driving = running && !gameOver && gameMode === "driving";
  const speed = driving ? Math.abs(audioState.driveSpeed) : 0;
  const speed01 = clamp(speed / 330, 0, 1);
  const throttle01 = driving ? clamp(Math.abs(audioState.driveThrottle), 0, 1) : 0;
  const drift01 = driving ? clamp(audioState.driftIntensity, 0, 1) : 0;
  const copDistance = cops.reduce((best, cop) => Math.min(best, dist(player, cop)), Infinity);
  const siren01 = driving && cops.length > 0 ? clamp(1 - (copDistance - 150) / 760, 0.08, 0.75) : 0;

  const gearBands = [0, 68, 132, 198, 266, 338, 430];
  audioState.engineShiftTimer = Math.max(0, audioState.engineShiftTimer - dt);
  if (!driving) {
    audioState.engineGear = 1;
    audioState.engineShiftTimer = 0;
    audioState.engineRedlineTimer = 0;
  }

  let gearIndex = clamp(audioState.engineGear - 1, 0, gearBands.length - 2);
  let gearLow = gearBands[gearIndex];
  let gearHigh = gearBands[gearIndex + 1];
  let gearRange = Math.max(1, gearHigh - gearLow);
  let gearProgress = clamp((speed - gearLow) / gearRange, 0, 1);
  const nearRedline = gearProgress > 0.9 && audioState.engineRpm > 0.86;

  if (driving && audioState.engineShiftTimer <= 0) {
    if (nearRedline && throttle01 > 0.16 && audioState.engineGear < gearBands.length - 1) {
      audioState.engineRedlineTimer += dt * (0.72 + throttle01 * 0.28);
      if (audioState.engineRedlineTimer >= 0.44) {
        audioState.engineGear += 1;
        audioState.engineShiftTimer = 0.3;
        audioState.engineRedlineTimer = 0;
        audioState.engineRpm *= 0.5;
        playGearShiftSound();
      }
    } else {
      audioState.engineRedlineTimer = Math.max(0, audioState.engineRedlineTimer - dt * 2.8);
    }

    const downshiftSpeed = gearLow * 0.7;
    if (audioState.engineGear > 1 && speed < downshiftSpeed) {
      audioState.engineGear -= 1;
      audioState.engineShiftTimer = 0.2;
      audioState.engineRedlineTimer = 0;
      audioState.engineRpm = Math.min(0.78, Math.max(0.42, audioState.engineRpm * 1.22));
      playGearShiftSound();
    }
  }

  gearIndex = clamp(audioState.engineGear - 1, 0, gearBands.length - 2);
  gearLow = gearBands[gearIndex];
  gearHigh = gearBands[gearIndex + 1];
  gearRange = Math.max(1, gearHigh - gearLow);
  gearProgress = clamp((speed - gearLow) / gearRange, 0, 1);
  const targetRpm = driving ? clamp(0.22 + gearProgress * 0.78 + throttle01 * 0.16, 0.18, 1) : 0;
  const shiftProgress = clamp(audioState.engineShiftTimer / 0.3, 0, 1);
  const rpmDrop = audioState.engineShiftTimer > 0 ? lerp(0.52, 0.76, shiftProgress) : 1;
  audioState.engineRpm = lerp(audioState.engineRpm, targetRpm * rpmDrop, 1 - Math.exp(-dt * (audioState.engineShiftTimer > 0 ? 13 : 7.4)));

  const gearPitchDrop = 1 - (audioState.engineGear - 1) * 0.045;
  const rpm = clamp(audioState.engineRpm, 0, 1);
  const engineFreq = (46 + rpm * 104) * gearPitchDrop;
  const clutchVolume = audioState.engineShiftTimer > 0 ? 0.72 : 1;
  const engineGain = driving ? (0.18 + throttle01 * 0.16 + rpm * 0.09 + drift01 * 0.04) * clutchVolume : 0;
  audioState.engineOsc.frequency.setTargetAtTime(engineFreq, now, 0.055);
  audioState.engineGain.gain.setTargetAtTime(engineGain, now, 0.12);
  audioState.engineFilter.frequency.setTargetAtTime(520 + rpm * 1250 + throttle01 * 340, now, 0.09);
  audioState.driftGain.gain.setTargetAtTime(drift01 * 0.58, now, 0.055);
  audioState.driftFilter.frequency.setTargetAtTime(720 + speed01 * 1550, now, 0.08);

  audioState.sirenPhase += dt * (1.15 + siren01 * 0.9);
  const sirenSweep = Math.sin(audioState.sirenPhase * Math.PI * 2) * 0.5 + 0.5;
  audioState.sirenOsc.frequency.setTargetAtTime(430 + sirenSweep * 360, now, 0.035);
  audioState.sirenGain.gain.setTargetAtTime(siren01 * 0.42, now, 0.12);

  if (running && !gameOver && gameMode === "store" && !storeState.dead && audioState.storeMoving && performance.now() > audioState.nextFootstep) {
    audioState.nextFootstep = performance.now() + 285 + Math.random() * 45;
    audioState.footstepSide = 1 - audioState.footstepSide;
    playFootstepSound(audioState.footstepSide);
  }

  if (running && !gameOver && gameMode === "store" && storeState.drinking && performance.now() > audioState.nextDrinkGulp) {
    audioState.nextDrinkGulp = performance.now() + 230 + Math.random() * 90;
    const drinkProgress = clamp(storeState.drinkProgress / Math.max(0.01, storeState.drinkDuration || 1), 0, 1);
    playDrinkGulp(drinkProgress);
  }
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

function focusX() {
  return gameMode === "walking" ? outsideState.x : player.x;
}

function focusZ() {
  return gameMode === "walking" ? outsideState.z : player.z;
}

function cleanHexColor(value, fallback) {
  const text = String(value || "").trim().toLowerCase();
  return /^#[0-9a-f]{6}$/.test(text) ? text : fallback;
}

function hexToNumber(value) {
  return Number.parseInt(String(value).replace("#", ""), 16);
}

function shadeHex(value, amount) {
  const color = new THREE.Color(cleanHexColor(value, "#ffffff"));
  color.offsetHSL(0, 0, amount);
  return `#${color.getHexString()}`;
}

function loadCharacterStyle() {
  let saved = {};
  try {
    saved = JSON.parse(localStorage.getItem(CHARACTER_STYLE_STORAGE) || "{}") || {};
  } catch {
    saved = {};
  }
  if (saved.shirt === "#2f6fd0" && saved.pants === "#123d87" && saved.hair === "#171411") {
    saved = { ...saved, shirt: DEFAULT_CHARACTER_STYLE.shirt, pants: DEFAULT_CHARACTER_STYLE.pants };
    localStorage.setItem(CHARACTER_STYLE_STORAGE, JSON.stringify(saved));
  }
  return sanitizeCharacterStyle(saved);
}

function sanitizeCharacterStyle(style = {}) {
  const clean = {};
  for (const key of Object.keys(DEFAULT_CHARACTER_STYLE)) {
    const fallback = DEFAULT_CHARACTER_STYLE[key];
    const value = cleanHexColor(style[key], fallback);
    clean[key] = CHARACTER_PALETTES[key].includes(value) ? value : fallback;
  }
  return clean;
}

function saveCharacterStyle() {
  characterStyle = sanitizeCharacterStyle(characterStyle);
  localStorage.setItem(CHARACTER_STYLE_STORAGE, JSON.stringify(characterStyle));
  applyCharacterStyleToPerson(storeState.character, characterStyle);
  if (storeState.fist) applyCharacterStyleToPerson(storeState.fist, characterStyle);
  applyCharacterStyleToPerson(outsideState.character, characterStyle);
}

function characterStyleMaterials(style = characterStyle) {
  const clean = sanitizeCharacterStyle(style);
  return {
    shirt: new THREE.MeshLambertMaterial({ color: hexToNumber(clean.shirt) }),
    shirtLight: new THREE.MeshLambertMaterial({ color: hexToNumber(shadeHex(clean.shirt, 0.12)) }),
    pants: new THREE.MeshLambertMaterial({ color: hexToNumber(clean.pants) }),
    skin: new THREE.MeshLambertMaterial({ color: hexToNumber(clean.skin) }),
    skinShadow: new THREE.MeshLambertMaterial({ color: hexToNumber(shadeHex(clean.skin, -0.16)) }),
    hair: new THREE.MeshLambertMaterial({ color: hexToNumber(clean.hair) }),
    shoe: new THREE.MeshLambertMaterial({ color: 0x111315 }),
  };
}

function setStyleSlot(mesh, slot) {
  mesh.userData.characterSlot = slot;
  return mesh;
}

function applyCharacterStyleToPerson(root, style = characterStyle) {
  if (!root) return;
  const materials = characterStyleMaterials(style);
  root.traverse((child) => {
    const slot = child.userData?.characterSlot;
    if (!slot || !materials[slot]) return;
    child.material = materials[slot];
    if (root.userData.firstPersonRoot) {
      child.material.depthTest = false;
      child.material.depthWrite = false;
    }
  });
  root.userData.characterStyle = sanitizeCharacterStyle(style);
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

function megaforceBoostActive() {
  return performance.now() < speedBoostUntil;
}

function megaforceBoostRemaining() {
  return Math.max(0, (speedBoostUntil - performance.now()) / 1000);
}

function playerSurfaceTuning() {
  const onRoad = isRoad(player.x, player.z) || isParking(player.x, player.z);
  const boost = megaforceBoostActive() ? 1.5 : 1;
  const tune = onRoad
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
      };
  tune.maxSpeed *= boost;
  tune.accel *= boost;
  tune.reverseAccel *= boost;
  return {
    onRoad,
    boost,
    tune,
  };
}

function areaTouchesRoad(x, z, w, d, margin = 12) {
  const stepsX = Math.max(2, Math.ceil(w / 28));
  const stepsZ = Math.max(2, Math.ceil(d / 28));
  for (let ix = 0; ix <= stepsX; ix++) {
    const sx = x - w * 0.5 + (w * ix) / stepsX;
    for (let iz = 0; iz <= stepsZ; iz++) {
      const sz = z - d * 0.5 + (d * iz) / stepsZ;
      if (nearestRoad(sx, sz).distance < ROAD * 0.5 + margin) return true;
    }
  }
  return false;
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

function makeStoreNameTagTexture(name, color, hp, maxHp = PLAYER_MAX_HP) {
  const canvas = document.createElement("canvas");
  canvas.width = 384;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  const cleanName = cleanPlayerName(name).toUpperCase();
  const clampedHp = clamp(hp, 0, maxHp);
  const hpRatio = clampedHp / maxHp;
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
  ctx.fillStyle = hpRatio < 0.28 ? "#e20718" : hpRatio < 0.58 ? "#ffbe2f" : "#32f06a";
  ctx.fillRect(54, 66, 276 * hpRatio, 14);
  ctx.strokeStyle = "rgba(0, 0, 0, 0.7)";
  ctx.lineWidth = 2;
  ctx.strokeRect(54, 66, 276, 14);
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

function setStoreNameTag(remote) {
  if (!remote.storeCharacter) return;
  const hp = remote.storeTarget?.hp ?? PLAYER_MAX_HP;
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
  canvas.width = 1024;
  canvas.height = 280;
  const ctx = canvas.getContext("2d");
  const blue = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  blue.addColorStop(0, "#179ee0");
  blue.addColorStop(1, "#0874bd");
  ctx.fillStyle = blue;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "rgba(255, 255, 255, 0.22)";
  ctx.fillRect(0, 0, canvas.width, 18);

  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.roundRect(42, 43, 176, 176, 34);
  ctx.fill();
  const logoGradient = ctx.createLinearGradient(58, 56, 202, 208);
  logoGradient.addColorStop(0, "#41b94b");
  logoGradient.addColorStop(0.52, "#18a957");
  logoGradient.addColorStop(0.53, "#169add");
  logoGradient.addColorStop(1, "#0877c4");
  ctx.fillStyle = logoGradient;
  ctx.font = "italic 900 142px Arial, Helvetica, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("S", 130, 135);

  ctx.font = "900 112px Arial, Helvetica, sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.lineWidth = 12;
  ctx.strokeStyle = "rgba(0, 42, 76, 0.65)";
  ctx.strokeText("S-MARKET", 252, 118);
  ctx.fillStyle = "#ffffff";
  ctx.fillText("S-MARKET", 252, 118);
  ctx.font = "700 39px Arial, Helvetica, sans-serif";
  ctx.fillStyle = "rgba(255, 255, 255, 0.94)";
  ctx.fillText("AVOINNA  7-22   |   SU 11-19", 258, 208);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return new THREE.MeshBasicMaterial({ map: texture, transparent: true });
}

function chooseTrafficArchetype() {
  let roll = Math.random() * TRAFFIC_ARCHETYPES.reduce((sum, archetype) => sum + archetype.weight, 0);
  for (const archetype of TRAFFIC_ARCHETYPES) {
    roll -= archetype.weight;
    if (roll <= 0) return archetype;
  }
  return TRAFFIC_ARCHETYPES[0];
}

const trafficGeometryCache = new Map();
const trafficPaintMaterialCache = new Map();

function cachedTrafficGeometry(type, dimensions, factory) {
  const key = `${type}:${dimensions.join(":")}`;
  if (!trafficGeometryCache.has(key)) trafficGeometryCache.set(key, factory());
  return trafficGeometryCache.get(key);
}

function trafficBox(width, height, depth) {
  return cachedTrafficGeometry("box", [width, height, depth], () => new THREE.BoxGeometry(width, height, depth));
}

function trafficCylinder(radius, depth, segments) {
  return cachedTrafficGeometry("cylinder", [radius, depth, segments], () => new THREE.CylinderGeometry(radius, radius, depth, segments));
}

function trafficShell(width, height, depth) {
  return cachedTrafficGeometry("shell", [width, height, depth], () => makeCarShellGeometry(width, height, depth));
}

function trafficCabin(width, height, depth, topScaleX, topScaleZ) {
  return cachedTrafficGeometry("cabin", [width, height, depth, topScaleX, topScaleZ], () => makeTaperedBoxGeometry(width, height, depth, topScaleX, topScaleZ));
}

function trafficHood(width, height, depth) {
  return cachedTrafficGeometry("hood", [width, height, depth], () => makeHoodGeometry(width, height, depth));
}

function trafficPaintMaterial(color) {
  if (!trafficPaintMaterialCache.has(color)) trafficPaintMaterialCache.set(color, new THREE.MeshLambertMaterial({ color }));
  return trafficPaintMaterialCache.get(color);
}

function addTrafficVehicleModel(addPart, material, archetype) {
  const id = archetype.id;
  const width = archetype.halfWidth * 2 - 0.8;
  const length = archetype.halfLength * 2 - 1.2;
  let bodyHeight = 9.2;
  let cabinHeight = 13.5;
  let cabinLength = 25;
  let cabinZ = 0;
  let wheelRadius = 4.8;
  let wheelFront = -15.8;
  let wheelRear = 15.8;

  if (id === "wagon") {
    bodyHeight = 10;
    cabinHeight = 15.5;
    cabinLength = 34;
    cabinZ = 2.5;
    wheelFront = -17;
    wheelRear = 18;
  } else if (id === "suv") {
    bodyHeight = 12.5;
    cabinHeight = 18;
    cabinLength = 32;
    cabinZ = 2;
    wheelRadius = 5.8;
    wheelFront = -17.2;
    wheelRear = 17.2;
  } else if (id === "van") {
    bodyHeight = 14;
    cabinHeight = 24;
    cabinLength = 44;
    cabinZ = 4;
    wheelRadius = 5.3;
    wheelFront = -18.2;
    wheelRear = 19;
  } else if (id === "pickup") {
    bodyHeight = 11;
    cabinHeight = 17;
    cabinLength = 22;
    cabinZ = -7;
    wheelRadius = 5.7;
    wheelFront = -18;
    wheelRear = 19;
  } else if (id === "sports") {
    bodyHeight = 7;
    cabinHeight = 10.5;
    cabinLength = 20;
    cabinZ = 2;
    wheelRadius = 4.9;
    wheelFront = -16.5;
    wheelRear = 16.5;
  } else if (id === "supercar") {
    bodyHeight = 6.2;
    cabinHeight = 9;
    cabinLength = 18;
    cabinZ = 2.5;
    wheelRadius = 5.1;
    wheelFront = -17;
    wheelRear = 17;
  }

  addPart(trafficShell(width, bodyHeight, length), material, 0, 2, 0);

  if (id === "van") {
    addPart(trafficBox(width * 0.9, cabinHeight, cabinLength), material, 0, bodyHeight + cabinHeight * 0.45, cabinZ);
    addPart(trafficBox(width * 0.72, 9, 0.9), mats.glass, 0, 24, -18.4);
    for (const side of [-1, 1]) {
      addPart(trafficBox(0.8, 8, 10), mats.glass, side * width * 0.46, 24, -11);
      addPart(trafficBox(0.9, 12, 1), mats.outline, side * width * 0.46, 18, 8);
      addPart(trafficBox(0.9, 1, 13), mats.outline, side * width * 0.46, 12, 8);
    }
    addPart(trafficBox(width * 0.78, 1.2, cabinLength * 0.78), mats.outline, 0, 37, cabinZ);
  } else if (id === "pickup") {
    addPart(trafficCabin(width * 0.82, cabinHeight, cabinLength, 0.82, 0.84), material, 0, bodyHeight * 0.72, cabinZ);
    addPart(trafficBox(width * 0.62, 7.5, 0.8), mats.glass, 0, 18.5, -17.8);
    for (const side of [-1, 1]) addPart(trafficBox(0.8, 7.5, 8), mats.glass, side * width * 0.42, 18.5, -7.5);
    addPart(trafficBox(width * 0.86, 2, 20), mats.outline, 0, 7.8, 17.2);
    addPart(trafficBox(2, 8, 21), material, -width * 0.43, 11, 17.2);
    addPart(trafficBox(2, 8, 21), material, width * 0.43, 11, 17.2);
    addPart(trafficBox(width * 0.88, 8, 2), material, 0, 11, 27);
  } else {
    addPart(trafficCabin(width * (id === "supercar" ? 0.72 : 0.78), cabinHeight, cabinLength, 0.76, id === "wagon" || id === "suv" ? 0.9 : 0.78), material, 0, bodyHeight * 0.72, cabinZ);
    const glassY = bodyHeight + cabinHeight * 0.64;
    const glassLength = cabinLength * 0.34;
    addPart(trafficBox(width * 0.58, cabinHeight * 0.46, 0.8), mats.glass, 0, glassY, cabinZ - cabinLength * 0.42, -0.1);
    addPart(trafficBox(width * 0.56, cabinHeight * 0.42, 0.8), mats.glass, 0, glassY - 0.2, cabinZ + cabinLength * 0.42, 0.1);
    for (const side of [-1, 1]) {
      addPart(trafficBox(0.75, cabinHeight * 0.42, glassLength), mats.glass, side * width * 0.4, glassY, cabinZ - cabinLength * 0.18);
      addPart(trafficBox(0.75, cabinHeight * 0.42, glassLength), mats.glass, side * width * 0.4, glassY, cabinZ + cabinLength * 0.2);
    }
    addPart(trafficBox(width * 0.58, 1.8, cabinLength * 0.72), material, 0, bodyHeight + cabinHeight * 0.96, cabinZ);
  }

  if (id === "suv") {
    addPart(trafficBox(width * 0.72, 1.4, 35), mats.outline, 0, 35, 2);
    addPart(trafficBox(2, 2.5, 35), mats.metal, -8, 37, 2);
    addPart(trafficBox(2, 2.5, 35), mats.metal, 8, 37, 2);
  } else if (id === "wagon") {
    addPart(trafficBox(2, 1.8, 31), mats.metal, -7, 31, 3);
    addPart(trafficBox(2, 1.8, 31), mats.metal, 7, 31, 3);
  } else if (id === "sports" || id === "supercar") {
    addPart(trafficHood(width * 0.92, id === "supercar" ? 2.2 : 3, 18), material, 0, 7, -18);
    addPart(trafficBox(width * 0.76, 1.8, id === "supercar" ? 8 : 6), mats.outline, 0, 12, 23.5);
    addPart(trafficBox(2, 5, 2), mats.outline, -9, 9.5, 23.5);
    addPart(trafficBox(2, 5, 2), mats.outline, 9, 9.5, 23.5);
    for (const side of [-1, 1]) addPart(trafficBox(1.2, 5, 10), mats.outline, side * width * 0.47, 7, 7);
  }

  const lightZ = -archetype.halfLength + 0.5;
  const tailZ = archetype.halfLength - 0.5;
  const lightX = archetype.halfWidth * 0.5;
  addPart(trafficBox(5, 2, 1), mats.light, -lightX, 8.5, lightZ);
  addPart(trafficBox(5, 2, 1), mats.light, lightX, 8.5, lightZ);
  addPart(trafficBox(5, 2, 1), mats.copRed, -lightX, 8.5, tailZ);
  addPart(trafficBox(5, 2, 1), mats.copRed, lightX, 8.5, tailZ);
  addPart(trafficBox(width * 0.78, 2.2, 2), mats.tire, 0, 5.5, lightZ - 0.8);
  addPart(trafficBox(width * 0.78, 2.2, 2), mats.tire, 0, 5.5, tailZ + 0.8);
  addPart(trafficBox(width * 0.42, 3.2, 1), mats.pumpDark, 0, 7.2, lightZ - 0.3);

  const wheelX = archetype.halfWidth - 1.4;
  for (const sx of [-wheelX, wheelX]) {
    for (const sz of [wheelFront, wheelRear]) {
      addPart(trafficCylinder(wheelRadius, 5.4, 16), mats.tire, sx, wheelRadius + 0.4, sz, 0, 0, Math.PI / 2);
      addPart(trafficCylinder(wheelRadius * 0.5, 0.7, 14), mats.hubcap, sx, wheelRadius + 0.4, sz, 0, 0, Math.PI / 2);
    }
  }
}

function makeVehicle(kind, x, z, angle, paintColor = null, trafficClass = null) {
  const group = new THREE.Group();
  const policeVehicle = POLICE_KINDS.has(kind);
  const trafficVehicle = kind === "normal" || kind === "grandma" || kind === "drunk";
  const archetype = trafficVehicle ? (TRAFFIC_ARCHETYPE_BY_ID[trafficClass] || chooseTrafficArchetype()) : null;
  const trafficPalette = [0xe39a42, 0x58a6d6, 0xe0d35b, 0x58b66d, 0xb86bd6, 0xe36b78, 0xe9e7df, 0x373b42, 0x8f2430, 0x315f9b];
  const trafficColor = paintColor ?? trafficPalette[Math.floor(Math.random() * trafficPalette.length)];
  const remoteColor = paintColor ?? 0x18d2ff;
  const mat =
    kind === "player" ? mats.redCar :
    kind === "swat" ? mats.swat :
    kind === "interceptor" ? mats.interceptor :
    kind === "cop" ? mats.copWhite :
    trafficVehicle ? trafficPaintMaterial(trafficColor) :
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

  if (trafficVehicle) {
    addTrafficVehicleModel(addPart, mat, archetype);
  } else {
    addPart(carGeometry.body, mat, 0, 2.8, 0);
    addPart(carGeometry.hood, mat, 0, 10.3, -17.2);
    addPart(carGeometry.trunkBox, mat, 0, 10.5, 18.4, 0, Math.PI);
    addPart(carGeometry.cabinFrame, mat, 0, 12.2, -1.2);
    addPart(carGeometry.roof, mat, 0, 27.7, -1.4);
    addPart(carGeometry.topGlass, mats.glass, 0, 29.65, -1.4);
    addPart(carGeometry.windowDivider, mats.outline, 0, 29.5, -1.4);
    addPart(carGeometry.windshield, mats.glass, 0, 20.5, -13.2, -0.14);
    addPart(carGeometry.windshield, mats.glass, 0, 20.2, 10.6, 0.12);

    for (const sx of [-1, 1]) {
      addPart(carGeometry.sideWindow, mats.glass, sx * 10.9, 21.1, -6.2);
      addPart(carGeometry.sideWindow, mats.glass, sx * 10.9, 21.1, 3.6);
      addPart(carGeometry.handle, mats.outline, sx * 14.3, 15.5, -5.5);
      addPart(carGeometry.handle, mats.outline, sx * 14.3, 15.5, 5.2);
      addPart(carGeometry.sideSkirt, mats.tire, sx * 14.25, 5.1, 1.2);
      addPart(carGeometry.mirror, mat, sx * 13.1, 19.2, -10.4, 0, 0, sx * 0.08);
    }
  }

  if (policeVehicle) {
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
    if (kind === "swat") {
      addPart(new THREE.BoxGeometry(27, 27, 31), mats.swat, 0, 20, 8);
      addPart(new THREE.BoxGeometry(22, 9, 2), mats.copWhite, 0, 22, 24);
      addPart(new THREE.BoxGeometry(29, 5, 34), mats.outline, 0, 34, 7);
    } else if (kind === "interceptor") {
      addPart(new THREE.BoxGeometry(27, 2.5, 7), mats.outline, 0, 17, 24);
      addPart(new THREE.BoxGeometry(3, 5, 3), mats.outline, -9, 14, 24);
      addPart(new THREE.BoxGeometry(3, 5, 3), mats.outline, 9, 14, 24);
      group.scale.y = 0.9;
    }
  }

  if (!trafficVehicle) {
    addPart(carGeometry.light, mats.light, -6.9, 10.6, -25.5);
    addPart(carGeometry.light, mats.light, 6.9, 10.6, -25.5);
    addPart(carGeometry.tailLight, mats.copRed, -7.2, 10.2, 25.5);
    addPart(carGeometry.tailLight, mats.copRed, 7.2, 10.2, 25.5);
    addPart(carGeometry.bumper, mats.tire, 0, 6.2, -26.4);
    addPart(carGeometry.bumper, mats.tire, 0, 6.2, 26.4);
    addPart(carGeometry.grille, mats.pumpDark, 0, 8.8, -26.2);
    addPart(carGeometry.plate, mats.curb, 0, 5.7, -27.7);
    addPart(carGeometry.plate, mats.curb, 0, 6.2, 27.7);

    for (const sx of [-11.8, 11.8]) {
      for (const sz of [-15.6, 15.6]) {
        addPart(carGeometry.wheel, mats.tire, sx * 1.09, 5.2, sz, 0, 0, Math.PI / 2);
        addPart(carGeometry.hubcap, mats.hubcap, sx * 1.09, 5.2, sz, 0, 0, Math.PI / 2);
      }
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
    radius: archetype ? Math.hypot(archetype.halfWidth, archetype.halfLength) * 0.7 : 20.5,
    halfWidth: archetype?.halfWidth || 14.4,
    halfLength: archetype?.halfLength || 26.2,
    mass: archetype?.mass || 1,
    roadAxis: Math.random() < 0.5 ? "x" : "z",
    dir: Math.random() < 0.5 ? -1 : 1,
    timer: Math.random() * 10,
    personality: kind,
    jamTime: 0,
    escapeTimer: 0,
    escapeSide: Math.random() < 0.5 ? -1 : 1,
    reverseTimer: 0,
    escapeCooldown: 0,
    policeRole: policeVehicle ? POLICE_ROLES.PURSUIT : "",
    roleTargetX: x,
    roleTargetZ: z,
    roleTimer: 0,
    searchOffset: Math.random() * Math.PI * 2,
    deployed: false,
    paintColor: kind === "remote" ? remoteColor : trafficVehicle ? trafficColor : null,
    trafficClass: archetype?.id || null,
    trafficTune: archetype || null,
  };
  if (kind === "swat") {
    car.radius = 23.5;
    car.halfWidth = 15.2;
    car.halfLength = 29.5;
  }
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
  const deciduous = hash(Math.round(x), Math.round(z), 712) % 100 < 34;
  const lower = deciduous
    ? new THREE.Mesh(new THREE.DodecahedronGeometry(18 * scale, 1), mats.leaves)
    : new THREE.Mesh(new THREE.ConeGeometry(18 * scale, 42 * scale, 9), mats.leaves);
  lower.position.y = (deciduous ? 36 : 39) * scale;
  lower.scale.set(deciduous ? 1.18 : 1, deciduous ? 0.92 : 1, deciduous ? 1.05 : 1);
  lower.castShadow = true;
  const upper = deciduous
    ? new THREE.Mesh(new THREE.DodecahedronGeometry(14 * scale, 1), mats.leaves2)
    : new THREE.Mesh(new THREE.ConeGeometry(13 * scale, 32 * scale, 9), mats.leaves2);
  upper.position.set(deciduous ? 7 * scale : 0, (deciduous ? 51 : 62) * scale, deciduous ? -2 * scale : 0);
  upper.scale.set(deciduous ? 1.08 : 1, deciduous ? 0.82 : 1, 1);
  upper.castShadow = true;
  group.position.set(x, 0, z);
  group.add(trunk, lower, upper);
  parent.add(group);
  colliders.push({ type: "tree", x, z, r: 12 * scale, scale, group, knocked: false, chunkKey: parent.userData.chunkKey });
}

function addBuildingWindow(group, x, y, z, w, h, side = "front", warm = false) {
  const frame = makeBox(w + 3, h + 3, 1.4, mats.curb);
  const glass = makeBox(w, h, 1.8, warm ? mats.windowWarm : mats.window);
  if (side === "side") {
    frame.rotation.y = Math.PI * 0.5;
    glass.rotation.y = Math.PI * 0.5;
  }
  frame.position.set(x, y, z);
  glass.position.set(x, y, z);
  group.add(frame, glass);
}

function addBush(parent, x, z, scale = 1) {
  const bush = new THREE.Mesh(new THREE.DodecahedronGeometry(7 * scale, 0), mats.hedge);
  bush.scale.set(1.35, 0.72, 0.9);
  bush.position.set(x, 5 * scale, z);
  bush.castShadow = true;
  parent.add(bush);
}

function makeBuildingLabel(text, background = "#174e86", foreground = "#ffffff") {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "rgba(255,255,255,0.18)";
  ctx.fillRect(0, 0, canvas.width, 10);
  ctx.font = "900 64px Arial, Helvetica, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = foreground;
  ctx.fillText(text, 256, 66);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return new THREE.MeshBasicMaterial({ map: texture });
}

function makeBuilding(x, z, w, d, h, type, rng, parent) {
  const group = new THREE.Group();
  const specialVariant = type === "special" ? (hash(Math.round(x), Math.round(z), 804) % 2 ? "school" : "civic") : "";
  const mat = type === "shop" ? buildingMats[3] : type === "special" ? buildingMats[4] : buildingMats[Math.floor(rng() * 3)];
  const yard = makePlane(w + 24, d + 24, type === "shop" ? mats.concrete : mats.lawn, 0.035);
  yard.position.y = 0.035;
  const foundation = makeBox(w + 3, 5, d + 3, mats.foundation);
  foundation.position.y = 2.5;
  const base = makeBox(w, h - 4, d, mat);
  base.position.y = h * 0.5 + 2;
  group.add(yard, foundation, base);

  if (type === "shop") {
    const roof = makeBox(w + 10, 7, d + 10, mats.roofDark);
    roof.position.y = h + 3.5;
    const fascia = makeBox(w + 4, 12, 4, mats.marketBlue);
    fascia.position.set(0, h - 9, -d * 0.5 - 2);
    const awning = makeBox(w * 0.72, 4, 15, mats.roofDark);
    awning.position.set(0, h * 0.56, -d * 0.5 - 7);
    const sign = makeBox(w * 0.52, 10, 2, mats.light);
    sign.position.set(0, h - 9, -d * 0.5 - 4.2);
    const door = makeBox(16, 27, 2.2, mats.door);
    door.position.set(w * 0.26, 16, -d * 0.5 - 1.3);
    group.add(roof, fascia, awning, sign, door);
    addBuildingWindow(group, -w * 0.23, 17, -d * 0.5 - 1.2, Math.min(30, w * 0.34), 24, "front", true);
  } else {
    const roofMat = rng() < 0.42 ? mats.roofDark : mats.roof;
    const roofRise = clamp(d * 0.22, 10, 20);
    const slope = Math.atan2(roofRise, d * 0.5);
    const slopeLength = Math.hypot(d * 0.5 + 5, roofRise);
    for (const side of [-1, 1]) {
      const roof = makeBox(w + 10, 4.5, slopeLength, roofMat);
      roof.position.set(0, h + roofRise * 0.5, side * d * 0.25);
      roof.rotation.x = side * slope;
      group.add(roof);
    }

    const door = makeBox(14, 27, 2.2, mats.door);
    door.position.set(w * 0.22, 16, -d * 0.5 - 1.3);
    const step = makeBox(22, 2.5, 8, mats.concrete);
    step.position.set(w * 0.22, 1.25, -d * 0.5 - 5);
    group.add(door, step);

    const floors = h > 62 ? 2 : 1;
    for (let floor = 0; floor < floors; floor++) {
      const wy = floors === 1 ? h * 0.55 : 24 + floor * 28;
      addBuildingWindow(group, -w * 0.25, wy, -d * 0.5 - 1.2, 15, 18, "front", rng() < 0.32);
      if (w > 72) addBuildingWindow(group, 0, wy, -d * 0.5 - 1.2, 15, 18, "front", rng() < 0.28);
      addBuildingWindow(group, w * 0.5 + 1.2, wy, -d * 0.18, 15, 18, "side", rng() < 0.3);
    }

    const chimney = makeBox(8, 18, 8, mats.marketBrick);
    chimney.position.set(-w * 0.28, h + roofRise * 0.64, d * 0.08);
    group.add(chimney);
    addBush(group, -w * 0.32, -d * 0.5 - 9, 0.7 + rng() * 0.25);
  }

  if (type === "special") {
    const labelText = specialVariant === "school" ? "KOULU" : "KAUPUNGINTALO";
    const label = new THREE.Mesh(new THREE.PlaneGeometry(Math.min(w * 0.62, 62), 13), makeBuildingLabel(labelText, specialVariant === "school" ? "#cfb331" : "#315e75"));
    label.position.set(-w * 0.1, h * 0.7, -d * 0.5 - 2.5);
    label.rotation.y = Math.PI;
    label.renderOrder = 7;
    group.add(label);

    if (specialVariant === "school") {
      for (const sx of [-w * 0.3, -w * 0.1, w * 0.1]) {
        addBuildingWindow(group, sx, h * 0.42, -d * 0.5 - 1.3, 13, 19, "front", true);
      }
      const flagPole = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 1, 48, 8), mats.metal);
      flagPole.position.set(w * 0.42, 24, -d * 0.5 - 12);
      const flag = makeBox(14, 8, 0.8, mats.marketBlue);
      flag.position.set(w * 0.42 - 6.5, 43, -d * 0.5 - 12);
      group.add(flagPole, flag);
    } else {
      const tower = makeBox(24, 48, 24, buildingMats[4]);
      tower.position.set(w * 0.3, h + 18, d * 0.12);
      const towerRoof = new THREE.Mesh(new THREE.ConeGeometry(19, 22, 4), mats.roofDark);
      towerRoof.rotation.y = Math.PI * 0.25;
      towerRoof.position.set(w * 0.3, h + 53, d * 0.12);
      towerRoof.castShadow = true;
      const clock = new THREE.Mesh(new THREE.CircleGeometry(6, 20), mats.light);
      clock.position.set(w * 0.3, h + 27, d * 0.12 - 12.6);
      clock.rotation.y = Math.PI;
      group.add(tower, towerRoof, clock);
    }
  }

  group.rotation.y = Math.floor(rng() * 2) * Math.PI;
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

  const building = makeBox(440, 82, 132, mats.marketBrick);
  building.position.set(x + 42, 41, z + 82);
  const frontHall = makeBox(172, 112, 140, mats.marketWall);
  frontHall.position.set(x - 176, 56, z + 76);
  const rightWing = makeBox(190, 70, 120, mats.stationWall);
  rightWing.position.set(x + 338, 35, z + 74);
  const roof = makeBox(466, 8, 154, mats.roofDark);
  roof.position.set(x + 42, 86, z + 82);
  const hallRoof = makeBox(194, 8, 160, mats.roofDark);
  hallRoof.position.set(x - 176, 116, z + 76);
  const wingRoof = makeBox(206, 8, 138, mats.roofDark);
  wingRoof.position.set(x + 338, 74, z + 74);
  parent.add(building, frontHall, rightWing, roof, hallRoof, wingRoof);

  const lowerFacade = makeBox(438, 18, 5, mats.foundation);
  lowerFacade.position.set(x + 42, 9, z + 14);
  const upperBand = makeBox(438, 16, 5, mats.marketWall);
  upperBand.position.set(x + 42, 69, z + 14);
  parent.add(lowerFacade, upperBand);

  for (let i = 0; i < 9; i++) {
    const panelX = x - 128 + i * 49;
    const windowFrame = makeBox(39, 33, 2.4, mats.metal);
    windowFrame.position.set(panelX, 38, z + 10.8);
    const windowGlass = makeBox(33, 27, 2.8, i % 4 === 0 ? mats.windowWarm : mats.window);
    windowGlass.position.set(panelX, 38, z + 8.9);
    const brickPier = makeBox(7, 50, 5, mats.marketBrick);
    brickPier.position.set(panelX + 23, 34, z + 11.2);
    parent.add(windowFrame, windowGlass, brickPier);
  }

  const loadingDoorA = makeBox(48, 34, 3, mats.pumpDark);
  loadingDoorA.position.set(x + 312, 20, z + 10);
  const loadingDoorB = makeBox(48, 34, 3, mats.pumpDark);
  loadingDoorB.position.set(x + 370, 20, z + 10);
  const loadingCanopy = makeBox(126, 5, 22, mats.roofDark);
  loadingCanopy.position.set(x + 341, 43, z - 1);
  parent.add(loadingDoorA, loadingDoorB, loadingCanopy);

  for (const [hx, hz, hw, hd] of [[x - 42, z + 74, 54, 34], [x + 92, z + 84, 68, 38], [x + 286, z + 72, 52, 34]]) {
    const hvacBase = makeBox(hw, 8, hd, mats.metal);
    hvacBase.position.set(hx, 94, hz);
    const hvacTop = makeBox(hw * 0.72, 6, hd * 0.7, mats.foundation);
    hvacTop.position.set(hx, 101, hz);
    parent.add(hvacBase, hvacTop);
  }

  const blueFacade = makeBox(204, 63, 7, mats.marketBlue);
  blueFacade.position.set(x - 176, 79, z + 3);
  const signBack = makeBox(212, 69, 5, mats.marketGlow);
  signBack.position.set(x - 176, 79, z - 1);
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(194, 58), makeMarketSign());
  sign.position.set(x - 176, 80, z - 4.2);
  sign.rotation.y = Math.PI;
  sign.renderOrder = 8;
  parent.add(blueFacade, signBack, sign);

  const entryPad = makePlane(210, 96, mats.concrete, 0.24);
  entryPad.position.set(x - 176, 0.24, z - 52);
  entryPad.renderOrder = 3;
  parent.add(entryPad);

  const entryLeft = makeBox(13, 58, 13, mats.marketBlue);
  entryLeft.position.set(x - 235, 29, z - 3);
  const entryRight = makeBox(13, 58, 13, mats.marketBlue);
  entryRight.position.set(x - 117, 29, z - 3);
  const entryLintel = makeBox(131, 13, 14, mats.marketBlue);
  entryLintel.position.set(x - 176, 52, z - 3);
  const vestibuleRoof = makeBox(148, 6, 38, mats.roofDark);
  vestibuleRoof.position.set(x - 176, 60, z - 15);
  parent.add(entryLeft, entryRight, entryLintel, vestibuleRoof);
  addSMarketEntranceGlow(parent, x - 176, z - 5);

  for (const bx of [-244, -224, -204, -148, -128, -108]) {
    const bollard = new THREE.Mesh(new THREE.CylinderGeometry(2.1, 2.1, 15, 10), mats.marketBlue);
    bollard.position.set(x + bx, 7.5, z - 45);
    parent.add(bollard);
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

  for (let i = 0; i < 5; i++) {
    const cart = new THREE.Group();
    const basket = new THREE.Mesh(new THREE.BoxGeometry(15, 8, 18), mats.metal);
    basket.position.y = 10;
    basket.scale.set(1, 0.72, 1);
    const handle = makeBox(19, 1.5, 1.5, mats.marketBlue);
    handle.position.set(0, 16, 7);
    cart.add(basket, handle);
    for (const cx of [-6, 6]) {
      for (const cz of [-6, 6]) {
        const wheel = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 1.2, 8), mats.tire);
        wheel.rotation.z = Math.PI * 0.5;
        wheel.position.set(cx, 3, cz);
        cart.add(wheel);
      }
    }
    cart.position.set(x + 190 + i * 10, 1, z - 56);
    cart.scale.setScalar(0.78);
    parent.add(cart);
  }

  for (let i = 0; i < 5; i++) {
    const rack = new THREE.Mesh(new THREE.TorusGeometry(8, 1.2, 6, 16, Math.PI), mats.metal);
    rack.rotation.y = Math.PI * 0.5;
    rack.position.set(x - 286 + i * 16, 8, z - 51);
    parent.add(rack);
  }

  const recyclingBase = makeBox(66, 24, 28, mats.marketWall);
  recyclingBase.position.set(x + 277, 12, z - 54);
  const recyclingTop = makeBox(72, 5, 34, mats.marketBlue);
  recyclingTop.position.set(x + 277, 27, z - 54);
  parent.add(recyclingBase, recyclingTop);
  for (const offset of [-19, 0, 19]) {
    const opening = new THREE.Mesh(new THREE.CircleGeometry(5.2, 16), mats.pumpDark);
    opening.position.set(x + 277 + offset, 14, z - 68.1);
    opening.rotation.y = Math.PI;
    parent.add(opening);
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

function makePerson(style = characterStyle) {
  const group = new THREE.Group();
  const personMats = characterStyleMaterials(style);

  function detailBox(parent, x, y, z, w, h, d, material, slot = "") {
    const mesh = makeBox(w, h, d, material);
    if (slot) setStyleSlot(mesh, slot);
    mesh.position.set(x, y, z);
    parent.add(mesh);
    return mesh;
  }

  function detailSphere(parent, x, y, z, radius, scale, material, segments = 12, slot = "") {
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, segments, Math.max(8, segments - 2)), material);
    if (slot) setStyleSlot(mesh, slot);
    mesh.scale.set(scale.x, scale.y, scale.z);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }

  const hips = setStyleSlot(makeBox(15, 6, 10, personMats.pants), "pants");
  hips.position.set(0, 22, 0);
  const torso = setStyleSlot(makeBox(24, 30, 12, personMats.shirt), "shirt");
  torso.position.set(0, 39, 0);
  const shirtFront = setStyleSlot(makeBox(18, 25, 1, personMats.shirtLight), "shirtLight");
  shirtFront.position.set(0, 39, 6.25);
  const collar = setStyleSlot(makeBox(9, 2, 12.5, personMats.shirtLight), "shirtLight");
  collar.position.set(0, 53, 0);
  const neck = setStyleSlot(makeBox(6, 5, 6, personMats.skinShadow), "skinShadow");
  neck.position.set(0, 56, 0);

  const headPivot = new THREE.Group();
  headPivot.position.set(0, 57, 0);
  const head = detailSphere(headPivot, 0, 7, 0, 9, { x: 0.9, y: 1.04, z: 0.86 }, personMats.skin, 18, "skin");
  const hairCap = detailSphere(headPivot, 0, 11, -0.3, 8.8, { x: 0.93, y: 0.42, z: 0.9 }, personMats.hair, 16, "hair");
  detailBox(headPivot, 0, 11.4, 5.3, 13.5, 2.6, 2.4, personMats.hair, "hair");
  const leftEye = detailSphere(headPivot, -2.8, 7.4, 7.2, 0.72, { x: 1, y: 1.15, z: 0.5 }, mats.glass, 8);
  const rightEye = detailSphere(headPivot, 2.8, 7.4, 7.2, 0.72, { x: 1, y: 1.15, z: 0.5 }, mats.glass, 8);
  const face = detailBox(headPivot, 0, 3.8, 7.45, 5.2, 0.75, 0.48, mats.glass);

  function arm(side) {
    const pivot = new THREE.Group();
    detailBox(pivot, 0, -5, 0, 6, 10, 6, personMats.shirt, "shirt");
    detailBox(pivot, 0, -18, 0, 4.8, 17, 4.8, personMats.skin, "skin");
    detailSphere(pivot, 0, -27, 0, 2.7, { x: 0.9, y: 1, z: 0.9 }, personMats.skin, 10, "skin");
    return pivot;
  }

  function leg(side) {
    const pivot = new THREE.Group();
    detailBox(pivot, 0, -9.2, 0, 5.4, 18.4, 5.8, personMats.pants, "pants");
    detailBox(pivot, 0, -19.6, -2.4, 7, 4.2, 10.2, personMats.shoe, "shoe");
    return pivot;
  }

  const leftArm = arm(-1);
  leftArm.position.set(-15, 49, 0);
  const rightArm = arm(1);
  rightArm.position.set(15, 49, 0);
  const leftLeg = leg(-1);
  leftLeg.position.set(-4.5, 21, 0);
  const rightLeg = leg(1);
  rightLeg.position.set(4.5, 21, 0);
  const drinkCan = new THREE.Group();
  drinkCan.position.set(1.5, -24, 7.2);
  drinkCan.rotation.set(1.1, 0.1, 0.05);
  drinkCan.visible = false;
  attachMegaforceModel(drinkCan, 30);
  const drinkLiquid = makeMegisLiquidStream(0.78);
  drinkLiquid.position.set(0, -7.5, 0.6);
  drinkLiquid.rotation.set(0.9, 0, 0.05);
  drinkLiquid.visible = false;
  drinkCan.add(drinkLiquid);
  rightArm.add(drinkCan);

  group.add(hips, torso, shirtFront, collar, neck, headPivot, leftArm, rightArm, leftLeg, rightLeg);
  group.userData.characterStyle = sanitizeCharacterStyle(style);
  group.userData.leftArm = leftArm;
  group.userData.rightArm = rightArm;
  group.userData.leftLeg = leftLeg;
  group.userData.rightLeg = rightLeg;
  group.userData.head = headPivot;
  group.userData.hair = headPivot;
  group.userData.face = headPivot;
  group.userData.headMesh = head;
  group.userData.faceMesh = face;
  group.userData.hairMesh = hairCap;
  group.userData.leftEye = leftEye;
  group.userData.rightEye = rightEye;
  group.userData.drinkCan = drinkCan;
  group.userData.drinkLiquid = drinkLiquid;
  return group;
}

function makeFirstPersonFist() {
  const group = new THREE.Group();
  group.visible = false;
  const personMats = characterStyleMaterials(characterStyle);

  const arm = setStyleSlot(new THREE.Mesh(new THREE.CylinderGeometry(7.2, 4.5, 132, 24), personMats.shirt), "shirt");
  arm.rotation.x = Math.PI * 0.5;
  arm.rotation.z = -0.025;
  arm.position.set(0, 0, -74);
  arm.castShadow = true;
  arm.receiveShadow = true;

  const cuff = setStyleSlot(new THREE.Mesh(new THREE.TorusGeometry(5.1, 1.15, 10, 24), personMats.shirtLight), "shirtLight");
  cuff.position.set(0, 0, -140);
  cuff.castShadow = true;

  const fist = setStyleSlot(new THREE.Mesh(new THREE.SphereGeometry(6.8, 22, 16), personMats.skin), "skin");
  fist.scale.set(0.94, 1.12, 1.12);
  fist.position.set(0, 0, -146);
  fist.castShadow = true;
  fist.receiveShadow = true;

  const can = new THREE.Group();
  can.position.set(-3.2, 6.5, -150);
  can.rotation.set(-0.18, 0.12, -0.08);
  can.visible = false;
  can.userData.firstPersonOverlay = true;
  attachMegaforceModel(can, 44);
  const liquid = makeMegisLiquidStream(0.72);
  liquid.position.set(-1.8, 5.2, -156);
  liquid.rotation.set(0.7, 0.18, -0.18);
  liquid.visible = false;

  group.add(arm, cuff, fist, can, liquid);
  makeFirstPersonOverlay(group);
  group.userData.can = can;
  group.userData.liquid = liquid;
  group.userData.characterStyle = sanitizeCharacterStyle(characterStyle);
  group.userData.firstPersonRoot = true;
  group.position.set(30, -47, -52);
  group.rotation.set(0.12, -0.28, -0.08);
  group.scale.setScalar(0.56);
  camera.add(group);
  return group;
}

function createOutsideCharacter() {
  const character = makePerson(characterStyle);
  character.scale.setScalar(OUTSIDE_CHARACTER_SCALE);
  character.visible = false;
  scene.add(character);
  outsideState.character = character;
  return character;
}

function makeMegisLiquidStream(scale = 1) {
  const group = new THREE.Group();
  const stream = new THREE.Mesh(new THREE.CylinderGeometry(0.7 * scale, 1.05 * scale, 18 * scale, 8), mats.megaforceLiquid.clone());
  stream.rotation.x = Math.PI * 0.5;
  stream.position.set(0, 0, 0);
  const splash = new THREE.Mesh(new THREE.SphereGeometry(1.55 * scale, 8, 6), mats.megaforceLiquid.clone());
  splash.scale.set(1.45, 0.45, 0.75);
  splash.position.set(0, -0.25 * scale, -9.5 * scale);
  const dropletA = new THREE.Mesh(new THREE.SphereGeometry(0.85 * scale, 8, 6), mats.megaforceLiquid.clone());
  dropletA.position.set(1.5 * scale, -0.8 * scale, -5.6 * scale);
  const dropletB = new THREE.Mesh(new THREE.SphereGeometry(0.65 * scale, 8, 6), mats.megaforceLiquid.clone());
  dropletB.position.set(-1.2 * scale, 0.7 * scale, -7.4 * scale);
  group.add(stream, splash, dropletA, dropletB);
  group.userData.stream = stream;
  group.userData.drops = [splash, dropletA, dropletB];
  return group;
}

function updateMegisLiquidStream(group, visible, flow, seed = 0) {
  if (!group) return;
  group.visible = visible;
  if (!visible) return;
  if (group.userData.baseRotationZ === undefined) {
    group.userData.baseRotationZ = group.rotation.z;
  }
  const seedValue = typeof seed === "number"
    ? seed
    : String(seed).split("").reduce((sum, char) => sum + char.charCodeAt(0), 0) * 0.013;

  const amount = clamp(flow, 0, 1);
  const pulse = Math.sin(performance.now() * 0.055 + seedValue) * 0.5 + 0.5;
  const wobble = Math.sin(performance.now() * 0.032 + seedValue) * 0.08;
  group.scale.set(0.85 + pulse * 0.2, 0.85 + pulse * 0.14, 0.55 + amount * 0.85);
  group.rotation.z = group.userData.baseRotationZ + wobble;

  const opacity = 0.38 + amount * 0.44 + pulse * 0.12;
  group.traverse((child) => {
    if (child.material) child.material.opacity = clamp(opacity, 0.28, 0.9);
  });
  if (group.userData.stream) {
    group.userData.stream.position.z = -1.5 + pulse * 2.5;
  }
  if (group.userData.drops) {
    group.userData.drops.forEach((drop, index) => {
      if (drop.userData.baseY === undefined) drop.userData.baseY = drop.position.y;
      drop.position.y = drop.userData.baseY + Math.sin(performance.now() * 0.04 + seedValue + index) * 0.22;
      drop.scale.setScalar(0.88 + pulse * 0.2);
    });
  }
}

function makeFirstPersonOverlay(root) {
  root.traverse((child) => {
    child.renderOrder = 900;
    if (!child.material) return;
    const materials = Array.isArray(child.material) ? child.material : [child.material];
    const cloned = materials.map((material) => {
      const copy = material.clone();
      copy.depthTest = false;
      copy.depthWrite = false;
      return copy;
    });
    child.material = Array.isArray(child.material) ? cloned : cloned[0];
  });
}

function makeStoreTextMaterial(title, subtitle, bg = "#157fe0") {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 192;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "rgba(255,255,255,0.18)";
  ctx.fillRect(0, 0, canvas.width, 16);
  ctx.font = "900 54px Arial, Helvetica, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.lineWidth = 8;
  ctx.strokeStyle = "rgba(0,0,0,0.72)";
  ctx.strokeText(title, 256, 78);
  ctx.fillStyle = "#ffffff";
  ctx.fillText(title, 256, 78);
  ctx.font = "900 30px Arial, Helvetica, sans-serif";
  ctx.strokeText(subtitle, 256, 137);
  ctx.fillText(subtitle, 256, 137);
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return new THREE.MeshBasicMaterial({ map: texture });
}

function addMegaforceFallback(parent) {
  const can = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CylinderGeometry(7, 7, 22, 20), mats.megaforceBlue);
  body.castShadow = true;
  const top = new THREE.Mesh(new THREE.CylinderGeometry(7.2, 7.2, 1.2, 20), mats.hubcap);
  top.position.y = 11.6;
  const band = makeBox(15, 5, 2, mats.entranceGreenSolid);
  band.position.set(0, 2, -6.4);
  const label = makeBox(12, 8, 1.2, mats.light);
  label.position.set(0, -3, -7.1);
  can.add(body, top, band, label);
  parent.add(can);
  return can;
}

function fitMegaforceModelToMount(source, targetSize) {
  const model = source.clone(true);
  const box = new THREE.Box3().setFromObject(model);
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();
  box.getSize(size);
  box.getCenter(center);
  const maxSide = Math.max(size.x, size.y, size.z) || 1;
  const scale = targetSize / maxSide;
  model.scale.setScalar(scale);
  model.position.sub(center.multiplyScalar(scale));
  model.traverse((child) => {
    if (!child.isMesh) return;
    child.castShadow = true;
    child.receiveShadow = true;
  });
  return model;
}

function loadMegaforceTemplate(callback) {
  if (megaforceTemplate) {
    callback(megaforceTemplate);
    return;
  }
  megaforceModelCallbacks.push(callback);
  if (megaforceLoading) return;
  megaforceLoading = true;
  gltfLoader.load(
    "./assets/megis.glb",
    (gltf) => {
      megaforceTemplate = gltf.scene;
      megaforceLoading = false;
      while (megaforceModelCallbacks.length) megaforceModelCallbacks.shift()(megaforceTemplate);
    },
    undefined,
    () => {
      megaforceLoading = false;
      megaforceModelCallbacks.length = 0;
      showNotification("Megaforce model failed, using fallback can");
    }
  );
}

function attachMegaforceModel(parent, targetSize) {
  const fallback = addMegaforceFallback(parent);
  fallback.scale.setScalar(targetSize / 34);
  if (parent.userData.firstPersonOverlay) makeFirstPersonOverlay(fallback);
  loadMegaforceTemplate((source) => {
    const model = fitMegaforceModelToMount(source, targetSize);
    if (parent.userData.firstPersonOverlay) makeFirstPersonOverlay(model);
    fallback.visible = false;
    parent.add(model);
  });
  return fallback;
}

function addMegaforceDisplay(parent, x, y, z) {
  const display = new THREE.Group();
  display.position.set(x, y, z);
  display.rotation.y = Math.PI;
  display.scale.setScalar(1.5);
  parent.add(display);
  storeState.megaforceDisplay = display;

  attachMegaforceModel(display, 34);

  const glow = new THREE.Mesh(new THREE.RingGeometry(18, 29, 32), mats.megaforceGlow);
  glow.rotation.x = -Math.PI / 2;
  glow.position.y = -18;
  display.add(glow);
  glowingObjects.push(glow);
  return display;
}

function makeVendor() {
  const vendor = makePerson({ skin: "#d99b64", hair: "#4a2a14", shirt: "#1ca35a", pants: "#27313a" });
  vendor.scale.setScalar(0.96);
  vendor.rotation.y = 0;
  const apron = makeBox(14, 21, 1.4, mats.vendorApron);
  apron.position.set(0, 34, 7.25);
  vendor.add(apron);
  const nameTag = new THREE.Sprite(new THREE.SpriteMaterial({
    map: makeStoreNameTagTexture(VENDOR_NAME, 0x159a55, VENDOR_MAX_HP, VENDOR_MAX_HP),
    transparent: true,
    depthTest: false,
  }));
  nameTag.position.set(0, 84, 0);
  nameTag.scale.set(86, 29, 1);
  nameTag.renderOrder = 40;
  vendor.add(nameTag);
  vendor.userData.nameTag = nameTag;
  const knife = new THREE.Group();
  const knifeHandle = makeBox(3.4, 3.4, 10, mats.pumpDark);
  knifeHandle.position.set(0, 0, 4);
  const knifeGuard = makeBox(8, 1.5, 2.5, mats.metal);
  knifeGuard.position.set(0, 0, 10);
  const knifeBlade = new THREE.Mesh(new THREE.ConeGeometry(3.2, 19, 4), mats.metal);
  knifeBlade.rotation.x = Math.PI * 0.5;
  knifeBlade.rotation.y = Math.PI * 0.25;
  knifeBlade.position.set(0, 0, 20);
  knifeBlade.castShadow = true;
  knife.add(knifeHandle, knifeGuard, knifeBlade);
  knife.position.set(0, -27, 2);
  knife.rotation.x = -0.18;
  knife.visible = false;
  vendor.userData.rightArm.add(knife);
  vendor.userData.knife = knife;
  storeState.vendorKnife = knife;
  return vendor;
}

function createSMarketInterior() {
  const group = new THREE.Group();
  group.visible = false;
  scene.add(group);
  storeState.group = group;
  storeState.colliders.length = 0;

  const floor = makePlane(920, 660, mats.storeFloor, 0.06);
  floor.position.set(6000, 0.06, 0);
  group.add(floor);

  const tileMat = mats.line.clone();
  tileMat.opacity = 0.22;
  tileMat.transparent = true;
  for (let x = 5580; x <= 6420; x += 80) {
    const line = makePlane(2.2, 620, tileMat, 0.075);
    line.position.set(x, 0.075, 0);
    line.renderOrder = 2;
    group.add(line);
  }
  for (let z = -280; z <= 280; z += 80) {
    const line = makePlane(860, 2.2, tileMat, 0.076);
    line.position.set(6000, 0.076, z);
    line.renderOrder = 2;
    group.add(line);
  }

  addStoreBox(group, 6000, -326, 920, 124, 18, mats.storeWall);
  addStoreBox(group, 5531, 0, 18, 124, 660, mats.storeWall);
  addStoreBox(group, 6469, 0, 18, 124, 660, mats.storeWall);
  addStoreBox(group, 5765, 326, 450, 124, 18, mats.storeWall);
  addStoreBox(group, 6235, 326, 450, 124, 18, mats.storeWall);

  const ceiling = makeBox(920, 8, 660, mats.counterTop);
  ceiling.position.set(6000, 132, 0);
  group.add(ceiling);
  for (const z of [-230, -110, 10, 130, 250]) {
    const lamp = makeBox(270, 4, 14, mats.light);
    lamp.position.set(6000, 126, z);
    group.add(lamp);
    glowingObjects.push(lamp);
  }

  const entranceMat = makeGlowMaterial(0x39ff72, 0.5);
  const exitBack = makeBox(154, 58, 6, mats.marketBlue);
  exitBack.position.set(6000, 30, 320);
  const exitDoorLeft = makeBox(54, 48, 4, makeGlowMaterial(0xb4fff0, 0.58));
  exitDoorLeft.position.set(5971, 25, 310);
  const exitDoorRight = makeBox(54, 48, 4, makeGlowMaterial(0xb4fff0, 0.58));
  exitDoorRight.position.set(6029, 25, 310);
  const exitBeam = makeBox(160, 8, 6, entranceMat);
  exitBeam.position.set(6000, 61, 306);
  const exitLeft = makeBox(8, 60, 6, entranceMat);
  exitLeft.position.set(5918, 31, 306);
  const exitRight = makeBox(8, 60, 6, entranceMat);
  exitRight.position.set(6082, 31, 306);
  const exitSign = makeBox(118, 22, 4, makeStoreTextMaterial("EXIT", "OUT", "#19b65d"));
  exitSign.position.set(6000, 82, 300);
  exitSign.rotation.y = Math.PI;
  group.add(exitBack, exitDoorLeft, exitDoorRight, exitBeam, exitLeft, exitRight, exitSign);
  glowingObjects.push(exitDoorLeft, exitDoorRight, exitBeam, exitLeft, exitRight);

  const exitRing = new THREE.Mesh(new THREE.RingGeometry(34, 58, 40), makeGlowMaterial(0x39ff72, 0.72));
  exitRing.rotation.x = -Math.PI / 2;
  exitRing.position.set(SMARKET_EXIT.x, 0.5, SMARKET_EXIT.z);
  const exitCore = new THREE.Mesh(new THREE.CircleGeometry(39, 40), makeGlowMaterial(0x39ff72, 0.24));
  exitCore.rotation.x = -Math.PI / 2;
  exitCore.position.set(SMARKET_EXIT.x, 0.51, SMARKET_EXIT.z);
  group.add(exitRing, exitCore);
  glowingObjects.push(exitRing, exitCore);

  const counter = addStoreBox(group, 6000, -228, 360, 34, 60, mats.counter);
  counter.position.y = 17;
  const counterTop = makeBox(374, 4, 70, mats.counterTop);
  counterTop.position.set(6000, 36, -228);
  group.add(counterTop);
  const belt = makeBox(156, 3, 38, mats.pumpDark);
  belt.position.set(5930, 40, -202);
  const register = makeBox(30, 24, 24, mats.glass);
  register.position.set(6118, 50, -202);
  const scanner = makeBox(28, 5, 20, mats.marketGlow);
  scanner.position.set(6052, 43, -192);
  const counterScreen = makeBox(38, 24, 4, mats.marketBlue);
  counterScreen.position.set(6108, 58, -244);
  group.add(belt, register, scanner, counterScreen);
  storeState.scanner = scanner;
  glowingObjects.push(scanner, counterScreen);

  const vendor = makeVendor();
  vendor.position.set(6004, 0, -274);
  group.add(vendor);
  storeState.vendor = vendor;
  resetVendorAtCheckout();

  addMegaforceDisplay(group, 6008, 64, -198);

  const megaforceSign = makeBox(210, 64, 5, makeStoreTextMaterial("MEGAFORCE", "ENERGY 2e", "#118bdb"));
  megaforceSign.position.set(6000, 76, -316);
  group.add(megaforceSign);

  const queueLine = makePlane(300, 4, mats.line, 0.09);
  queueLine.position.set(6000, 0.09, -112);
  group.add(queueLine);
  for (const x of [5880, 5950, 6020, 6090, 6160]) {
    const marker = makePlane(50, 4, mats.line, 0.1);
    marker.position.set(x, 0.1, -84);
    marker.rotation.z = Math.PI * 0.5;
    group.add(marker);
  }

  const character = makePerson();
  character.scale.setScalar(1.14);
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
  const moveInput = inputState.mobile
    ? inputState.throttle
    : (keys.has("w") || keys.has("arrowup") ? 1 : 0) + (keys.has("s") || keys.has("arrowdown") ? -1 : 0);
  const strafeInput = inputState.mobile
    ? 0
    : (keys.has("d") || keys.has("arrowright") ? 1 : 0) + (keys.has("a") || keys.has("arrowleft") ? -1 : 0);

  const targetTurnVelocity = inputState.mobile ? inputState.steer * 2.35 : 0;
  storeState.turnVelocity = lerp(storeState.turnVelocity, targetTurnVelocity, 1 - Math.exp(-dt * 8));
  storeState.angle += storeState.turnVelocity * dt;

  const wantsJump = (!inputState.mobile && keys.has(" ")) || inputState.jumpQueued;
  inputState.jumpQueued = false;
  if (storeState.grounded && wantsJump) {
    storeState.vy = 232;
    storeState.grounded = false;
    playTone(180, 0.08, "triangle", 0.045);
    playNoiseHit(0.05, 0.03, 720);
  }
  storeState.vy -= 620 * dt;
  storeState.y += storeState.vy * dt;
  if (storeState.y <= 0) {
    if (!storeState.grounded && storeState.vy < -80) {
      playNoiseHit(0.07, 0.045, 360);
    }
    storeState.y = 0;
    storeState.vy = 0;
    storeState.grounded = true;
  }

  const walkSpeed = 138;
  const moveLen = Math.hypot(moveInput, strafeInput);
  const moving = moveLen > 0.05;
  audioState.storeMoving = moving;
  if (moving) {
    const scale = 1 / Math.max(1, moveLen);
    const moveYaw = storeState.angle + Math.atan2(-strafeInput, moveInput || 0.0001);
    if (storeState.cameraMode === "third") {
      storeState.angle += angleDelta(storeState.angle, moveYaw) * (1 - Math.exp(-dt * 7.5));
    }
    const forwardX = Math.sin(storeState.angle);
    const forwardZ = Math.cos(storeState.angle);
    const rightX = -Math.cos(storeState.angle);
    const rightZ = Math.sin(storeState.angle);
    storeState.x += (forwardX * moveInput + rightX * strafeInput) * scale * walkSpeed * dt;
    storeState.z += (forwardZ * moveInput + rightZ * strafeInput) * scale * walkSpeed * dt;
    storeState.walkCycle += moveLen * scale * dt * 8.5;
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

  storeState.x = clamp(storeState.x, 5554, 6446);
  storeState.z = clamp(storeState.z, -306, 326);
  storeState.character.position.set(storeState.x, storeState.y, storeState.z);
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
  const swing = moving ? Math.sin(t) * 0.86 : 0;
  const side = moving ? Math.sin(t * 2) * 0.065 : 0;
  const bounce = moving ? Math.abs(Math.sin(t)) * 2.25 : 0;
  const strideTwist = moving ? Math.sin(t) * 0.08 : 0;
  const shoulderRoll = moving ? Math.sin(t * 2) * 0.035 : 0;
  const thirdPersonPunch = storeState.cameraMode === "third";
  const windup = thirdPersonPunch && storeState.punchCharging ? storeState.punchCharge : 0;
  const strike = thirdPersonPunch && storeState.punchTimer > 0 ? Math.sin(storeState.punchTimer * Math.PI) : 0;
  const carryingDrink = storeState.hasMegaforce || storeState.drinking;
  const drinkProgress = clamp(storeState.drinkProgress / Math.max(0.01, storeState.drinkDuration || 1), 0, 1);
  const drinkLift = storeState.drinking ? smoothStep01(drinkProgress * 2.4) : 0;
  const drinkSip = storeState.drinking ? Math.sin(performance.now() * 0.018) * 0.08 : 0;
  const headPitch = clamp(storeState.pitch, -1.1, 1.1) * 0.62;
  const ease = 1 - Math.exp(-dt * 12);
  character.position.y = lerp(character.position.y, storeState.y + bounce, ease);
  character.rotation.z = lerp(character.rotation.z, -side * 0.9, ease);
  character.rotation.x = lerp(character.rotation.x, moving ? Math.abs(Math.sin(t)) * 0.025 : 0, ease);
  character.userData.leftArm.rotation.x = lerp(character.userData.leftArm.rotation.x, swing * 0.98, ease);
  character.userData.leftArm.rotation.z = lerp(character.userData.leftArm.rotation.z, 0.08 + shoulderRoll, ease);
  const rightArmX = carryingDrink ? -0.82 - drinkLift * 1.22 + drinkSip : -swing + windup * 1.15 - strike * 1.75;
  const rightArmY = carryingDrink ? -0.1 - drinkLift * 0.18 : windup * 0.45 - strike * 0.18;
  const rightArmZ = carryingDrink ? -0.2 - drinkLift * 0.18 : -0.08 - shoulderRoll - windup * 0.32 + strike * 0.18;
  character.userData.rightArm.rotation.x = lerp(character.userData.rightArm.rotation.x, rightArmX, ease);
  character.userData.rightArm.rotation.y = lerp(character.userData.rightArm.rotation.y, rightArmY, ease);
  character.userData.rightArm.rotation.z = lerp(character.userData.rightArm.rotation.z, rightArmZ, ease);
  character.userData.leftLeg.rotation.x = lerp(character.userData.leftLeg.rotation.x, -swing * 0.9, ease);
  character.userData.rightLeg.rotation.x = lerp(character.userData.rightLeg.rotation.x, swing * 0.9, ease);
  character.userData.leftLeg.rotation.z = lerp(character.userData.leftLeg.rotation.z, -0.035 - strideTwist * 0.18, ease);
  character.userData.rightLeg.rotation.z = lerp(character.userData.rightLeg.rotation.z, 0.035 - strideTwist * 0.18, ease);
  character.userData.head.rotation.z = lerp(character.userData.head.rotation.z, side, ease);
  character.userData.head.rotation.x = lerp(character.userData.head.rotation.x, headPitch + (moving ? Math.abs(Math.sin(t)) * 0.035 : 0), ease);
  character.userData.hair.rotation.x = lerp(character.userData.hair.rotation.x, headPitch, ease);
  character.userData.face.rotation.x = lerp(character.userData.face.rotation.x, headPitch, ease);
  if (character.userData.drinkCan) {
    character.userData.drinkCan.visible = carryingDrink;
    character.userData.drinkCan.rotation.x = lerp(character.userData.drinkCan.rotation.x, 0.25 + drinkLift * 0.95, ease);
    character.userData.drinkCan.rotation.z = lerp(character.userData.drinkCan.rotation.z, 0.05 - drinkLift * 0.18, ease);
  }
  updateMegisLiquidStream(character.userData.drinkLiquid, storeState.drinking && drinkLift > 0.48, drinkLift, 0.3);
}

function updateStorePunch(dt) {
  if (!storeState.fist) return;
  storeState.fist.visible = gameMode === "store" && storeState.cameraMode === "first" && !transitionLock && !storeState.dead;

  if (storeState.punchCharging) {
    storeState.punchCharge = Math.min(1, storeState.punchCharge + dt * 1.55);
  }
  storeState.punchTimer = Math.max(0, storeState.punchTimer - dt * 4.7);
  storeState.punchCooldown = Math.max(0, storeState.punchCooldown - dt);

  const windup = storeState.punchCharging ? storeState.punchCharge : 0;
  const strike = storeState.punchTimer > 0 ? Math.sin(storeState.punchTimer * Math.PI) : 0;
  const drinkProgress = clamp(storeState.drinkProgress / Math.max(0.01, storeState.drinkDuration || 1), 0, 1);
  const drinkLift = storeState.drinking ? smoothStep01(drinkProgress * 2.4) : 0;
  const drinkSip = storeState.drinking ? Math.sin(performance.now() * 0.02) * 0.9 : 0;
  const carryingDrink = storeState.hasMegaforce || storeState.drinking;
  const settle = 1 - Math.exp(-dt * 14);
  const lookDownGuard = clamp(-storeState.pitch / 1.52, 0, 1);
  const wantedX = carryingDrink ? 31 - drinkLift * 8 : 31 - windup * 7 - strike * 10;
  const wantedY = (carryingDrink ? -49 + drinkLift * 23 + drinkSip : -46 - windup * 5 + strike * 12) + lookDownGuard * 44;
  const wantedZ = (carryingDrink ? -64 + drinkLift * 8 : -58 + windup * 20 - strike * (38 + storeState.lastPunchDamage * 0.14)) + lookDownGuard * 10;
  storeState.fist.position.x = lerp(storeState.fist.position.x, wantedX, settle);
  storeState.fist.position.y = lerp(storeState.fist.position.y, wantedY, settle);
  storeState.fist.position.z = lerp(storeState.fist.position.z, wantedZ, settle);
  storeState.fist.rotation.x = lerp(storeState.fist.rotation.x, carryingDrink ? 0.08 - drinkLift * 0.42 : 0.13 - windup * 0.5 + strike * 0.5, settle);
  storeState.fist.rotation.y = lerp(storeState.fist.rotation.y, carryingDrink ? -0.34 + drinkLift * 0.08 : -0.28 + windup * 0.08 + strike * 0.22, settle);
  storeState.fist.rotation.z = lerp(storeState.fist.rotation.z, carryingDrink ? -0.04 + drinkLift * 0.2 : -0.08 + windup * 0.18 - strike * 0.18, settle);
  if (storeState.fist.userData.can) {
    if (!storeState.fist.userData.canOverlayApplied) {
      makeFirstPersonOverlay(storeState.fist.userData.can);
      storeState.fist.userData.canOverlayApplied = true;
    }
    storeState.fist.userData.can.visible = carryingDrink;
    storeState.fist.userData.can.position.x = lerp(storeState.fist.userData.can.position.x, -3.2 - drinkLift * 1.8, settle);
    storeState.fist.userData.can.position.y = lerp(storeState.fist.userData.can.position.y, 6.5 + drinkLift * 8.5, settle);
    storeState.fist.userData.can.position.z = lerp(storeState.fist.userData.can.position.z, -150 + drinkLift * 10, settle);
    storeState.fist.userData.can.rotation.x = lerp(storeState.fist.userData.can.rotation.x, -0.18 + drinkLift * 0.82, settle);
    storeState.fist.userData.can.rotation.y = lerp(storeState.fist.userData.can.rotation.y, 0.12 + drinkLift * 0.12, settle);
    storeState.fist.userData.can.rotation.z = lerp(storeState.fist.userData.can.rotation.z, -0.08 + drinkLift * 0.3, settle);
  }
  updateMegisLiquidStream(storeState.fist.userData.liquid, storeState.drinking && drinkLift > 0.42, drinkLift, 1.2);

  storeState.damageTimer = Math.max(0, storeState.damageTimer - dt * 1.75);
  storeState.damageShake = Math.max(0, storeState.damageShake - dt * 4.4);
  damageFxEl.style.opacity = clamp(storeState.damageTimer, 0, 0.82).toFixed(2);
}

function startStorePunch(event) {
  if (event.button !== 0 || gameMode !== "store" || transitionLock || storeState.dead) return;
  if (storeState.punchCooldown > 0 || storeState.drinking) return;
  if (!inputState.mobile && document.pointerLockElement !== canvas) requestStorePointerLock();
  storeState.punchCharging = true;
  storeState.punchCharge = 0;
  storeState.punchTimer = 0;
}

function startStoreDrink(event) {
  if (event.button !== 2 || gameMode !== "store" || transitionLock || storeState.dead) return;
  event.preventDefault();
  if (!inputState.mobile && document.pointerLockElement !== canvas) requestStorePointerLock();
  if (!storeState.hasMegaforce) return;
  storeState.drinking = true;
  storeState.punchCharging = false;
  storeState.punchTimer = 0;
  storeState.punchCooldown = 0;
  playDrinkSound();
}

function storeMegaforceDistance() {
  return Math.hypot(storeState.x - 6008, storeState.z + 168);
}

function removeStorePurchaseFx() {
  if (!storeState.purchaseFx || !storeState.group) return;
  storeState.group.remove(storeState.purchaseFx);
  storeState.purchaseFx = null;
}

function startMegaforcePurchaseAnimation() {
  removeStorePurchaseFx();
  const fx = new THREE.Group();
  fx.position.set(6008, 69, -151);
  attachMegaforceModel(fx, 38);

  const ring = new THREE.Mesh(new THREE.RingGeometry(24, 38, 32), makeGlowMaterial(0x39ff72, 0.7));
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = -28;
  fx.add(ring);
  glowingObjects.push(ring);

  storeState.group.add(fx);
  storeState.purchaseFx = fx;
  storeState.purchaseDuration = 1.15;
  storeState.purchaseTimer = storeState.purchaseDuration;
  if (storeState.scanner) storeState.scanner.scale.set(1.7, 1.45, 1.7);
}

function updateMegaforcePurchaseAnimation(dt) {
  if (storeState.purchaseTimer <= 0) return;
  storeState.purchaseTimer = Math.max(0, storeState.purchaseTimer - dt);
  const t = 1 - storeState.purchaseTimer / Math.max(0.01, storeState.purchaseDuration);
  const eased = 1 - Math.pow(1 - t, 3);
  const wobble = Math.sin(t * Math.PI * 3) * (1 - t);
  const targetX = storeState.x + Math.sin(storeState.angle) * 20 - Math.cos(storeState.angle) * 16;
  const targetZ = storeState.z + Math.cos(storeState.angle) * 20 + Math.sin(storeState.angle) * 16;
  const targetY = 58 + Math.sin(t * Math.PI) * 24;

  if (storeState.purchaseFx) {
    storeState.purchaseFx.position.set(
      lerp(6008, targetX, eased),
      lerp(69, targetY, eased),
      lerp(-151, targetZ, eased)
    );
    storeState.purchaseFx.rotation.y += dt * (7 + wobble * 4);
    storeState.purchaseFx.rotation.z = wobble * 0.28;
    storeState.purchaseFx.scale.setScalar(1 + Math.sin(t * Math.PI) * 0.32);
  }
  if (storeState.scanner) {
    const pulse = 1 + Math.sin(t * Math.PI) * 1.2;
    storeState.scanner.scale.set(pulse, 1 + pulse * 0.18, pulse);
  }

  if (storeState.purchaseTimer <= 0) {
    removeStorePurchaseFx();
    if (storeState.scanner) storeState.scanner.scale.set(1, 1, 1);
    storeState.hasMegaforce = true;
    storeState.drinking = false;
    storeState.drinkProgress = 0;
    showNotification("Megis acquired - hold right mouse to drink", true);
  }
}

function tryBuyMegaforce() {
  if (gameMode !== "store" || transitionLock || storeState.dead || storeState.drinking || storeState.purchaseTimer > 0) return;
  if (storeState.vendorDead) {
    playUiError();
    showNotification(`${VENDOR_NAME} is not at the checkout`);
    return;
  }
  if (storeState.hasMegaforce) {
    playUiError();
    showNotification("You already have Megaforce");
    return;
  }
  if (storeMegaforceDistance() > 96) {
    playUiError();
    showNotification("Go to the checkout to buy Megaforce");
    return;
  }
  if (money < 2) {
    playUiError();
    showNotification("Megaforce costs 2e");
    return;
  }
  money -= 2;
  moneyEl.textContent = "$" + Math.floor(money);
  playPurchaseSound();
  storeState.punchCharging = false;
  storeState.punchTimer = 0;
  storeState.drinkDuration = 2.35;
  storeState.drinkProgress = 0;
  storeState.drinkTimer = 0;
  storeState.hasMegaforce = false;
  storeState.drinking = false;
  storeState.boostReady = false;
  showNotification(`${playerName} purchased Megis`, true);
  startMegaforcePurchaseAnimation();
}

function updateStoreShop(dt) {
  if (worldHostControlsSimulation()) updateVendor(dt);
  updateMegaforcePurchaseAnimation(dt);
  if (storeState.drinking && storeState.hasMegaforce) {
    storeState.drinkDuration = storeState.drinkDuration || 2.35;
    storeState.drinkProgress = Math.min(storeState.drinkDuration, storeState.drinkProgress + dt);
    storeState.drinkTimer = storeState.drinkProgress;
    if (storeState.drinkProgress >= storeState.drinkDuration) {
      storeState.hasMegaforce = false;
      storeState.drinking = false;
      storeState.drinkTimer = 0;
      storeState.drinkProgress = 0;
      speedBoostUntil = performance.now() + 5 * 60 * 1000;
      showNotification("Megaforce active: 1.5x speed for 5 min", true);
    }
  } else {
    storeState.drinkTimer = storeState.hasMegaforce ? storeState.drinkProgress : 0;
  }

  const nearCheckout = storeMegaforceDistance() < 96;
  purchasePromptEl.classList.toggle("hidden", gameMode !== "store" || !nearCheckout || storeState.hasMegaforce || storeState.drinking || storeState.purchaseTimer > 0 || storeState.dead || storeState.vendorDead);

  if (storeState.purchaseTimer > 0) {
    hintEl.textContent = "Purchasing Megis...";
  } else if (storeState.drinking) {
    hintEl.textContent = "Drinking Megaforce...";
  } else if (storeState.hasMegaforce) {
    hintEl.textContent = inputState.mobile ? "Hold DRINK to use Megaforce" : "Hold right mouse to drink Megaforce";
  } else if (storeState.vendorDead) {
    hintEl.textContent = `${VENDOR_NAME} returns in ${Math.ceil(storeState.vendorRespawnTimer)}s`;
  } else if (nearCheckout) {
    hintEl.textContent = inputState.mobile ? "Tap BUY - Megis 2e" : "E to purchase Megis";
  } else {
    updatePointerLockHint();
  }
}

function releaseStorePunch(event) {
  if (event.button !== 0 || !storeState.punchCharging || storeState.dead) return;
  storeState.punchCharging = false;
  storeState.lastPunchDamage = Math.round(18 + storeState.punchCharge * 82);
  storeState.punchTimer = 1;
  storeState.punchCooldown = storeState.punchCooldownDuration;
  cameraState.shake = Math.max(cameraState.shake, 0.08 + storeState.punchCharge * 0.24);
  const hit = findStorePunchTarget(storeState.lastPunchDamage);
  if (hit?.vendor) {
    applyVendorDamage(storeState.lastPunchDamage, playerName, {
      attackerPeerId: multiplayer.peerId || "local",
      x: storeState.x,
      z: storeState.z,
      angle: storeState.angle,
    });
  } else {
    playPunchSound(!!hit);
    showNotification(hit ? `Hit ${hit.name} for ${storeState.lastPunchDamage}` : `Punch damage ${storeState.lastPunchDamage}`);
  }
  sendStorePunch(hit ? hit.peerId : "");
  storeState.punchCharge = 0;
}

function stopStoreDrink(event) {
  if (event.button !== 2 || !storeState.drinking) return;
  event.preventDefault();
  storeState.drinking = false;
}

function findStorePunchTarget(damage) {
  const forwardX = Math.sin(storeState.angle);
  const forwardZ = Math.cos(storeState.angle);
  let best = null;
  if (storeState.vendor && !storeState.vendorDead && storeState.vendorHp > 0) {
    const dx = storeState.vendor.position.x - storeState.x;
    const dz = storeState.vendor.position.z - storeState.z;
    const distance = Math.hypot(dx, dz);
    if (distance <= 78 && distance > 0.001) {
      const dot = (dx / distance) * forwardX + (dz / distance) * forwardZ;
      if (dot > 0.44) {
        best = { peerId: "vendor:outii", name: VENDOR_NAME, damage, score: dot * 110 - distance, vendor: true };
      }
    }
  }
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
  const attacker = message.attackerName || "Someone";
  const damage = clamp(Math.round(message.damage || 20), 1, 120);
  if (message.targetPeerId === "vendor:outii" || message.targetPeerId === "vendor:taija") {
    applyVendorDamage(damage, attacker, message);
    return;
  }
  if (gameMode !== "store") return;
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

function createStoreImpactFx(x, z, color = 0xd20720, strength = 1) {
  if (!storeState.group) return;
  const ringMaterial = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0.86,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const ring = new THREE.Mesh(new THREE.RingGeometry(7, 12, 32), ringMaterial);
  ring.rotation.x = -Math.PI * 0.5;
  ring.position.set(x, 1.2, z);
  storeState.group.add(ring);
  storeState.impactFx.push({ mesh: ring, life: 0.72, maxLife: 0.72, ring: true, strength });

  const shardCount = Math.round(10 + strength * 5);
  for (let i = 0; i < shardCount; i++) {
    const angle = (i / shardCount) * Math.PI * 2 + Math.random() * 0.34;
    const speed = (42 + Math.random() * 62) * strength;
    const material = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.92 });
    const shard = new THREE.Mesh(new THREE.BoxGeometry(2.2, 2.2, 7 + Math.random() * 6), material);
    shard.position.set(x, 5 + Math.random() * 12, z);
    shard.rotation.set(Math.random() * Math.PI, angle, Math.random() * Math.PI);
    storeState.group.add(shard);
    storeState.impactFx.push({
      mesh: shard,
      life: 0.7 + Math.random() * 0.42,
      maxLife: 1.12,
      vx: Math.sin(angle) * speed,
      vy: 46 + Math.random() * 78,
      vz: Math.cos(angle) * speed,
      spin: (Math.random() - 0.5) * 13,
    });
  }
}

function updateStoreImpactFx(dt) {
  for (let i = storeState.impactFx.length - 1; i >= 0; i--) {
    const effect = storeState.impactFx[i];
    effect.life -= dt;
    if (effect.ring) {
      const progress = 1 - effect.life / effect.maxLife;
      const scale = 1 + progress * 8 * effect.strength;
      effect.mesh.scale.setScalar(scale);
      effect.mesh.material.opacity = Math.max(0, (1 - progress) * 0.82);
    } else {
      effect.vy -= 230 * dt;
      effect.mesh.position.x += effect.vx * dt;
      effect.mesh.position.y = Math.max(1, effect.mesh.position.y + effect.vy * dt);
      effect.mesh.position.z += effect.vz * dt;
      effect.mesh.rotation.x += effect.spin * dt;
      effect.mesh.rotation.z += effect.spin * 0.72 * dt;
      effect.mesh.material.opacity = Math.max(0, effect.life / effect.maxLife);
    }
    if (effect.life > 0) continue;
    storeState.group.remove(effect.mesh);
    effect.mesh.geometry.dispose();
    effect.mesh.material.dispose();
    storeState.impactFx.splice(i, 1);
  }
}

function clearStoreImpactFx() {
  for (const effect of storeState.impactFx) {
    storeState.group?.remove(effect.mesh);
    effect.mesh.geometry.dispose();
    effect.mesh.material.dispose();
  }
  storeState.impactFx.length = 0;
}

function applyStoreDamage(damage, attacker, message = {}) {
  if (storeState.dead) return;
  storeState.hp = clamp(storeState.hp - damage, 0, PLAYER_MAX_HP);
  storeState.damageTimer = clamp(0.25 + damage / 115, 0.35, 0.95);
  storeState.damageShake = Math.max(storeState.damageShake, 0.8 + damage * 0.018);
  playPunchSound(true);
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
  storeState.punchCooldown = 0;
  if (storeState.fist) storeState.fist.visible = false;
  if (document.pointerLockElement === canvas) document.exitPointerLock();

  const awayX = storeState.x - (message.x || storeState.x - Math.sin(storeState.angle) * 20);
  const awayZ = storeState.z - (message.z || storeState.z - Math.cos(storeState.angle) * 20);
  const awayLen = Math.max(Math.hypot(awayX, awayZ), 0.001);
  storeState.deathVx = (awayX / awayLen) * 168;
  storeState.deathVz = (awayZ / awayLen) * 168;
  storeState.deathVy = 122;
  storeState.deathY = 0;
  storeState.deathRoll = 0;
  storeState.deathPitch = 0;
  storeState.deathSpin = 5.2;
  storeState.deathTimer = 0;
  storeState.deathLanded = false;
  storeState.deathAttacker = attacker || "Unknown";
  storeState.character.visible = true;
  createStoreImpactFx(storeState.x, storeState.z, 0xd20720, 1.15);
  cameraState.shake = Math.max(cameraState.shake, 4.2);
  playTone(92, 0.42, "sawtooth", 0.11);
  playTone(48, 0.7, "triangle", 0.12, 0.08);
  storeDeathAttackerEl.textContent = `${storeState.deathAttacker} took you down`;
  storeDeathScreenEl.classList.remove("hidden");
  showNotification(`${playerName} got knocked out by ${attacker}`, true);
}

function updateStoreDeath(dt) {
  if (!storeState.dead || !storeState.character) return;
  storeState.deathTimer += dt;
  storeState.deathVy -= 360 * dt;
  storeState.deathY += storeState.deathVy * dt;
  storeState.x += storeState.deathVx * dt;
  storeState.z += storeState.deathVz * dt;
  storeState.deathVx *= Math.exp(-dt * 2.6);
  storeState.deathVz *= Math.exp(-dt * 2.6);
  storeState.deathRoll += storeState.deathSpin * dt;
  storeState.deathPitch = lerp(storeState.deathPitch, Math.PI * 0.5, 1 - Math.exp(-dt * 6));

  const flail = Math.exp(-storeState.deathTimer * 1.8);
  const character = storeState.character;
  character.userData.leftArm.rotation.set(-1.45 * flail, 0, -1.1 * flail);
  character.userData.rightArm.rotation.set(1.18 * flail, 0, 1.28 * flail);
  character.userData.leftLeg.rotation.x = 0.82 * flail;
  character.userData.rightLeg.rotation.x = -0.72 * flail;
  character.userData.head.rotation.z = Math.sin(storeState.deathTimer * 12) * 0.32 * flail;

  if (storeState.deathY <= 0) {
    storeState.deathY = 0;
    storeState.deathVy = 0;
    storeState.deathSpin = lerp(storeState.deathSpin, 0, 1 - Math.exp(-dt * 7));
    storeState.deathRoll = lerp(storeState.deathRoll, 0.18, 1 - Math.exp(-dt * 5));
    if (!storeState.deathLanded && storeState.deathTimer > 0.12) {
      storeState.deathLanded = true;
      createStoreImpactFx(storeState.x, storeState.z, 0xf0f0e8, 0.72);
      storeState.damageShake = Math.max(storeState.damageShake, 5.5);
      playTone(58, 0.22, "square", 0.1);
    }
  }

  storeState.x = clamp(storeState.x, 5554, 6446);
  storeState.z = clamp(storeState.z, -306, 326);
  storeState.character.visible = true;
  storeState.character.position.set(storeState.x, storeState.deathY, storeState.z);
  storeState.character.rotation.set(storeState.deathPitch, storeState.angle, storeState.deathRoll);
}

function resetPersonPose(character) {
  if (!character) return;
  for (const part of ["leftArm", "rightArm", "leftLeg", "rightLeg", "head"]) {
    if (character.userData[part]) character.userData[part].rotation.set(0, 0, 0);
  }
}

function respawnStorePlayer() {
  if (gameMode !== "store" || !storeState.dead || transitionLock) return;
  transitionLock = true;
  setTransition(true);
  storeDeathScreenEl.classList.add("hidden");
  playTone(260, 0.14, "triangle", 0.075);
  playTone(520, 0.24, "triangle", 0.065, 0.09);
  window.setTimeout(() => {
    storeState.hp = PLAYER_MAX_HP;
    storeState.dead = false;
    storeState.x = 6000;
    storeState.y = 0;
    storeState.z = 220;
    storeState.angle = Math.PI;
    storeState.cameraYaw = storeState.angle;
    storeState.pitch = 0;
    storeState.vy = 0;
    storeState.grounded = true;
    storeState.deathY = 0;
    storeState.deathVy = 0;
    storeState.deathVx = 0;
    storeState.deathVz = 0;
    storeState.deathRoll = 0;
    storeState.deathPitch = 0;
    storeState.deathSpin = 0;
    storeState.deathTimer = 0;
    storeState.deathLanded = false;
    storeState.deathAttacker = "";
    storeState.damageTimer = 0;
    storeState.damageShake = 0;
    storeState.character.position.set(storeState.x, 0, storeState.z);
    storeState.character.rotation.set(0, storeState.angle, 0);
    storeState.character.visible = true;
    resetPersonPose(storeState.character);
    cameraState.position.set(storeState.x, 84, storeState.z + 148);
    cameraState.target.set(storeState.x, 32, storeState.z - 36);
    damageFxEl.style.opacity = "0";
    updateStoreHealthHud();
    showNotification(`${playerName} respawned`, true);
    window.setTimeout(() => {
      setTransition(false);
      transitionLock = false;
    }, 260);
  }, 360);
}

function updateStoreHealthHud() {
  const visible = gameMode === "store";
  storeHealthEl.classList.toggle("hidden", !visible);
  if (!visible) return;
  const hp = clamp(storeState.hp, 0, PLAYER_MAX_HP);
  const hpRatio = hp / PLAYER_MAX_HP;
  storeHealthLabelEl.textContent = `HP ${Math.ceil(hp)}/${PLAYER_MAX_HP}`;
  storeHealthFillEl.style.width = `${hpRatio * 100}%`;
  storeHealthFillEl.style.background = hpRatio < 0.28
    ? "linear-gradient(90deg, #d50019, #ff6a4d)"
    : hpRatio < 0.58
      ? "linear-gradient(90deg, #ffb000, #fff052)"
      : "linear-gradient(90deg, #2dff64, #e9ff52)";
}

function updateVendorNameTag() {
  const vendor = storeState.vendor;
  const tag = vendor?.userData?.nameTag;
  if (!tag) return;
  tag.visible = !storeState.vendorDead;
  const hp = clamp(storeState.vendorHp, 0, VENDOR_MAX_HP);
  if (tag.userData.hp === Math.round(hp) && tag.userData.dead === storeState.vendorDead) return;
  const oldMap = tag.material.map;
  tag.material.map = makeStoreNameTagTexture(VENDOR_NAME, 0x159a55, hp, VENDOR_MAX_HP);
  if (oldMap) oldMap.dispose();
  tag.userData.hp = Math.round(hp);
  tag.userData.dead = storeState.vendorDead;
}

function resetVendorAtCheckout() {
  if (!storeState.vendor) return;
  storeState.vendorHp = VENDOR_MAX_HP;
  storeState.vendorDead = false;
  storeState.vendorRespawnTimer = 0;
  storeState.vendorDeathY = 0;
  storeState.vendorDeathVy = 0;
  storeState.vendorDeathVx = 0;
  storeState.vendorDeathVz = 0;
  storeState.vendorDeathRoll = 0;
  storeState.vendorDeathPitch = 0;
  storeState.vendorDeathSpin = 0;
  storeState.vendorDeathTimer = 0;
  storeState.vendorDeathLanded = false;
  storeState.vendorAggroPeerId = "";
  storeState.vendorAggroTimer = 0;
  storeState.vendorAttackCooldown = 0;
  storeState.vendorAttackTimer = 0;
  storeState.vendorWalkCycle = 0;
  storeState.vendor.visible = true;
  storeState.vendor.position.set(6004, 0, -274);
  storeState.vendor.rotation.set(0, 0, 0);
  resetPersonPose(storeState.vendor);
  if (storeState.vendorKnife) storeState.vendorKnife.visible = false;
  if (storeState.vendor.userData.rightArm) storeState.vendor.userData.rightArm.rotation.x = 0;
  if (storeState.vendor.userData.leftArm) storeState.vendor.userData.leftArm.rotation.x = 0;
  updateVendorNameTag();
}

function applyVendorDamage(damage, attacker, message = {}) {
  if (!storeState.vendor || storeState.vendorDead) return;
  storeState.vendorHp = clamp(storeState.vendorHp - damage, 0, VENDOR_MAX_HP);
  storeState.vendorAggroPeerId = message.attackerPeerId || storeState.vendorAggroPeerId || "local";
  storeState.vendorAggroTimer = 14;
  if (storeState.vendorKnife) storeState.vendorKnife.visible = true;
  updateVendorNameTag();
  playPunchSound(true);
  showNotification(`${attacker} hit ${VENDOR_NAME} for ${damage}`, true);
  if (storeState.vendorHp <= 0) killVendor(attacker, message);
}

function killVendor(attacker, message = {}) {
  if (!storeState.vendor || storeState.vendorDead) return;
  storeState.vendorDead = true;
  storeState.vendorRespawnTimer = 10;
  const awayX = storeState.vendor.position.x - (message.x || storeState.x);
  const awayZ = storeState.vendor.position.z - (message.z || storeState.z);
  const awayLen = Math.max(Math.hypot(awayX, awayZ), 0.001);
  storeState.vendorDeathVx = (awayX / awayLen) * 138;
  storeState.vendorDeathVz = (awayZ / awayLen) * 138;
  storeState.vendorDeathVy = 128;
  storeState.vendorDeathY = 0;
  storeState.vendorDeathRoll = 0;
  storeState.vendorDeathPitch = 0;
  storeState.vendorDeathSpin = 5.8;
  storeState.vendorDeathTimer = 0;
  storeState.vendorDeathLanded = false;
  storeState.vendorAggroPeerId = "";
  storeState.vendorAggroTimer = 0;
  storeState.vendorAttackTimer = 0;
  if (storeState.vendorKnife) storeState.vendorKnife.visible = true;
  createStoreImpactFx(storeState.vendor.position.x, storeState.vendor.position.z, 0x27e86a, 1.25);
  storeState.damageShake = Math.max(storeState.damageShake, 3.8);
  playTone(118, 0.28, "sawtooth", 0.1);
  playTone(62, 0.52, "triangle", 0.11, 0.06);
  updateVendorNameTag();
  showNotification(`${attacker} knocked out ${VENDOR_NAME} - she returns in 10s`, true);
}

function vendorCombatTarget() {
  const peerId = storeState.vendorAggroPeerId;
  const localPeerId = multiplayer.peerId || "local";
  if ((peerId === "local" || peerId === localPeerId) && gameMode === "store" && !storeState.dead) {
    return { peerId: localPeerId, name: playerName, x: storeState.x, z: storeState.z, local: true };
  }
  const remote = remotePlayers.get(peerId);
  const target = remote?.storeTarget;
  if (!target || target.gameMode !== "store" || target.dead || target.hp <= 0) return null;
  return { peerId, name: remote.playerName || "Driver", x: target.x, z: target.z, local: false };
}

function vendorKnifeAttack(target) {
  const message = {
    type: "event",
    event: "vendor-knife",
    targetPeerId: target.peerId,
    attackerName: VENDOR_NAME,
    damage: VENDOR_KNIFE_DAMAGE,
    x: storeState.vendor.position.x,
    z: storeState.vendor.position.z,
    angle: storeState.vendor.rotation.y,
  };
  if (target.local) applyStoreDamage(VENDOR_KNIFE_DAMAGE, VENDOR_NAME, message);
  if (multiplayer.mode === "host") broadcastNetworkMessage(message);
  playTone(185, 0.08, "sawtooth", 0.065);
  playPunchSound(true);
}

function animateVendorCombat(dt, moving) {
  const vendor = storeState.vendor;
  const leftArm = vendor.userData.leftArm;
  const rightArm = vendor.userData.rightArm;
  const leftLeg = vendor.userData.leftLeg;
  const rightLeg = vendor.userData.rightLeg;
  storeState.vendorWalkCycle += moving ? dt * 8.4 : dt * 2.2;
  const swing = moving ? Math.sin(storeState.vendorWalkCycle) * 0.62 : 0;
  const ease = 1 - Math.exp(-dt * 14);
  if (leftArm) leftArm.rotation.x = lerp(leftArm.rotation.x, swing, ease);
  if (leftLeg) leftLeg.rotation.x = lerp(leftLeg.rotation.x, -swing * 0.82, ease);
  if (rightLeg) rightLeg.rotation.x = lerp(rightLeg.rotation.x, swing * 0.82, ease);
  if (!rightArm) return;
  let knifeArm = -0.18 + (moving ? -swing * 0.35 : 0);
  if (storeState.vendorAttackTimer > 0) {
    const progress = 1 - storeState.vendorAttackTimer / 0.52;
    knifeArm = progress < 0.34
      ? lerp(-0.18, 0.58, progress / 0.34)
      : lerp(0.58, -1.5, (progress - 0.34) / 0.66);
  }
  rightArm.rotation.x = lerp(rightArm.rotation.x, knifeArm, ease);
}

function updateVendor(dt) {
  if (!storeState.vendor) return;
  if (!storeState.vendorDead) {
    storeState.vendorAttackCooldown = Math.max(0, storeState.vendorAttackCooldown - dt);
    storeState.vendorAttackTimer = Math.max(0, storeState.vendorAttackTimer - dt);
    storeState.vendorAggroTimer = Math.max(0, storeState.vendorAggroTimer - dt);
    const target = storeState.vendorAggroTimer > 0 ? vendorCombatTarget() : null;
    let moving = false;
    if (target) {
      if (storeState.vendorKnife) storeState.vendorKnife.visible = true;
      const vendor = storeState.vendor;
      let goalX = target.x;
      let goalZ = target.z;
      if (vendor.position.z < -190 && target.z > -188) {
        goalX = target.x < 6000 ? 5798 : 6202;
        goalZ = -176;
      }
      const dx = goalX - vendor.position.x;
      const dz = goalZ - vendor.position.z;
      const distance = Math.hypot(dx, dz);
      const targetDistance = Math.hypot(target.x - vendor.position.x, target.z - vendor.position.z);
      if (distance > 3) {
        const step = Math.min(distance, 76 * dt);
        vendor.position.x += (dx / distance) * step;
        vendor.position.z += (dz / distance) * step;
        moving = true;
      }
      const desiredAngle = Math.atan2(target.x - vendor.position.x, target.z - vendor.position.z);
      vendor.rotation.y += angleDelta(vendor.rotation.y, desiredAngle) * (1 - Math.exp(-dt * 11));
      if (targetDistance < 52 && storeState.vendorAttackCooldown <= 0) {
        storeState.vendorAttackCooldown = VENDOR_KNIFE_COOLDOWN;
        storeState.vendorAttackTimer = 0.52;
        vendorKnifeAttack(target);
      }
    } else {
      storeState.vendorAggroPeerId = "";
      if (storeState.vendorKnife) storeState.vendorKnife.visible = false;
      storeState.vendor.position.lerp(new THREE.Vector3(6004, 0, -274), 1 - Math.exp(-dt * 3.4));
      storeState.vendor.rotation.y += angleDelta(storeState.vendor.rotation.y, 0) * (1 - Math.exp(-dt * 7));
    }
    animateVendorCombat(dt, moving);
    storeState.vendor.rotation.x = lerp(storeState.vendor.rotation.x, 0, 1 - Math.exp(-dt * 7));
    storeState.vendor.rotation.z = lerp(storeState.vendor.rotation.z, 0, 1 - Math.exp(-dt * 7));
    updateVendorNameTag();
    return;
  }

  storeState.vendorRespawnTimer = Math.max(0, storeState.vendorRespawnTimer - dt);
  storeState.vendorDeathTimer += dt;
  storeState.vendorDeathVy -= 330 * dt;
  storeState.vendorDeathY += storeState.vendorDeathVy * dt;
  storeState.vendor.position.x += storeState.vendorDeathVx * dt;
  storeState.vendor.position.z += storeState.vendorDeathVz * dt;
  storeState.vendorDeathVx *= Math.exp(-dt * 2.8);
  storeState.vendorDeathVz *= Math.exp(-dt * 2.8);
  storeState.vendorDeathRoll += storeState.vendorDeathSpin * dt;
  storeState.vendorDeathPitch = lerp(storeState.vendorDeathPitch, Math.PI * 0.5, 1 - Math.exp(-dt * 6));
  const deathFlail = Math.exp(-storeState.vendorDeathTimer * 1.45);
  const vendor = storeState.vendor;
  vendor.userData.leftArm.rotation.set(-1.7 * deathFlail, 0, -1.28 * deathFlail);
  vendor.userData.rightArm.rotation.set(1.52 * deathFlail, 0, 1.36 * deathFlail);
  vendor.userData.leftLeg.rotation.x = 1.05 * deathFlail;
  vendor.userData.rightLeg.rotation.x = -0.92 * deathFlail;
  vendor.userData.head.rotation.z = Math.sin(storeState.vendorDeathTimer * 15) * 0.42 * deathFlail;
  if (storeState.vendorKnife) storeState.vendorKnife.visible = storeState.vendorDeathTimer < 0.38;
  if (storeState.vendorDeathY <= 0) {
    storeState.vendorDeathY = 0;
    storeState.vendorDeathVy = 0;
    storeState.vendorDeathSpin = lerp(storeState.vendorDeathSpin, 0, 1 - Math.exp(-dt * 7));
    if (!storeState.vendorDeathLanded && storeState.vendorDeathTimer > 0.12) {
      storeState.vendorDeathLanded = true;
      createStoreImpactFx(storeState.vendor.position.x, storeState.vendor.position.z, 0xf4e9c8, 0.9);
      storeState.damageShake = Math.max(storeState.damageShake, 5.2);
      playTone(54, 0.25, "square", 0.11);
    }
  }
  storeState.vendor.position.y = storeState.vendorDeathY;
  storeState.vendor.rotation.set(storeState.vendorDeathPitch, storeState.vendor.rotation.y, storeState.vendorDeathRoll);

  if (storeState.vendorRespawnTimer <= 0) {
    resetVendorAtCheckout();
    showNotification(`${VENDOR_NAME} returned to the checkout`, true);
  }
}

function animateRemoteStoreCharacter(remote, dt, moving) {
  const character = remote.storeCharacter;
  const target = remote.storeTarget || {};
  if (!character || !character.userData.head) return;
  remote.storeWalkCycle = moving
    ? (remote.storeWalkCycle || 0) + dt * 8.2
    : lerp(remote.storeWalkCycle || 0, Math.round((remote.storeWalkCycle || 0) / Math.PI) * Math.PI, 1 - Math.exp(-dt * 5));
  const t = remote.storeWalkCycle || 0;
  const swing = moving ? Math.sin(t) * 0.86 : 0;
  const side = moving ? Math.sin(t * 2) * 0.065 : 0;
  const strideTwist = moving ? Math.sin(t) * 0.08 : 0;
  const shoulderRoll = moving ? Math.sin(t * 2) * 0.035 : 0;
  const windup = target.punchCharging ? target.punchCharge || 0 : 0;
  const strike = (target.punchTimer || 0) > 0 ? Math.sin((target.punchTimer || 0) * Math.PI) : 0;
  const carryingDrink = !!target.hasMegaforce || !!target.drinking;
  const drinkProgress = clamp((target.drinkProgress || target.drinkTimer || 0) / Math.max(0.01, target.drinkDuration || 1), 0, 1);
  const drinkLift = target.drinking ? smoothStep01(drinkProgress * 2.4) : 0;
  const drinkSip = target.drinking ? Math.sin(performance.now() * 0.018) * 0.08 : 0;
  const headPitch = clamp(target.pitch || 0, -1.1, 1.1) * 0.62;
  const ease = 1 - Math.exp(-dt * 12);

  character.rotation.z = lerp(character.rotation.z, -side * 0.9, ease);
  character.rotation.x = lerp(character.rotation.x, moving ? Math.abs(Math.sin(t)) * 0.025 : 0, ease);
  character.userData.leftArm.rotation.x = lerp(character.userData.leftArm.rotation.x, swing * 0.98, ease);
  character.userData.leftArm.rotation.z = lerp(character.userData.leftArm.rotation.z, 0.08 + shoulderRoll, ease);
  const rightArmX = carryingDrink ? -0.82 - drinkLift * 1.22 + drinkSip : -swing + windup * 1.15 - strike * 1.75;
  const rightArmY = carryingDrink ? -0.1 - drinkLift * 0.18 : windup * 0.45 - strike * 0.18;
  const rightArmZ = carryingDrink ? -0.2 - drinkLift * 0.18 : -0.08 - shoulderRoll - windup * 0.32 + strike * 0.18;
  character.userData.rightArm.rotation.x = lerp(character.userData.rightArm.rotation.x, rightArmX, ease);
  character.userData.rightArm.rotation.y = lerp(character.userData.rightArm.rotation.y, rightArmY, ease);
  character.userData.rightArm.rotation.z = lerp(character.userData.rightArm.rotation.z, rightArmZ, ease);
  character.userData.leftLeg.rotation.x = lerp(character.userData.leftLeg.rotation.x, -swing * 0.9, ease);
  character.userData.rightLeg.rotation.x = lerp(character.userData.rightLeg.rotation.x, swing * 0.9, ease);
  character.userData.leftLeg.rotation.z = lerp(character.userData.leftLeg.rotation.z, -0.035 - strideTwist * 0.18, ease);
  character.userData.rightLeg.rotation.z = lerp(character.userData.rightLeg.rotation.z, 0.035 - strideTwist * 0.18, ease);
  character.userData.head.rotation.z = lerp(character.userData.head.rotation.z, side, ease);
  character.userData.head.rotation.x = lerp(character.userData.head.rotation.x, headPitch + (moving ? Math.abs(Math.sin(t)) * 0.035 : 0), ease);
  character.userData.hair.rotation.x = lerp(character.userData.hair.rotation.x, headPitch, ease);
  character.userData.face.rotation.x = lerp(character.userData.face.rotation.x, headPitch, ease);
  if (character.userData.drinkCan) {
    character.userData.drinkCan.visible = carryingDrink;
    character.userData.drinkCan.rotation.x = lerp(character.userData.drinkCan.rotation.x, 0.25 + drinkLift * 0.95, ease);
    character.userData.drinkCan.rotation.z = lerp(character.userData.drinkCan.rotation.z, 0.05 - drinkLift * 0.18, ease);
  }
  updateMegisLiquidStream(character.userData.drinkLiquid, !!target.drinking && drinkLift > 0.48, drinkLift, remote.id || 0);
}

function updateStoreCamera(dt) {
  if (storeState.dead) {
    const orbit = storeState.deathTimer * 0.62 + 0.3;
    const distance = 126 - Math.min(storeState.deathTimer * 8, 24);
    const desired = new THREE.Vector3(
      storeState.x + Math.sin(orbit) * distance,
      72 + Math.min(storeState.deathTimer * 11, 24),
      storeState.z + Math.cos(orbit) * distance
    );
    const target = new THREE.Vector3(storeState.x, 15, storeState.z);
    cameraState.position.lerp(desired, 1 - Math.exp(-dt * 4.4));
    cameraState.target.lerp(target, 1 - Math.exp(-dt * 7.2));
    camera.position.copy(cameraState.position);
    if (storeState.damageShake > 0) {
      const hitShake = storeState.damageShake;
      const pulse = performance.now() * 0.045;
      camera.position.x += Math.sin(pulse) * hitShake;
      camera.position.y += Math.cos(pulse * 1.2) * hitShake * 0.45;
    }
    camera.lookAt(cameraState.target);
    camera.fov = lerp(camera.fov, 50, 1 - Math.exp(-dt * 4.2));
    camera.updateProjectionMatrix();
    return;
  }

  const bob = Math.abs(Math.sin(storeState.walkCycle)) * 1.6;
  const firstPersonPitch = clamp(storeState.pitch, -1.52, 1.52);
  const thirdPersonPitch = clamp(storeState.pitch, -0.58, 0.52);
  if (!Number.isFinite(storeState.cameraYaw)) storeState.cameraYaw = storeState.angle;
  const yawFollow = storeState.cameraMode === "third" ? 1 - Math.exp(-dt * 8.5) : 1;
  storeState.cameraYaw += angleDelta(storeState.cameraYaw, storeState.angle) * yawFollow;
  const cameraYaw = storeState.cameraMode === "third" ? storeState.cameraYaw : storeState.angle;
  const forwardX = Math.sin(cameraYaw);
  const forwardZ = Math.cos(cameraYaw);
  let desired;
  let target;
  let followSpeed = 16;
  let targetSpeed = 13;
  let wantedFov = 66;

  if (storeState.cameraMode === "first") {
    const flatAim = Math.cos(firstPersonPitch) * 95;
    desired = new THREE.Vector3(storeState.x, 61 + storeState.y + bob, storeState.z);
    target = new THREE.Vector3(
      storeState.x + forwardX * flatAim,
      61 + storeState.y + bob + Math.sin(firstPersonPitch) * 95,
      storeState.z + forwardZ * flatAim
    );
  } else {
    const cameraDistance = 148 - Math.abs(thirdPersonPitch) * 26;
    const cameraHeight = 84 + storeState.y + thirdPersonPitch * 74 + bob * 0.35;
    desired = new THREE.Vector3(
      storeState.x - forwardX * cameraDistance,
      cameraHeight,
      storeState.z - forwardZ * cameraDistance
    );
    target = new THREE.Vector3(
      storeState.x + forwardX * 36,
      32 + storeState.y + thirdPersonPitch * 16,
      storeState.z + forwardZ * 36
    );
    followSpeed = 9;
    targetSpeed = 11;
    wantedFov = 58;
  }

  cameraState.position.lerp(desired, 1 - Math.exp(-dt * followSpeed));
  cameraState.target.lerp(target, 1 - Math.exp(-dt * targetSpeed));
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
  camera.fov = lerp(camera.fov, wantedFov, 1 - Math.exp(-dt * 5));
  camera.updateProjectionMatrix();
}

function setTransition(active) {
  transitionFadeEl.classList.toggle("active", active);
}

function enterStoreMode() {
  if (transitionLock || gameMode !== "driving") return;
  transitionLock = true;
  playTone(320, 0.16, "triangle", 0.06);
  playTone(520, 0.22, "triangle", 0.045, 0.12);
  setTransition(true);
  window.setTimeout(() => {
    gameMode = "store";
    world.visible = false;
    player.group.visible = false;
    storeState.group.visible = true;
    minimapEl.classList.add("hidden");
    mobileJumpButton.classList.toggle("hidden", !inputState.mobile);
    storeState.x = 6000;
    storeState.y = 0;
    storeState.z = 220;
    storeState.angle = Math.PI;
    storeState.cameraYaw = storeState.angle;
    storeState.pitch = 0;
    storeState.cameraMode = "first";
    storeState.turnVelocity = 0;
    storeState.walkCycle = 0;
    storeState.vy = 0;
    storeState.grounded = true;
    storeState.punchCharging = false;
    storeState.punchCharge = 0;
    storeState.punchTimer = 0;
    storeState.punchCooldown = 0;
    storeState.lastPunchDamage = 0;
    storeState.damageTimer = 0;
    storeState.damageShake = 0;
    storeState.hasMegaforce = false;
    storeState.drinking = false;
    storeState.drinkProgress = 0;
    storeState.drinkTimer = 0;
    storeState.drinkDuration = 0;
    storeState.purchaseTimer = 0;
    storeState.purchaseDuration = 0;
    removeStorePurchaseFx();
    if (storeState.scanner) storeState.scanner.scale.set(1, 1, 1);
    purchasePromptEl.classList.add("hidden");
    storeState.boostReady = false;
    storeState.hp = PLAYER_MAX_HP;
    storeState.dead = false;
    storeState.deathY = 0;
    storeState.deathVy = 0;
    storeState.deathVx = 0;
    storeState.deathVz = 0;
    storeState.deathRoll = 0;
    storeState.deathPitch = 0;
    storeState.deathSpin = 0;
    storeState.deathTimer = 0;
    storeState.deathLanded = false;
    storeState.deathAttacker = "";
    storeDeathScreenEl.classList.add("hidden");
    clearStoreImpactFx();
    damageFxEl.style.opacity = "0";
    storeState.character.position.set(storeState.x, 0, storeState.z);
    storeState.character.rotation.set(0, storeState.angle, 0);
    resetPersonPose(storeState.character);
    storeState.character.visible = storeState.cameraMode !== "first";
    if (storeState.fist) storeState.fist.visible = storeState.cameraMode === "first";
    cameraState.position.set(storeState.x, 84, storeState.z + 148);
    cameraState.target.set(storeState.x, 32, storeState.z - 36);
    hintEl.textContent = inputState.mobile ? "Joystick walk + turn | Jump | green exit" : "First person | Click to lock mouse | WASD move | Space jump | F camera";
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
  playTone(420, 0.12, "triangle", 0.045);
  playTone(240, 0.18, "triangle", 0.055, 0.08);
  setTransition(true);
  if (document.pointerLockElement === canvas) document.exitPointerLock();
  window.setTimeout(() => {
    gameMode = "driving";
    world.visible = true;
    player.group.visible = true;
    if (outsideState.character) outsideState.character.visible = false;
    minimapEl.classList.remove("hidden");
    mobileJumpButton.classList.add("hidden");
    player.x = SMARKET_ENTRANCE.x;
    player.z = SMARKET_ENTRANCE.z - 70;
    player.vx = 0;
    player.vz = 0;
    player.angle = 0;
    syncVehicle(player);
    storeState.y = 0;
    storeState.vy = 0;
    storeState.grounded = true;
    storeState.punchCharging = false;
    storeState.punchCharge = 0;
    storeState.punchTimer = 0;
    storeState.punchCooldown = 0;
    storeState.hasMegaforce = false;
    storeState.drinking = false;
    storeState.drinkProgress = 0;
    storeState.drinkTimer = 0;
    storeState.drinkDuration = 0;
    storeState.boostReady = false;
    storeState.purchaseTimer = 0;
    storeState.purchaseDuration = 0;
    removeStorePurchaseFx();
    if (storeState.scanner) storeState.scanner.scale.set(1, 1, 1);
    purchasePromptEl.classList.add("hidden");
    storeState.damageTimer = 0;
    storeState.damageShake = 0;
    damageFxEl.style.opacity = "0";
    storeDeathScreenEl.classList.add("hidden");
    clearStoreImpactFx();
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

function outsideWorldPositionIsClear(x, z, radius = 8) {
  for (const collider of colliders) {
    if (collider.disabled) continue;
    const broadRadius = Number.isFinite(collider.r)
      ? collider.r
      : Math.hypot(collider.w || 0, collider.d || 0) * 0.5;
    if (Math.hypot(x - collider.x, z - collider.z) > broadRadius + radius + 4) continue;
    if (collider.type === "tree") {
      if (Math.hypot(x - collider.x, z - collider.z) < radius + (collider.r || 12)) return false;
    } else if (Number.isFinite(collider.w) && Number.isFinite(collider.d)) {
      if (storeRectCollision(x, z, radius, collider)) return false;
    }
  }
  return true;
}

function outsideExitSpotIsClear(x, z) {
  const radius = 9;
  if (!outsideWorldPositionIsClear(x, z, radius)) return false;

  for (const vehicle of [...cops, ...traffic]) {
    if (Math.hypot(x - vehicle.x, z - vehicle.z) < radius + (vehicle.radius || 21) + 5) return false;
  }
  return true;
}

function safeOutsideExitSpot(anchor) {
  const right = { x: Math.cos(anchor.angle), z: -Math.sin(anchor.angle) };
  const forward = { x: -Math.sin(anchor.angle), z: -Math.cos(anchor.angle) };
  const preferredDirections = [
    right,
    { x: -right.x, z: -right.z },
    { x: -forward.x, z: -forward.z },
    forward,
    { x: (right.x - forward.x) * 0.707, z: (right.z - forward.z) * 0.707 },
    { x: (-right.x - forward.x) * 0.707, z: (-right.z - forward.z) * 0.707 },
  ];
  const radialDirections = Array.from({ length: 16 }, (_, index) => {
    const angle = anchor.angle + index * Math.PI / 8;
    return { x: Math.cos(angle), z: Math.sin(angle) };
  });
  const directions = [...preferredDirections, ...radialDirections];
  for (const distance of [42, 56, 72, 92, 118, 148, 180]) {
    for (const direction of directions) {
      const spot = { x: anchor.x + direction.x * distance, z: anchor.z + direction.z * distance };
      if (outsideExitSpotIsClear(spot.x, spot.z)) return spot;
    }
  }
  return { x: anchor.x, z: anchor.z };
}

function exitVehicleToFoot() {
  if (gameMode !== "driving" || transitionLock || gameOver || !running) return;
  if (player.airborne || (player.y || 0) > 2.5 || Math.abs(player.roll || 0) > 0.55 || Math.abs(player.pitch || 0) > 0.55) {
    showNotification("Wait until the car is on the ground");
    playUiError();
    return;
  }
  transitionLock = true;
  setTransition(true);
  const exitAnchor = {
    x: Number.isFinite(player.x) ? player.x : lastPlayerX,
    z: Number.isFinite(player.z) ? player.z : lastPlayerZ,
    angle: Number.isFinite(player.angle) ? player.angle : 0,
  };
  player.y = 0;
  player.vy = 0;
  player.airborne = false;
  player.wrecked = false;
  player.roll = 0;
  player.pitch = 0;
  player.rollVel = 0;
  player.pitchVel = 0;
  player.spinVel = 0;
  player.vx = 0;
  player.vz = 0;
  player.steer = 0;
  player.steerCharge = 0;
  syncVehicle(player);

  const exitSpot = safeOutsideExitSpot(exitAnchor);
  window.setTimeout(() => {
    player.x = exitAnchor.x;
    player.z = exitAnchor.z;
    player.angle = exitAnchor.angle;
    player.y = 0;
    player.vx = 0;
    player.vz = 0;
    player.vy = 0;
    player.roll = 0;
    player.pitch = 0;
    player.rollVel = 0;
    player.pitchVel = 0;
    player.spinVel = 0;
    player.airborne = false;
    player.wrecked = false;
    syncVehicle(player);
    player.group.position.set(exitAnchor.x, 0, exitAnchor.z);
    player.group.rotation.set(0, exitAnchor.angle, 0);
    gameMode = "walking";
    outsideState.x = exitSpot.x;
    outsideState.z = exitSpot.z;
    outsideState.angle = player.angle;
    outsideState.walkCycle = 0;
    outsideState.carjackTarget = null;
    outsideState.carjackTimer = 0;
    outsideState.exitProtection = 0.6;
    if (!outsideState.character) createOutsideCharacter();
    applyCharacterStyleToPerson(outsideState.character, characterStyle);
    outsideState.character.scale.setScalar(OUTSIDE_CHARACTER_SCALE);
    outsideState.character.visible = true;
    outsideState.character.position.set(outsideState.x, 0, outsideState.z);
    outsideState.character.rotation.set(0, outsideState.angle, 0);
    const cameraForwardX = -Math.sin(outsideState.angle);
    const cameraForwardZ = -Math.cos(outsideState.angle);
    cameraState.position.set(outsideState.x - cameraForwardX * 138, 88, outsideState.z - cameraForwardZ * 138);
    cameraState.target.set(outsideState.x + cameraForwardX * 34, 15, outsideState.z + cameraForwardZ * 34);
    cameraState.shake = 0;
    cameraState.tilt = 0;
    camera.position.copy(cameraState.position);
    camera.lookAt(cameraState.target);
    camera.updateMatrixWorld(true);
    updateChunks();
    hintEl.textContent = "On foot | WASD walk | F enter/carjack";
    showNotification(`${playerName} left the car`);
    window.setTimeout(() => {
      setTransition(false);
      transitionLock = false;
    }, 180);
  }, 220);
}

function enterVehicleFromFoot(vehicle = player) {
  if (gameMode !== "walking" || transitionLock || !running) return;
  if (vehicle !== player) {
    vehicle.beingCarjacked = false;
    const index = traffic.indexOf(vehicle);
    if (index >= 0) traffic.splice(index, 1);
    scene.remove(vehicle.group);
  }
  player.x = vehicle.x;
  player.z = vehicle.z;
  player.angle = vehicle.angle;
  player.vx = vehicle.vx || 0;
  player.vz = vehicle.vz || 0;
  player.y = 0;
  player.roll = 0;
  player.pitch = 0;
  player.group.visible = true;
  syncVehicle(player);
  if (outsideState.character) outsideState.character.visible = false;
  outsideState.carjackTarget = null;
  outsideState.carjackTimer = 0;
  gameMode = "driving";
  hintEl.textContent = inputState.mobile ? "Joystick drive" : "W/S drive, A/D turn";
  showNotification(vehicle === player ? `${playerName} entered the car` : `${playerName} stole a car`, true);
}

function findCarjackTarget() {
  let best = null;
  for (const car of traffic) {
    if (car.airborne || car.wrecked) continue;
    const d = Math.hypot(car.x - outsideState.x, car.z - outsideState.z);
    if (d > 58) continue;
    if (!best || d < best.distance) best = { car, distance: d };
  }
  return best?.car || null;
}

function handleOutsideAction() {
  if (gameMode !== "walking" || transitionLock || outsideState.carjackTarget) return;
  if (Math.hypot(player.x - outsideState.x, player.z - outsideState.z) < 62) {
    enterVehicleFromFoot(player);
    return;
  }
  const target = findCarjackTarget();
  if (!target) {
    showNotification("No car close enough");
    playUiError();
    return;
  }
  outsideState.carjackTarget = target;
  outsideState.carjackTimer = outsideState.carjackDuration;
  target.beingCarjacked = true;
  target.vx = 0;
  target.vz = 0;
  target.escapeTimer = 0;
  target.jamTime = 0;
  syncVehicle(target);
  showNotification("Carjacking... 3s", true);
  playNoiseHit(0.12, 0.08, 520);
}

function updateOutsideCharacterAnimation(dt, moving) {
  const character = outsideState.character;
  if (!character || !character.userData.head) return;
  const t = outsideState.walkCycle;
  const swing = moving ? Math.sin(t) * 0.86 : 0;
  const side = moving ? Math.sin(t * 2) * 0.065 : 0;
  const strideTwist = moving ? Math.sin(t) * 0.08 : 0;
  const shoulderRoll = moving ? Math.sin(t * 2) * 0.035 : 0;
  const jackPulse = outsideState.carjackTarget ? Math.sin(performance.now() * 0.022) : 0;
  const ease = 1 - Math.exp(-dt * 12);
  character.position.set(outsideState.x, moving ? Math.abs(Math.sin(t)) * 1.9 : 0, outsideState.z);
  character.rotation.y = outsideState.angle;
  character.rotation.z = lerp(character.rotation.z, outsideState.carjackTarget ? jackPulse * 0.055 : -side * 0.9, ease);
  character.rotation.x = lerp(character.rotation.x, moving ? Math.abs(Math.sin(t)) * 0.025 : 0, ease);
  character.userData.leftArm.rotation.x = lerp(character.userData.leftArm.rotation.x, outsideState.carjackTarget ? -0.92 + jackPulse * 0.58 : swing * 0.98, ease);
  character.userData.leftArm.rotation.z = lerp(character.userData.leftArm.rotation.z, outsideState.carjackTarget ? 0.42 : 0.08 + shoulderRoll, ease);
  character.userData.rightArm.rotation.x = lerp(character.userData.rightArm.rotation.x, outsideState.carjackTarget ? -1.3 - jackPulse * 0.68 : -swing, ease);
  character.userData.rightArm.rotation.y = lerp(character.userData.rightArm.rotation.y, outsideState.carjackTarget ? -0.24 + jackPulse * 0.1 : 0, ease);
  character.userData.rightArm.rotation.z = lerp(character.userData.rightArm.rotation.z, outsideState.carjackTarget ? -0.36 : -0.08 - shoulderRoll, ease);
  character.userData.leftLeg.rotation.x = lerp(character.userData.leftLeg.rotation.x, -swing * 0.9, ease);
  character.userData.rightLeg.rotation.x = lerp(character.userData.rightLeg.rotation.x, swing * 0.9, ease);
  character.userData.leftLeg.rotation.z = lerp(character.userData.leftLeg.rotation.z, -0.035 - strideTwist * 0.18, ease);
  character.userData.rightLeg.rotation.z = lerp(character.userData.rightLeg.rotation.z, 0.035 - strideTwist * 0.18, ease);
  character.userData.head.rotation.z = lerp(character.userData.head.rotation.z, side, ease);
  character.userData.head.rotation.x = lerp(character.userData.head.rotation.x, moving ? Math.abs(Math.sin(t)) * 0.035 : 0, ease);
}

function updateWalking(dt) {
  if (!outsideState.character) createOutsideCharacter();
  outsideState.exitProtection = Math.max(0, (outsideState.exitProtection || 0) - dt);
  if (outsideState.carjackTarget) {
    const target = outsideState.carjackTarget;
    target.vx = 0;
    target.vz = 0;
    syncVehicle(target);
    const side = vehicleRight(target);
    outsideState.x = lerp(outsideState.x, target.x + side.x * 28, 1 - Math.exp(-dt * 6));
    outsideState.z = lerp(outsideState.z, target.z + side.z * 28, 1 - Math.exp(-dt * 6));
    outsideState.angle += angleDelta(outsideState.angle, target.angle - Math.PI * 0.5) * (1 - Math.exp(-dt * 8));
    outsideState.walkCycle += dt * 10;
    outsideState.carjackTimer -= dt;
    hintEl.textContent = `Carjacking ${Math.ceil(outsideState.carjackTimer)}s`;
    if (outsideState.carjackTimer <= 0) enterVehicleFromFoot(target);
    updateOutsideCharacterAnimation(dt, true);
    return;
  }

  const previousX = outsideState.x;
  const previousZ = outsideState.z;

  const moveInput = inputState.mobile
    ? inputState.throttle
    : (keys.has("w") || keys.has("arrowup") ? 1 : 0) + (keys.has("s") || keys.has("arrowdown") ? -1 : 0);
  const strafeInput = inputState.mobile
    ? -inputState.steer
    : (keys.has("d") || keys.has("arrowright") ? 1 : 0) + (keys.has("a") || keys.has("arrowleft") ? -1 : 0);
  const moveLen = Math.hypot(moveInput, strafeInput);
  const moving = moveLen > 0.05;
  if (moving) {
    const scale = 1 / Math.max(1, moveLen);
    const fx = -Math.sin(outsideState.angle);
    const fz = -Math.cos(outsideState.angle);
    const rx = Math.cos(outsideState.angle);
    const rz = -Math.sin(outsideState.angle);
    const moveX = (fx * moveInput + rx * strafeInput) * scale;
    const moveZ = (fz * moveInput + rz * strafeInput) * scale;
    const moveYaw = Math.atan2(-moveX, -moveZ);
    outsideState.angle += angleDelta(outsideState.angle, moveYaw) * (1 - Math.exp(-dt * 8));
    outsideState.x += moveX * 118 * dt;
    outsideState.z += moveZ * 118 * dt;
    outsideState.walkCycle += moveLen * scale * dt * 8.3;
  } else {
    outsideState.walkCycle = lerp(outsideState.walkCycle, Math.round(outsideState.walkCycle / Math.PI) * Math.PI, 1 - Math.exp(-dt * 5));
  }

  if (outsideState.exitProtection <= 0 && !outsideWorldPositionIsClear(outsideState.x, outsideState.z, 8)) {
    const candidateX = outsideState.x;
    const candidateZ = outsideState.z;
    const canSlideX = outsideWorldPositionIsClear(candidateX, previousZ, 8);
    const canSlideZ = outsideWorldPositionIsClear(previousX, candidateZ, 8);
    outsideState.x = canSlideX ? candidateX : previousX;
    outsideState.z = canSlideZ ? candidateZ : previousZ;
    if (!outsideWorldPositionIsClear(outsideState.x, outsideState.z, 8)) {
      outsideState.x = previousX;
      outsideState.z = previousZ;
    }
  }

  updateOutsideCharacterAnimation(dt, moving);
  const target = findCarjackTarget();
  if (Math.hypot(player.x - outsideState.x, player.z - outsideState.z) < 62) {
    hintEl.textContent = "On foot | F enter your car | WASD walk";
  } else if (target) {
    hintEl.textContent = "On foot | F carjack vehicle | WASD walk";
  } else {
    hintEl.textContent = "On foot | WASD walk | F near a car";
  }
}

function requestStorePointerLock() {
  if (gameMode !== "store" || transitionLock || inputState.mobile) return;
  if (document.pointerLockElement !== canvas && canvas.requestPointerLock) {
    canvas.requestPointerLock();
  }
}

function updatePointerLockHint() {
  if (gameMode !== "store") return;
  if (inputState.mobile) {
    hintEl.textContent = "Joystick move | swipe to look | green circle exits";
    return;
  }
  const modeText = storeState.cameraMode === "first" ? "First person" : "Third person";
  hintEl.textContent = document.pointerLockElement === canvas
    ? `${modeText} | Mouse look | WASD move | Space jump | F camera | Esc unlocks`
    : `${modeText} | Click to lock mouse | WASD move | Space jump | F camera`;
}

function handleStoreMouseLook(event) {
  if (gameMode !== "store" || document.pointerLockElement !== canvas) return;
  storeState.angle -= event.movementX * 0.0027;
  storeState.cameraYaw = storeState.angle;
  const pitchLimit = storeState.cameraMode === "first" ? 1.52 : 0.58;
  storeState.pitch = clamp(storeState.pitch - event.movementY * 0.0021, -pitchLimit, pitchLimit);
}

function toggleStoreCameraMode() {
  if (gameMode !== "store" || transitionLock || storeState.dead) return;
  playUiClick();
  storeState.cameraMode = storeState.cameraMode === "first" ? "third" : "first";
  storeState.character.visible = storeState.cameraMode !== "first";
  if (storeState.fist) storeState.fist.visible = storeState.cameraMode === "first";
  updatePointerLockHint();
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

  const baleCount = 2 + Math.floor(rng() * 3);
  for (let i = 0; i < baleCount; i++) {
    const bale = new THREE.Mesh(new THREE.CylinderGeometry(6.5, 6.5, 12, 12), mats.hay);
    bale.rotation.z = Math.PI * 0.5;
    bale.rotation.y = rng() * Math.PI;
    bale.position.set(x + (rng() - 0.5) * w * 0.68, 6.7, z + (rng() - 0.5) * d * 0.64);
    bale.castShadow = true;
    parent.add(bale);
  }

  const fenceZ = z + d * 0.5 + 5;
  for (let fx = x - w * 0.42; fx <= x + w * 0.42; fx += 22) {
    const post = makeBox(2.2, 10, 2.2, mats.fence);
    post.position.set(fx, 5, fenceZ);
    parent.add(post);
  }
  for (const fy of [4.2, 8]) {
    const rail = makeBox(w * 0.86, 1.6, 1.8, mats.fence);
    rail.position.set(x, fy, fenceZ);
    parent.add(rail);
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

  for (const side of [-1, 1]) {
    const goalTop = makeBox(30, 2, 2, mats.curb);
    goalTop.position.set(x + side * (w * 0.5 - 3), 12, z);
    goalTop.rotation.y = Math.PI * 0.5;
    parent.add(goalTop);
    for (const gz of [-14, 14]) {
      const goalPost = makeBox(2, 24, 2, mats.curb);
      goalPost.position.set(x + side * (w * 0.5 - 3), 12, z + gz);
      parent.add(goalPost);
    }
  }

  const benchSeat = makeBox(30, 3, 8, mats.fence);
  benchSeat.position.set(x, 7, z + d * 0.5 + 13);
  const benchBack = makeBox(30, 11, 2.4, mats.fence);
  benchBack.position.set(x, 13, z + d * 0.5 + 17);
  parent.add(benchSeat, benchBack);
  for (const bx of [-11, 11]) {
    const leg = makeBox(2.5, 7, 4, mats.metal);
    leg.position.set(x + bx, 3.5, z + d * 0.5 + 13);
    parent.add(leg);
  }
}

function addBusStop(parent, x, z, axis) {
  const stop = new THREE.Group();
  stop.position.set(x, 0, z);
  stop.rotation.y = axis === "z" ? Math.PI * 0.5 : 0;

  const pad = makePlane(58, 27, mats.concrete, 0.08);
  pad.position.y = 0.08;
  const roof = makeBox(54, 3.5, 24, mats.marketBlue);
  roof.position.set(0, 29, 0);
  const backFrame = makeBox(54, 24, 2.2, mats.metal);
  backFrame.position.set(0, 15, 10.5);
  const backGlass = makeBox(47, 19, 1.4, mats.window);
  backGlass.position.set(0, 15, 9.2);
  stop.add(pad, roof, backFrame, backGlass);

  for (const side of [-1, 1]) {
    const sideFrame = makeBox(2.2, 24, 21, mats.metal);
    sideFrame.position.set(side * 25.8, 15, 0);
    stop.add(sideFrame);
  }

  const seat = makeBox(34, 3, 8, mats.fence);
  seat.position.set(0, 8, 5);
  const seatBack = makeBox(34, 11, 2.2, mats.fence);
  seatBack.position.set(0, 14, 8.5);
  stop.add(seat, seatBack);

  const pole = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.4, 31, 8), mats.metal);
  pole.position.set(35, 15.5, 0);
  const marker = makeBox(12, 15, 2.2, mats.marketBlue);
  marker.position.set(35, 29, 0);
  const markerFace = new THREE.Mesh(new THREE.CircleGeometry(4, 16), mats.light);
  markerFace.position.set(35, 30, -1.2);
  stop.add(pole, marker, markerFace);
  parent.add(stop);
}

function findRoadsideSpot(baseX, baseZ, rng, reserved, placed) {
  for (let i = 0; i < 28; i++) {
    const x = baseX + (rng() - 0.5) * (CHUNK - 48);
    const z = baseZ + (rng() - 0.5) * (CHUNK - 48);
    if (inSpawnRoadKeepout(x, z)) continue;
    const road = nearestRoad(x, z);
    if (road.distance < ROAD * 0.5 + 12 || road.distance > ROAD * 0.5 + 28) continue;
    if (reserved.some((p) => Math.abs(p.x - x) < p.w * 0.55 + 34 && Math.abs(p.z - z) < p.d * 0.55 + 24)) continue;
    if (placed.some((p) => Math.abs(p.x - x) < p.w * 0.55 + 34 && Math.abs(p.z - z) < p.d * 0.55 + 24)) continue;
    return { x, z, axis: road.axis };
  }
  return null;
}

function addAmbientLandscape(parent, baseX, baseZ, biome, rng, reserved, placed) {
  const freeSpot = (radius, margin = 16) => {
    const spot = randomOffRoadSpot(baseX, baseZ, radius, radius, rng);
    if (!spot || areaTouchesRoad(spot.x, spot.z, radius * 2, radius * 2, margin)) return null;
    if (reserved.some((p) => Math.abs(p.x - spot.x) < p.w * 0.55 + radius && Math.abs(p.z - spot.z) < p.d * 0.55 + radius)) return null;
    if (placed.some((p) => Math.abs(p.x - spot.x) < p.w * 0.55 + radius && Math.abs(p.z - spot.z) < p.d * 0.55 + radius)) return null;
    return spot;
  };

  const bushCount = biome === "open" ? 3 : biome === "sparseForest" ? 2 : 1;
  for (let i = 0; i < bushCount; i++) {
    const spot = freeSpot(10, 20);
    if (spot) addBush(parent, spot.x, spot.z, 0.7 + rng() * 0.55);
  }

  if ((biome === "open" || biome === "playground") && rng() < 0.6) {
    const spot = freeSpot(12, 24);
    if (spot) {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.6, 34, 8), mats.metal);
      pole.position.set(spot.x, 17, spot.z);
      pole.castShadow = true;
      const arm = makeBox(12, 1.8, 1.8, mats.metal);
      arm.position.set(spot.x + 5, 33, spot.z);
      const lamp = makeBox(8, 2.4, 5, mats.light);
      lamp.position.set(spot.x + 10, 31.8, spot.z);
      parent.add(pole, arm, lamp);
    }
  }

  if (biome === "open" && rng() < 0.45) {
    const spot = freeSpot(20, 20);
    if (spot) {
      const path = makePlane(42, 18, mats.concrete, 0.05);
      path.position.set(spot.x, 0.05, spot.z);
      parent.add(path);
      for (const offset of [-13, 13]) addBush(parent, spot.x + offset, spot.z, 0.75);
    }
  }

  if ((biome === "open" || biome === "sparseForest" || biome === "playground") && rng() < 0.24) {
    const stop = findRoadsideSpot(baseX, baseZ, rng, reserved, placed);
    if (stop) addBusStop(parent, stop.x, stop.z, stop.axis);
  }
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
  addAmbientLandscape(group, baseX, baseZ, biome, rng, reserved, placed);
}

function disposeChunk(group) {
  group.traverse((obj) => {
    if (obj.geometry) obj.geometry.dispose();
  });
  world.remove(group);
}

function updateChunks() {
  const pcx = Math.round(focusX() / CHUNK);
  const pcz = Math.round(focusZ() / CHUNK);
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

function isPoliceVehicle(v) {
  return !!v && POLICE_KINDS.has(v.kind);
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
  const fx0 = focusX();
  const fz0 = focusZ();
  const dx = x - fx0;
  const dz = z - fz0;
  const distance = Math.hypot(dx, dz);
  if (distance < minDistance) return false;

  const forward = gameMode === "walking"
    ? { x: Math.sin(outsideState.angle), z: Math.cos(outsideState.angle) }
    : vehicleForward(player);
  const right = gameMode === "walking"
    ? { x: -Math.cos(outsideState.angle), z: Math.sin(outsideState.angle) }
    : vehicleRight(player);
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
  const fx0 = focusX();
  const fz0 = focusZ();

  if (axis === "x") {
    let id = nearestRoadIdForAxis("x", fx0, fz0);
    if (Math.random() < 0.55) id += Math.floor(Math.random() * 3) - 1;
    while (!sideRoadExists(id)) id += id < nearestRoadIdForAxis("x", fx0, fz0) ? 1 : -1;
    const x = fx0 + ahead;
    const z = roadCenterZ(id, x);
    const lane = laneCenterFor("x", dir, x, z, id);
    return { axis, id, dir, x: lane.x, z: lane.z, angle: trafficAngle("x", dir, lane.x, lane.z, id) };
  }

  let id = nearestRoadIdForAxis("z", fx0, fz0);
  if (Math.random() < 0.55) id += Math.floor(Math.random() * 3) - 1;
  while (!mainRoadExists(id)) id += id < nearestRoadIdForAxis("z", fx0, fz0) ? 1 : -1;
  const z = fz0 + ahead;
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

function policeTargetForward(target) {
  const speed = Math.hypot(target.vx || 0, target.vz || 0);
  if (speed > 12) return { x: target.vx / speed, z: target.vz / speed };
  const angle = Number.isFinite(target.angle) ? target.angle : policeState.lastKnownAngle;
  return { x: -Math.sin(angle), z: -Math.cos(angle) };
}

function segmentDistanceToPoint(ax, az, bx, bz, px, pz) {
  const dx = bx - ax;
  const dz = bz - az;
  const length2 = dx * dx + dz * dz;
  const t = length2 > 0 ? clamp(((px - ax) * dx + (pz - az) * dz) / length2, 0, 1) : 0;
  return Math.hypot(px - (ax + dx * t), pz - (az + dz * t));
}

function policeLineBlocked(ax, az, bx, bz, aerial = false) {
  const total = Math.hypot(bx - ax, bz - az);
  for (const collider of colliders) {
    if (collider.disabled || collider.type === "tree") continue;
    const along = total > 0 ? Math.hypot(collider.x - ax, collider.z - az) / total : 0;
    if (aerial && (along < 0.18 || along > 0.88)) continue;
    const blockerRadius = Math.min(collider.r || 35, Math.max(collider.w || 0, collider.d || 0) * 0.58 || 35);
    if (segmentDistanceToPoint(ax, az, bx, bz, collider.x, collider.z) < blockerRadius) return true;
  }
  return false;
}

function policeHasSight(observer, target, aerial = false) {
  const dx = target.x - observer.x;
  const dz = target.z - observer.z;
  const distance = Math.hypot(dx, dz);
  const maxDistance = aerial ? 1180 : 470 + policeState.level * 95;
  if (distance > maxDistance) return false;
  if (!aerial && distance > 125) {
    const forward = vehicleForward(observer);
    if ((dx * forward.x + dz * forward.z) / Math.max(distance, 1) < -0.18) return false;
  }
  return !policeLineBlocked(observer.x, observer.z, target.x, target.z, aerial);
}

function spawnVisibleToAnyPlayer(x, z) {
  for (const target of playerChaseTargets()) {
    const dx = x - target.x;
    const dz = z - target.z;
    const distance = Math.hypot(dx, dz);
    if (distance < POLICE_SPAWN_MIN) return true;
    const forward = policeTargetForward(target);
    const inView = (dx * forward.x + dz * forward.z) / Math.max(distance, 1) > 0.28;
    if (inView && distance < 1520 && !policeLineBlocked(target.x, target.z, x, z)) return true;
  }
  return false;
}

function roadPointNear(x, z, preferredX = 0, preferredZ = -1) {
  const road = nearestRoad(x, z);
  const plusAngle = trafficAngle(road.axis, 1, x, z, road.id);
  const plusForward = { x: -Math.sin(plusAngle), z: -Math.cos(plusAngle) };
  const dir = plusForward.x * preferredX + plusForward.z * preferredZ >= 0 ? 1 : -1;
  const centerX = road.axis === "z" ? roadCenterX(road.id, z) : x;
  const centerZ = road.axis === "x" ? roadCenterZ(road.id, x) : z;
  const lane = laneCenterFor(road.axis, dir, centerX, centerZ, road.id);
  return {
    axis: road.axis,
    id: road.id,
    dir,
    x: lane.x,
    z: lane.z,
    angle: trafficAngle(road.axis, dir, lane.x, lane.z, road.id),
  };
}

function roadIntersectionNear(x, z, preferredX = 0, preferredZ = -1) {
  const mainId = nearestRoadIdForAxis("z", x, z);
  const sideId = nearestRoadIdForAxis("x", x, z);
  let ix = roadCenterX(mainId, z);
  let iz = roadCenterZ(sideId, ix);
  for (let i = 0; i < 4; i++) {
    ix = roadCenterX(mainId, iz);
    iz = roadCenterZ(sideId, ix);
  }
  const useSideRoad = Math.abs(preferredX) > Math.abs(preferredZ);
  const axis = useSideRoad ? "x" : "z";
  const id = useSideRoad ? sideId : mainId;
  const plusAngle = trafficAngle(axis, 1, ix, iz, id);
  const plusForward = { x: -Math.sin(plusAngle), z: -Math.cos(plusAngle) };
  const dir = plusForward.x * preferredX + plusForward.z * preferredZ >= 0 ? 1 : -1;
  const lane = laneCenterFor(axis, dir, ix, iz, id);
  return { axis, id, dir, x: lane.x, z: lane.z, angle: trafficAngle(axis, dir, lane.x, lane.z, id) };
}

function policeReferenceTarget() {
  const targets = playerChaseTargets();
  if (policeState.hasVisual && targets.length) {
    return targets.reduce((best, target) => {
      const targetDistance = Math.hypot(target.x - policeState.lastKnownX, target.z - policeState.lastKnownZ);
      const bestDistance = Math.hypot(best.x - policeState.lastKnownX, best.z - policeState.lastKnownZ);
      return targetDistance < bestDistance ? target : best;
    }, targets[0]);
  }
  return {
    x: policeState.lastKnownX,
    z: policeState.lastKnownZ,
    vx: policeState.lastKnownVx,
    vz: policeState.lastKnownVz,
    angle: policeState.lastKnownAngle,
  };
}

function choosePoliceRoadSpawn(role, tier, target, tries = 38) {
  const forward = policeTargetForward(target);
  const right = { x: forward.z, z: -forward.x };
  const speed = Math.hypot(target.vx || 0, target.vz || 0);
  const predictionDistance = clamp(speed * tier.prediction, 120, 620);

  for (let i = 0; i < tries; i++) {
    let ahead;
    let side;
    if (role === POLICE_ROLES.INTERCEPTOR || role === POLICE_ROLES.ROADBLOCK) {
      ahead = predictionDistance + 620 + Math.random() * 620;
      side = (Math.random() - 0.5) * (role === POLICE_ROLES.ROADBLOCK ? 520 : 900);
    } else if (role === POLICE_ROLES.SUPPORT) {
      ahead = 180 + Math.random() * 980;
      side = (Math.random() < 0.5 ? -1 : 1) * (420 + Math.random() * 620);
    } else {
      const frontChance = policeState.level >= 2 ? 0.42 + policeState.level * 0.05 : 0.24;
      ahead = (Math.random() < frontChance ? 1 : -1) * (640 + Math.random() * 650);
      side = (Math.random() - 0.5) * (policeState.level >= 2 ? 900 : 380);
    }

    const rawX = target.x + forward.x * ahead + right.x * side;
    const rawZ = target.z + forward.z * ahead + right.z * side;
    const preferredX = role === POLICE_ROLES.PURSUIT ? forward.x : -forward.x;
    const preferredZ = role === POLICE_ROLES.PURSUIT ? forward.z : -forward.z;
    const useIntersection = policeState.level >= 2 && (role === POLICE_ROLES.ROADBLOCK || role === POLICE_ROLES.SUPPORT || i % 4 === 0);
    const spawn = useIntersection
      ? roadIntersectionNear(rawX, rawZ, preferredX, preferredZ)
      : roadPointNear(rawX, rawZ, preferredX, preferredZ);
    const referenceDistance = Math.hypot(spawn.x - target.x, spawn.z - target.z);
    if (referenceDistance < POLICE_SPAWN_MIN || referenceDistance > POLICE_SPAWN_MAX + 260) continue;
    if (spawnVisibleToAnyPlayer(spawn.x, spawn.z)) continue;
    if (cops.some((other) => Math.hypot(spawn.x - other.x, spawn.z - other.z) < 155)) continue;
    return spawn;
  }

  for (let i = 0; i < 18; i++) {
    const fallback = chooseHiddenRoadSpawn(POLICE_SPAWN_MIN, POLICE_SPAWN_MAX + 120);
    if (!spawnVisibleToAnyPlayer(fallback.x, fallback.z) && !cops.some((other) => Math.hypot(fallback.x - other.x, fallback.z - other.z) < 155)) return fallback;
  }
  return null;
}

function choosePoliceRole(level) {
  const counts = cops.reduce((result, cop) => {
    result[cop.policeRole] = (result[cop.policeRole] || 0) + 1;
    return result;
  }, {});
  if (!(counts[POLICE_ROLES.PURSUIT] > 0)) return POLICE_ROLES.PURSUIT;
  const roll = Math.random();
  if (level === 1) return POLICE_ROLES.PURSUIT;
  if (level === 2) return roll < 0.56 ? POLICE_ROLES.PURSUIT : roll < 0.77 ? POLICE_ROLES.INTERCEPTOR : POLICE_ROLES.SUPPORT;
  if (roll < (level >= 5 ? 0.3 : 0.38)) return POLICE_ROLES.PURSUIT;
  if (roll < 0.64) return POLICE_ROLES.INTERCEPTOR;
  if (roll < 0.82) return POLICE_ROLES.SUPPORT;
  return POLICE_ROLES.ROADBLOCK;
}

function choosePoliceKind(level, role) {
  if (level >= 4 && role === POLICE_ROLES.INTERCEPTOR && Math.random() < 0.72) return "interceptor";
  const swatChance = level === 3 ? 0.16 : level === 4 ? 0.22 : level >= 5 ? 0.27 : 0;
  return Math.random() < swatChance ? "swat" : "cop";
}

function spawnCop(role = choosePoliceRole(policeState.level || 1)) {
  const tier = WANTED_TIERS[policeState.level || 1];
  const target = policeReferenceTarget();
  const spawn = choosePoliceRoadSpawn(role, tier, target);
  if (!spawn) return null;
  const kind = choosePoliceKind(policeState.level, role);
  const cop = makeVehicle(kind, spawn.x, spawn.z, spawn.angle);
  cop.roadAxis = spawn.axis;
  cop.roadId = spawn.id;
  cop.dir = spawn.dir;
  cop.policeRole = role;
  cop.personality = kind === "interceptor" ? "aggressive" : kind === "swat" ? "blocker" : Math.random() < 0.42 ? "aggressive" : "calm";
  cop.roleTargetX = policeState.lastKnownX;
  cop.roleTargetZ = policeState.lastKnownZ;
  if (role === POLICE_ROLES.ROADBLOCK) {
    const forward = policeTargetForward(target);
    const point = roadPointNear(target.x + forward.x * 430, target.z + forward.z * 430, -forward.x, -forward.z);
    cop.roleTargetX = point.x;
    cop.roleTargetZ = point.z;
    cop.roleTargetSet = true;
  }
  scene.add(cop.group);
  cops.push(cop);
  return cop;
}

function spawnTraffic() {
  for (let attempt = 0; attempt < 10; attempt++) {
    const spawn = chooseHiddenRoadSpawn(TRAFFIC_SPAWN_MIN, TRAFFIC_SPAWN_MAX);
    const behaviorRoll = Math.random();
    const kind = behaviorRoll < 0.22 ? "grandma" : behaviorRoll < 0.38 ? "drunk" : "normal";
    const archetype = chooseTrafficArchetype();
    const car = makeVehicle(kind, spawn.x, spawn.z, spawn.angle, null, archetype.id);
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
  playCrashSound(power);
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
  playNoiseHit(0.22, 0.11, 360);
  playTone(118, 0.2, "sawtooth", 0.06);
  makeDebrisBurst(tree.x, tree.z, 8, 42 + power * 0.18, 0x6b4a2c);
  makeSmoke(tree.x, tree.z, 5.5, 0x9b8a66, 0.75);
}

function launchVehicle(v, dirX, dirZ, power) {
  if (v.kind === "player" || isPoliceVehicle(v) || v.kind === "remote") return;
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
  audioState.driveSpeed = motion.total;
  audioState.driveThrottle = throttle;
  audioState.driftIntensity = 0;

  if (motion.total > 95) money += (motion.total - 90) * dt * (surface.onRoad ? 0.18 : 0.11);

  const driftAmount = Math.abs(motion.side);
  const driftTrigger = motion.slip > 0.08 || driftAmount > (surface.onRoad ? 16 : 10);
  if (motion.total > 48 && driftTrigger) {
    const intensity = clamp(Math.max((driftAmount - 10) / 54, motion.slip * 1.35), 0, 1);
    audioState.driftIntensity = intensity;
    money += driftAmount * dt * (surface.onRoad ? 0.42 : 0.24);
    if (Math.random() < (surface.onRoad ? 0.82 : 0.98)) makeTireSpray(player, 0.55 + intensity * 0.9, surface.onRoad);
    if (Math.random() < (surface.onRoad ? 0.32 : 0.54)) makeSmoke(player.x + Math.sin(player.angle) * 16, player.z + Math.cos(player.angle) * 16, 2.2 + intensity * 1.7, surface.onRoad ? 0xd0d0d0 : 0xbba36f, 0.34 + intensity * 0.18);
    if (surface.onRoad && Math.random() < 0.82) makeSkidMarks(player, intensity);
  } else if (throttle > 0 && motion.total > 18 && Math.random() < (surface.onRoad ? 0.16 : 0.36)) {
    const intensity = clamp(motion.total / 135, 0.18, surface.onRoad ? 0.62 : 0.9);
    makeTireSpray(player, intensity, surface.onRoad);
  }

  moneyEl.textContent = "$" + Math.floor(money);
  const boostText = megaforceBoostActive() ? ` | Megaforce ${Math.ceil(megaforceBoostRemaining())}s` : "";
  hintEl.textContent = (surface.onRoad ? "Road boost: speed + grip" : "Grass slows the car") + boostText;

}

function updateTraffic(dt) {
  let spawnAttempts = 0;
  while (traffic.length < MAX_TRAFFIC && spawnAttempts < 8) {
    spawnAttempts++;
    if (!spawnTraffic()) break;
  }
  for (let i = traffic.length - 1; i >= 0; i--) {
    const car = traffic[i];
    if (car.beingCarjacked) {
      car.vx = 0;
      car.vz = 0;
      syncVehicle(car);
      continue;
    }
    if (Math.hypot(car.x - focusX(), car.z - focusZ()) > TRAFFIC_DESPAWN_DISTANCE) {
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

    const archetypeTune = car.trafficTune || TRAFFIC_ARCHETYPE_BY_ID.sedan;
    const behaviorSpeed = car.kind === "grandma" ? 0.64 : car.kind === "drunk" ? 1.12 : 1;
    const behaviorAccel = car.kind === "grandma" ? 0.72 : car.kind === "drunk" ? 1.08 : 1;
    const maxSpeed = archetypeTune.maxSpeed * behaviorSpeed;
    driveVehicle(car, { steer, throttle }, dt, {
      accel: archetypeTune.accel * behaviorAccel * (escaping ? 1.08 : 1),
      brake: 180 * Math.min(1.12, archetypeTune.grip / 5.2),
      reverseAccel: 35 * behaviorAccel,
      maxSpeed: escaping ? maxSpeed + 14 : maxSpeed,
      reverseMax: 38,
      grip: escaping ? Math.min(3.3, archetypeTune.grip * 0.62) : car.kind === "drunk" ? archetypeTune.grip * 0.43 : archetypeTune.grip,
      coast: 65,
      turnRate: escaping ? archetypeTune.turnRate * 1.36 : car.kind === "drunk" ? archetypeTune.turnRate * 1.22 : archetypeTune.turnRate,
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
  const localTarget = gameMode === "walking"
    ? {
        x: outsideState.x,
        z: outsideState.z,
        vx: 0,
        vz: 0,
        airborne: false,
        wrecked: false,
      }
    : player;
  return [localTarget, ...remotePlayers.values()].filter((target) => !target.airborne && !target.wrecked);
}

function nearestChaseTarget(from) {
  const localTarget = gameMode === "walking"
    ? {
        x: outsideState.x,
        z: outsideState.z,
        vx: 0,
        vz: 0,
        airborne: false,
        wrecked: false,
      }
    : player;
  let best = localTarget;
  let bestDistance = dist(from, localTarget);
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

function makePoliceHelicopter(x, z) {
  const group = new THREE.Group();
  const add = (geometry, material, px, py, pz) => {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(px, py, pz);
    mesh.castShadow = true;
    group.add(mesh);
    return mesh;
  };
  add(new THREE.BoxGeometry(34, 16, 55), mats.helicopter, 0, 0, 0);
  add(new THREE.BoxGeometry(12, 10, 52), mats.helicopter, 0, 2, 47);
  add(new THREE.BoxGeometry(34, 4, 15), mats.copBlue, 0, 4, 72);
  add(new THREE.BoxGeometry(30, 9, 25), mats.glass, 0, 3, -22);
  const rotor = add(new THREE.BoxGeometry(112, 1.8, 5), mats.outline, 0, 13, 0);
  const tailRotor = add(new THREE.BoxGeometry(2, 30, 5), mats.outline, 0, 7, 73);
  const searchLight = new THREE.SpotLight(0xf3f0d0, 0, 720, Math.PI * 0.16, 0.5, 1.3);
  searchLight.position.set(0, -4, -10);
  searchLight.target.position.set(0, -260, -10);
  group.add(searchLight, searchLight.target);
  group.position.set(x, 250, z);
  scene.add(group);
  return {
    group,
    x,
    z,
    y: 250,
    angle: 0,
    phase: Math.random() * Math.PI * 2,
    rotor,
    tailRotor,
    searchLight,
    hasVisual: false,
  };
}

function spawnPoliceHelicopter() {
  const target = policeReferenceTarget();
  const angle = Math.random() * Math.PI * 2;
  policeHelicopters.push(makePoliceHelicopter(
    target.x + Math.sin(angle) * (900 + Math.random() * 260),
    target.z + Math.cos(angle) * (900 + Math.random() * 260)
  ));
}

function removePoliceHelicopter(index) {
  const helicopter = policeHelicopters[index];
  if (!helicopter) return;
  scene.remove(helicopter.group);
  policeHelicopters.splice(index, 1);
}

function createPoliceRoadblock(spawn, strength = 1, hasSpikes = false) {
  const group = new THREE.Group();
  const barrierWidth = ROAD * (strength > 1 ? 0.78 : 0.6);
  for (const z of [-12, 12]) {
    const bar = makeBox(barrierWidth, 6, 4, mats.policeBarrier);
    bar.position.set(0, 3, z);
    const stripe = makeBox(barrierWidth * 0.82, 2.2, 4.4, mats.policeBarrierStripe);
    stripe.position.set(0, 4, z);
    group.add(bar, stripe);
  }
  if (hasSpikes) {
    const strip = makeBox(ROAD * 0.82, 1.3, 11, mats.spikeStrip);
    strip.position.set(0, 0.65, -25);
    group.add(strip);
    for (let x = -ROAD * 0.36; x <= ROAD * 0.36; x += 7) {
      const spike = new THREE.Mesh(new THREE.ConeGeometry(1.1, 4.2, 5), mats.metal);
      spike.position.set(x, 2.2, -25);
      group.add(spike);
    }
  }
  group.position.set(spawn.x, 0, spawn.z);
  group.rotation.y = spawn.angle;
  scene.add(group);
  const roadblock = {
    group,
    x: spawn.x,
    z: spawn.z,
    angle: spawn.angle,
    life: ROADBLOCK_LIFETIME + Math.random() * 12,
    strength,
    hasSpikes,
    hitCooldown: 0,
  };
  policeRoadblocks.push(roadblock);
  return roadblock;
}

function removePoliceRoadblock(index) {
  const roadblock = policeRoadblocks[index];
  if (!roadblock) return;
  scene.remove(roadblock.group);
  policeRoadblocks.splice(index, 1);
}

function updatePoliceRoadblocks(dt) {
  for (let i = policeRoadblocks.length - 1; i >= 0; i--) {
    const roadblock = policeRoadblocks[i];
    roadblock.life -= dt;
    if (roadblock.life <= 0 || policeState.level < 2 || Math.hypot(roadblock.x - focusX(), roadblock.z - focusZ()) > 2100) {
      removePoliceRoadblock(i);
      continue;
    }
  }
}

function collidePoliceRoadblocks(dt) {
  if (gameMode !== "driving") return;
  for (const roadblock of policeRoadblocks) {
    roadblock.hitCooldown = Math.max(0, roadblock.hitCooldown - dt);
    const dx = player.x - roadblock.x;
    const dz = player.z - roadblock.z;
    const right = { x: Math.cos(roadblock.angle), z: -Math.sin(roadblock.angle) };
    const forward = { x: -Math.sin(roadblock.angle), z: -Math.cos(roadblock.angle) };
    const across = dx * right.x + dz * right.z;
    const along = dx * forward.x + dz * forward.z;
    const barrierHit = vehicleObbCollision(player, {
      x: roadblock.x,
      z: roadblock.z,
      angle: roadblock.angle,
      halfWidth: ROAD * (roadblock.strength > 1 ? 0.39 : 0.3),
      halfLength: 15,
    });
    if (barrierHit && Math.abs(across) < ROAD * 0.47) {
      pushVehicleNormal(player, barrierHit.nx, barrierHit.nz, barrierHit.overlap + 0.4, 0.42);
    }
    if (roadblock.hasSpikes && roadblock.hitCooldown <= 0 && Math.abs(across) < ROAD * 0.48 && Math.abs(along - 25) < 15) {
      roadblock.hitCooldown = 2;
      player.vx *= 0.48;
      player.vz *= 0.48;
      player.steerCharge = clamp((player.steerCharge || 0) + (Math.random() < 0.5 ? -0.7 : 0.7), -1, 1);
      cameraState.shake = Math.max(cameraState.shake, 1.1);
      for (let p = 0; p < 9; p++) makeTireSpray(player, 0.9, true);
      showNotification("Police spike strip hit", true);
    }
  }
}

function updatePoliceHelicopters(dt) {
  const target = policeReferenceTarget();
  for (let i = policeHelicopters.length - 1; i >= 0; i--) {
    const helicopter = policeHelicopters[i];
    if (policeState.level < 5) {
      removePoliceHelicopter(i);
      continue;
    }
    helicopter.phase += dt * 0.42;
    const orbit = 190 + i * 72;
    const desiredX = target.x + Math.sin(helicopter.phase) * orbit - (target.vx || 0) * 0.55;
    const desiredZ = target.z + Math.cos(helicopter.phase) * orbit - (target.vz || 0) * 0.55;
    helicopter.x = lerp(helicopter.x, desiredX, 1 - Math.exp(-dt * 1.15));
    helicopter.z = lerp(helicopter.z, desiredZ, 1 - Math.exp(-dt * 1.15));
    helicopter.y = 238 + Math.sin(helicopter.phase * 1.7) * 15;
    helicopter.angle = Math.atan2(-(target.x - helicopter.x), -(target.z - helicopter.z));
    helicopter.rotor.rotation.y += dt * 19;
    helicopter.tailRotor.rotation.x += dt * 24;
    helicopter.group.position.set(helicopter.x, helicopter.y, helicopter.z);
    helicopter.group.rotation.y = helicopter.angle;
    helicopter.searchLight.intensity = helicopter.hasVisual ? 4.2 : 1.25;
    helicopter.searchLight.target.position.set(target.x - helicopter.x, -helicopter.y, target.z - helicopter.z);
  }
}

function updatePoliceSight(dt) {
  policeState.sightCheckTimer -= dt;
  if (policeState.sightCheckTimer > 0) {
    policeState.lastSeenAgo += policeState.hasVisual ? 0 : dt;
    return;
  }
  policeState.sightCheckTimer = 0.16;
  const targets = playerChaseTargets();
  let seen = null;
  let source = "";
  for (const helicopter of policeHelicopters) helicopter.hasVisual = false;
  for (const target of targets) {
    for (const helicopter of policeHelicopters) {
      if (!policeHasSight(helicopter, target, true)) continue;
      helicopter.hasVisual = true;
      seen = target;
      source = "helicopter";
      break;
    }
    if (seen) break;
    for (const cop of cops) {
      if (cop.airborne || cop.wrecked || !policeHasSight(cop, target)) continue;
      seen = target;
      source = cop.kind === "swat" ? "SWAT" : cop.kind === "interceptor" ? "interceptor" : "patrol";
      break;
    }
    if (seen) break;
  }

  policeState.hasVisual = !!seen;
  if (seen) {
    policeState.visualSource = source;
    policeState.lastKnownX = seen.x;
    policeState.lastKnownZ = seen.z;
    policeState.lastKnownVx = seen.vx || 0;
    policeState.lastKnownVz = seen.vz || 0;
    policeState.lastKnownAngle = Number.isFinite(seen.angle) ? seen.angle : angleFromForward(seen.vx || 0, seen.vz || -1);
    policeState.lastSeenAgo = 0;
    policeState.unseenTimer = 0;
    policeState.decayTimer = 0;
  } else {
    policeState.lastSeenAgo += 0.16;
    policeState.unseenTimer += 0.16;
  }
}

function policeRoleTarget(cop, target, tier) {
  const forward = policeTargetForward(target);
  const right = { x: forward.z, z: -forward.x };
  if (!policeState.hasVisual) {
    const radius = cop.policeRole === POLICE_ROLES.SUPPORT ? 300 : 110 + Math.min(policeState.lastSeenAgo * 18, 320);
    const phase = policeState.searchPhase + cop.searchOffset;
    return {
      x: policeState.lastKnownX + Math.sin(phase) * radius,
      z: policeState.lastKnownZ + Math.cos(phase) * radius,
      task: cop.policeRole === POLICE_ROLES.SUPPORT ? POLICE_ROLES.SUPPORT : POLICE_ROLES.SEARCH,
    };
  }
  if (cop.policeRole === POLICE_ROLES.INTERCEPTOR) {
    const lead = 1.1 + tier.prediction;
    return { x: target.x + (target.vx || 0) * lead + right.x * cop.escapeSide * 95, z: target.z + (target.vz || 0) * lead + right.z * cop.escapeSide * 95, task: POLICE_ROLES.INTERCEPTOR };
  }
  if (cop.policeRole === POLICE_ROLES.SUPPORT) {
    return { x: target.x + forward.x * 250 + right.x * cop.escapeSide * 280, z: target.z + forward.z * 250 + right.z * cop.escapeSide * 280, task: POLICE_ROLES.SUPPORT };
  }
  if (cop.policeRole === POLICE_ROLES.ROADBLOCK) {
    if (!cop.roleTargetSet) {
      const point = roadPointNear(target.x + forward.x * 430, target.z + forward.z * 430, -forward.x, -forward.z);
      cop.roleTargetX = point.x;
      cop.roleTargetZ = point.z;
      cop.roleTargetSet = true;
    }
    return { x: cop.roleTargetX, z: cop.roleTargetZ, task: POLICE_ROLES.ROADBLOCK };
  }
  const lead = 0.18 + tier.prediction * 0.28;
  return { x: target.x + (target.vx || 0) * lead, z: target.z + (target.vz || 0) * lead, task: POLICE_ROLES.PURSUIT };
}

function updateCops(dt) {
  chaseTime += dt;
  backupTime += dt;
  policeState.searchPhase += dt * 0.62;
  if (chaseTime > POLICE_INITIAL_DISPATCH_DELAY && policeState.dispatchPending) {
    policeState.level = Math.max(MIN_WANTED_LEVEL, policeState.level);
    policeState.dispatchPending = false;
    policeState.lastKnownX = focusX();
    policeState.lastKnownZ = focusZ();
    policeState.lastKnownVx = gameMode === "driving" ? player.vx : 0;
    policeState.lastKnownVz = gameMode === "driving" ? player.vz : 0;
    policeState.lastKnownAngle = gameMode === "driving" ? player.angle : outsideState.angle;
    policeState.spawnTimer = WANTED_TIERS[1].spawnInterval;
    spawnCop(POLICE_ROLES.PURSUIT);
  }
  if (policeState.level <= 0) {
    while (policeHelicopters.length) removePoliceHelicopter(policeHelicopters.length - 1);
    while (policeRoadblocks.length) removePoliceRoadblock(policeRoadblocks.length - 1);
    for (let i = cops.length - 1; i >= 0; i--) {
      scene.remove(cops[i].group);
      cops.splice(i, 1);
    }
    return;
  }

  updatePoliceSight(dt);
  const tier = WANTED_TIERS[policeState.level];
  if (policeState.hasVisual) {
    policeState.escalationTimer += dt;
    if (policeState.escalationTimer >= tier.escalateAfter && policeState.level < 5) {
      policeState.level++;
      policeState.escalationTimer = 0;
      policeState.spawnTimer = WANTED_TIERS[policeState.level].spawnInterval * 0.35;
      showNotification(`${policeState.level} STAR RESPONSE ESCALATED`, true);
    }
  } else if (policeState.level > MIN_WANTED_LEVEL) {
    const nearestUnit = cops.reduce((best, cop) => Math.min(best, Math.hypot(cop.x - focusX(), cop.z - focusZ())), Infinity);
    if (nearestUnit > tier.escapeDistance && policeState.lastSeenAgo > 7) policeState.decayTimer += dt;
    else policeState.decayTimer = Math.max(0, policeState.decayTimer - dt * 0.65);
    if (policeState.decayTimer >= tier.loseDelay) {
      policeState.level = Math.max(MIN_WANTED_LEVEL, policeState.level - 1);
      policeState.decayTimer = 0;
      policeState.escalationTimer = 0;
      showNotification(`Wanted level reduced to ${policeState.level}`);
    }
  } else {
    policeState.decayTimer = 0;
  }

  const activeTier = WANTED_TIERS[policeState.level];
  policeState.spawnTimer += dt;
  if (policeState.level > 0 && policeState.spawnTimer >= activeTier.spawnInterval && cops.length < activeTier.maxUnits) {
    const spawned = spawnCop();
    policeState.spawnTimer = spawned ? 0 : activeTier.spawnInterval * 0.7;
  }
  policeState.roadblockTimer += dt;
  if (policeState.hasVisual && activeTier.roadblocks > 0 && policeRoadblocks.length < activeTier.roadblocks && policeState.roadblockTimer > Math.max(7, 15 - policeState.level * 1.5)) {
    policeState.roadblockTimer = 0;
    const roadblockSpawn = choosePoliceRoadSpawn(POLICE_ROLES.ROADBLOCK, activeTier, policeReferenceTarget());
    if (roadblockSpawn) createPoliceRoadblock(roadblockSpawn, policeState.level >= 4 ? 2 : 1, policeState.level >= 3);
  }
  policeState.helicopterTimer += dt;
  if (activeTier.helicopters > 0 && policeHelicopters.length < activeTier.helicopters && policeState.helicopterTimer > 7.5) {
    policeState.helicopterTimer = 0;
    spawnPoliceHelicopter();
    showNotification("POLICE HELICOPTER JOINED THE SEARCH", true);
  }
  updatePoliceHelicopters(dt);
  updatePoliceRoadblocks(dt);

  for (let i = cops.length - 1; i >= 0; i--) {
    const cop = cops[i];
    const targetPlayer = policeState.hasVisual ? nearestChaseTarget(cop).target : policeReferenceTarget();
    const roleTarget = policeRoleTarget(cop, targetPlayer, activeTier);
    cop.currentTask = roleTarget.task;
    const distanceToPlayer = Math.hypot(cop.x - targetPlayer.x, cop.z - targetPlayer.z);
    const farFromAllPlayers = playerChaseTargets().every((target) => dist(cop, target) > COP_DESPAWN_DISTANCE);
    if (farFromAllPlayers || (cops.length > activeTier.maxUnits && i >= activeTier.maxUnits)) {
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

    const targetX = roleTarget.x;
    const targetZ = roleTarget.z;
    const desired = Math.atan2(-(targetX - cop.x), -(targetZ - cop.z));
    const roleDistance = Math.hypot(targetX - cop.x, targetZ - cop.z);
    const close = roleDistance < 58;
    const angleError = Math.abs(angleDelta(cop.angle, desired));
    let steering = clamp(angleDelta(cop.angle, desired) * (cop.personality === "calm" ? 1.65 : 2.45), -1, 1);
    let throttle = close ? 0.68 : angleError > 1.35 ? 0.45 : 1;
    if (cop.policeRole === POLICE_ROLES.ROADBLOCK && roleDistance < 72) {
      cop.deployed = true;
      throttle = 0;
      steering = 0;
      cop.vx *= Math.pow(0.72, dt * 60);
      cop.vz *= Math.pow(0.72, dt * 60);
    }
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
        const towardPlayer = { x: roleTarget.x, z: roleTarget.z };
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
    const boost = cop.kind === "interceptor" ? 1.55 : cop.kind === "swat" ? 0.98 : cop.personality === "aggressive" ? 1.28 : cop.personality === "calm" ? 1.05 : 1.12;
    const responseSpeed = 1 + policeState.level * 0.025;
    driveVehicle(cop, { steer: steering, throttle }, dt, {
      accel: 150 * boost * (1 + policeState.level * 0.04),
      brake: 300 * boost,
      reverseAccel: 55,
      maxSpeed: 282 * boost * responseSpeed,
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
  const aMass = a === player ? 1.12 : isPoliceVehicle(a) ? (a.kind === "swat" ? 1.38 : 1.08) : (a.mass || 1);
  const bMass = b === player ? 1.12 : isPoliceVehicle(b) ? (b.kind === "swat" ? 1.38 : 1.08) : (b.mass || 1);
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
    beginEscapeManeuver(a, aBlocker, isPoliceVehicle(a) ? 2.4 : 3.1);
    if (Math.random() < 0.45) beginEscapeManeuver(b, bBlocker, isPoliceVehicle(b) ? 2.2 : 2.9);
  }
  if (a === player && !isPoliceVehicle(b) && impactSpeed < 55) beginEscapeManeuver(b, { other: a, ahead: 34, side: 1 }, 3.2);
  if (b === player && !isPoliceVehicle(a) && impactSpeed < 55) beginEscapeManeuver(a, { other: b, ahead: 34, side: -1 }, 3.2);
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
  if (impactSpeed > 32) playCrashSound(impactSpeed * 0.72);
  if (impactSpeed > 105 && (a === player || b === player)) {
    const other = a === player ? b : a;
    const dirX = other === b ? -nx : nx;
    const dirZ = other === b ? -nz : nz;
    if (other.kind !== "player") {
      if (isPoliceVehicle(other)) {
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
  if (!running || gameOver) return 0;
  return clamp(Math.max(MIN_WANTED_LEVEL, policeState.level), MIN_WANTED_LEVEL, 5);
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

function policeHudStatus() {
  if (policeState.level <= 0) return "";
  const status = policeState.hasVisual
    ? policeState.visualSource === "helicopter" ? "HELICOPTER VISUAL" : "SPOTTED"
    : policeState.level <= MIN_WANTED_LEVEL
      ? "SEARCHING"
      : `SEARCHING ${Math.max(0, Math.ceil(WANTED_TIERS[policeState.level].loseDelay - policeState.decayTimer))}s`;
  return ` | ${status} | ${cops.length} units`;
}

function updateCollisions(dt, fullWorldCollisions = true) {
  if (fullWorldCollisions) {
    const vehicles = gameMode === "walking" ? [...cops, ...traffic] : [player, ...cops, ...traffic];
    for (let i = 0; i < vehicles.length; i++) {
      for (let j = i + 1; j < vehicles.length; j++) {
        collideVehicles(vehicles[i], vehicles[j]);
      }
    }
  } else if (gameMode !== "walking") {
    for (const cop of cops) collideVehicles(player, cop);
    for (const car of traffic) collideVehicles(player, car);
  }
  if (gameMode !== "walking") collideRemotePlayers();
  collidePoliceRoadblocks(dt);

  let arrestPressure = 0;
  for (const cop of cops) {
    if (cop.airborne || cop.wrecked) continue;
    const d = gameMode === "walking"
      ? Math.hypot(outsideState.x - cop.x, outsideState.z - cop.z)
      : dist(player, cop);
    const contact = gameMode !== "walking" && d < player.radius + cop.radius + 10;
    const inArrestZone = d < COP_ARREST_RADIUS;
    const boxedIn = gameMode !== "walking" && d < 55 && vehicleSpeed(player) < 78;
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

function updateOutsideCamera(dt) {
  const forwardX = -Math.sin(outsideState.angle);
  const forwardZ = -Math.cos(outsideState.angle);
  const desired = new THREE.Vector3(
    outsideState.x - forwardX * 138,
    88,
    outsideState.z - forwardZ * 138
  );
  const target = new THREE.Vector3(
    outsideState.x + forwardX * 34,
    15,
    outsideState.z + forwardZ * 34
  );
  cameraState.position.lerp(desired, 1 - Math.exp(-dt * 5.5));
  cameraState.target.lerp(target, 1 - Math.exp(-dt * 7));
  camera.position.copy(cameraState.position);
  camera.lookAt(cameraState.target);
  camera.fov = lerp(camera.fov, 58, 1 - Math.exp(-dt * 4));
  camera.updateProjectionMatrix();
  sun.position.set(outsideState.x - 260, 520, outsideState.z + 180);
  sun.target.position.set(outsideState.x, 0, outsideState.z);
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

  const centerX = focusX();
  const centerZ = focusZ();
  const mx = (x) => w / 2 + (x - centerX) * scale;
  const mz = (z) => h / 2 + (z - centerZ) * scale;

  c.strokeStyle = "#383832";
  c.lineWidth = ROAD * scale;
  c.lineCap = "round";
  c.lineJoin = "round";

  const minX = centerX - 520;
  const maxX = centerX + 520;
  const minZ = centerZ - 520;
  const maxZ = centerZ + 520;
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
  c.fillStyle = "#f2eee3";
  for (const roadblock of policeRoadblocks) c.fillRect(mx(roadblock.x) - 5, mz(roadblock.z) - 2, 10, 4);
  c.fillStyle = "#79b8ff";
  for (const helicopter of policeHelicopters) {
    c.beginPath();
    c.arc(mx(helicopter.x), mz(helicopter.z), 5, 0, Math.PI * 2);
    c.strokeStyle = "#79b8ff";
    c.lineWidth = 2;
    c.stroke();
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
  if (hot) playTone(880, 0.055, "triangle", 0.025);
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

function updateCharacterPreview() {
  const style = sanitizeCharacterStyle(characterStyle);
  const shirtLight = shadeHex(style.shirt, 0.12);
  const previewTargets = [
    previewHeadEl,
    previewLeftArmEl,
    previewRightArmEl,
    previewHairEl,
    previewTorsoEl,
    previewLeftLegEl,
    previewRightLegEl,
  ];
  for (const el of previewTargets) {
    if (!el) continue;
    el.style.setProperty("--skin", style.skin);
    el.style.setProperty("--hair", style.hair);
    el.style.setProperty("--shirt", style.shirt);
    el.style.setProperty("--shirtLight", shirtLight);
    el.style.setProperty("--pants", style.pants);
  }
  document.querySelectorAll(".swatch-button").forEach((button) => {
    button.classList.toggle("active", characterStyle[button.dataset.part] === button.dataset.color);
  });
}

function buildCharacterCustomisation() {
  document.querySelectorAll(".customize-row").forEach((row) => {
    const part = row.dataset.part;
    const swatches = row.querySelector(".swatches");
    if (!part || !swatches || !CHARACTER_PALETTES[part]) return;
    swatches.textContent = "";
    CHARACTER_PALETTES[part].forEach((color) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "swatch-button";
      button.dataset.part = part;
      button.dataset.color = color;
      button.style.setProperty("--swatch", color);
      button.setAttribute("aria-label", `${part} ${color}`);
      button.addEventListener("click", () => {
        characterStyle = sanitizeCharacterStyle({ ...characterStyle, [part]: color });
        updateCharacterPreview();
        playUiClick();
      });
      swatches.appendChild(button);
    });
  });
  updateCharacterPreview();
}

function openCharacterCustomisation() {
  playConfirmSound();
  characterStyle = sanitizeCharacterStyle(characterStyle);
  updateCharacterPreview();
  menuEl.classList.add("hidden");
  customizeScreenEl.classList.remove("hidden");
  setMenuStatus("");
}

function closeCharacterCustomisation(save = false) {
  if (save) {
    saveCharacterStyle();
    showNotification("Character saved");
    playPurchaseSound();
  } else {
    playUiClick();
  }
  customizeScreenEl.classList.add("hidden");
  menuEl.classList.remove("hidden");
}

function submitPlayerName() {
  playerName = cleanPlayerName(playerNameInput.value);
  playerColor = colorForName(playerName);
  localStorage.setItem("policeGetawayName", playerName);
  playConfirmSound();
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
  if (remote.outsideCharacter && remote.outsideCharacter.parent) remote.outsideCharacter.parent.remove(remote.outsideCharacter);
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
    characterStyle: sanitizeCharacterStyle(characterStyle),
    x: player.x,
    z: player.z,
    y: player.y || 0,
    vx: player.vx,
    vz: player.vz,
    angle: player.angle,
    gameMode,
    outsideX: outsideState.x,
    outsideZ: outsideState.z,
    outsideAngle: outsideState.angle,
    storeX: storeState.x,
    storeY: storeState.y,
    storeZ: storeState.z,
    storeAngle: storeState.angle,
    storePitch: storeState.pitch,
    storeCameraMode: storeState.cameraMode,
    storePunchCharge: storeState.punchCharge,
    storePunchCharging: storeState.punchCharging,
    storePunchTimer: storeState.punchTimer,
    storeHasMegaforce: storeState.hasMegaforce,
    storeDrinking: storeState.drinking,
    storeDrinkProgress: storeState.drinkProgress,
    storeDrinkTimer: storeState.drinkTimer,
    storeDrinkDuration: storeState.drinkDuration,
    storeHp: storeState.hp,
    storeDead: storeState.dead,
    storeDeathY: storeState.deathY,
    storeDeathRoll: storeState.deathRoll,
    storeDeathPitch: storeState.deathPitch,
    storeDeathTimer: storeState.deathTimer,
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
    policeRole: v.policeRole || "",
    currentTask: v.currentTask || "",
    roleTargetX: v.roleTargetX || 0,
    roleTargetZ: v.roleTargetZ || 0,
    roleTargetSet: !!v.roleTargetSet,
    deployed: !!v.deployed,
    paintColor: v.paintColor || null,
    trafficClass: v.trafficClass || null,
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
    police: { ...policeState },
    cops: cops.map(vehicleNetworkState),
    helicopters: policeHelicopters.map((helicopter) => ({
      x: helicopter.x,
      z: helicopter.z,
      y: helicopter.y,
      angle: helicopter.angle,
      phase: helicopter.phase,
      hasVisual: helicopter.hasVisual,
    })),
    roadblocks: policeRoadblocks.map((roadblock) => ({
      x: roadblock.x,
      z: roadblock.z,
      angle: roadblock.angle,
      life: roadblock.life,
      strength: roadblock.strength,
      hasSpikes: roadblock.hasSpikes,
    })),
    traffic: traffic.map(vehicleNetworkState),
    storeVendor: storeState.vendor ? {
      hp: storeState.vendorHp,
      dead: storeState.vendorDead,
      respawnTimer: storeState.vendorRespawnTimer,
      x: storeState.vendor.position.x,
      y: storeState.vendor.position.y,
      z: storeState.vendor.position.z,
      rotationX: storeState.vendor.rotation.x,
      rotationY: storeState.vendor.rotation.y,
      rotationZ: storeState.vendor.rotation.z,
      rightArmRotationX: storeState.vendor.userData.rightArm?.rotation.x || 0,
      rightArmRotationZ: storeState.vendor.userData.rightArm?.rotation.z || 0,
      leftArmRotationX: storeState.vendor.userData.leftArm?.rotation.x || 0,
      leftArmRotationZ: storeState.vendor.userData.leftArm?.rotation.z || 0,
      leftLegRotationX: storeState.vendor.userData.leftLeg?.rotation.x || 0,
      rightLegRotationX: storeState.vendor.userData.rightLeg?.rotation.x || 0,
      headRotationZ: storeState.vendor.userData.head?.rotation.z || 0,
      deathTimer: storeState.vendorDeathTimer,
      knifeVisible: !!storeState.vendorKnife?.visible,
      aggroPeerId: storeState.vendorAggroPeerId,
      aggroTimer: storeState.vendorAggroTimer,
      attackCooldown: storeState.vendorAttackCooldown,
      attackTimer: storeState.vendorAttackTimer,
    } : null,
  };
}

function applyRemoteState(peerId, state) {
  if (!peerId || peerId === multiplayer.peerId || !state) return;
  const remoteName = state.name || "Driver";
  const remoteColor = state.color || colorForName(`${remoteName}-${peerId}`);
  const remoteCharacterStyle = sanitizeCharacterStyle(state.characterStyle || {});
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
    y: Number.isFinite(state.storeY) ? state.storeY : 0,
    z: Number.isFinite(state.storeZ) ? state.storeZ : 220,
    angle: Number.isFinite(state.storeAngle) ? state.storeAngle : Math.PI,
    pitch: Number.isFinite(state.storePitch) ? state.storePitch : 0,
    cameraMode: state.storeCameraMode || "third",
    punchCharge: Number.isFinite(state.storePunchCharge) ? state.storePunchCharge : 0,
    punchCharging: !!state.storePunchCharging,
    punchTimer: Number.isFinite(state.storePunchTimer) ? state.storePunchTimer : 0,
    hasMegaforce: !!state.storeHasMegaforce,
    drinking: !!state.storeDrinking,
    drinkProgress: Number.isFinite(state.storeDrinkProgress) ? state.storeDrinkProgress : 0,
    drinkTimer: Number.isFinite(state.storeDrinkTimer) ? state.storeDrinkTimer : 0,
    drinkDuration: Number.isFinite(state.storeDrinkDuration) ? state.storeDrinkDuration : 0,
    hp: Number.isFinite(state.storeHp) ? state.storeHp : PLAYER_MAX_HP,
    dead: !!state.storeDead,
    deathY: Number.isFinite(state.storeDeathY) ? state.storeDeathY : 0,
    deathRoll: Number.isFinite(state.storeDeathRoll) ? state.storeDeathRoll : 0,
    deathPitch: Number.isFinite(state.storeDeathPitch) ? state.storeDeathPitch : 0,
    deathTimer: Number.isFinite(state.storeDeathTimer) ? state.storeDeathTimer : 0,
  };
  remote.outsideTarget = {
    gameMode: state.gameMode || "driving",
    x: Number.isFinite(state.outsideX) ? state.outsideX : state.x || 0,
    z: Number.isFinite(state.outsideZ) ? state.outsideZ : state.z || 48,
    angle: Number.isFinite(state.outsideAngle) ? state.outsideAngle : state.angle || 0,
  };
  if (!remote.storeCharacter && storeState.group) {
    remote.storeCharacter = makePerson(remoteCharacterStyle);
    remote.storeCharacter.scale.setScalar(1.14);
    remote.storeCharacter.position.set(remote.storeTarget.x, 0, remote.storeTarget.z);
    remote.storeCharacter.rotation.y = remote.storeTarget.angle;
    remote.storeCharacter.visible = false;
    storeState.group.add(remote.storeCharacter);
  } else if (remote.storeCharacter && JSON.stringify(remote.storeCharacter.userData.characterStyle || {}) !== JSON.stringify(remoteCharacterStyle)) {
    applyCharacterStyleToPerson(remote.storeCharacter, remoteCharacterStyle);
  }
  setStoreNameTag(remote);
  if (!remote.outsideCharacter) {
    remote.outsideCharacter = makePerson(remoteCharacterStyle);
    remote.outsideCharacter.scale.setScalar(OUTSIDE_CHARACTER_SCALE);
    remote.outsideCharacter.position.set(remote.outsideTarget.x, 0, remote.outsideTarget.z);
    remote.outsideCharacter.rotation.y = remote.outsideTarget.angle;
    remote.outsideCharacter.visible = false;
    const outsideTag = new THREE.Sprite(new THREE.SpriteMaterial({
      map: makeNameTagTexture(remote.playerName, remoteColor),
      transparent: true,
      depthTest: false,
    }));
    outsideTag.position.set(0, 82, 0);
    outsideTag.scale.set(78, 20, 1);
    outsideTag.renderOrder = 35;
    remote.outsideCharacter.add(outsideTag);
    remote.outsideNameTag = outsideTag;
    scene.add(remote.outsideCharacter);
  } else if (JSON.stringify(remote.outsideCharacter.userData.characterStyle || {}) !== JSON.stringify(remoteCharacterStyle)) {
    applyCharacterStyleToPerson(remote.outsideCharacter, remoteCharacterStyle);
  }
  remote.lastSeen = performance.now();
}

function applyVehicleNetworkState(v, state, snap = false) {
  v.kind = state.kind || v.kind;
  v.trafficClass = state.trafficClass || v.trafficClass;
  v.trafficTune = TRAFFIC_ARCHETYPE_BY_ID[v.trafficClass] || v.trafficTune;
  v.remoteTarget = { ...state };
  v.vx = state.vx || 0;
  v.vz = state.vz || 0;
  v.vy = state.vy || 0;
  v.roadAxis = state.roadAxis || v.roadAxis;
  v.roadId = state.roadId ?? v.roadId;
  v.dir = state.dir ?? v.dir;
  v.timer = state.timer || 0;
  v.personality = state.personality || v.personality;
  v.policeRole = state.policeRole || v.policeRole;
  v.currentTask = state.currentTask || v.currentTask;
  v.roleTargetX = Number.isFinite(state.roleTargetX) ? state.roleTargetX : v.roleTargetX;
  v.roleTargetZ = Number.isFinite(state.roleTargetZ) ? state.roleTargetZ : v.roleTargetZ;
  v.roleTargetSet = !!state.roleTargetSet;
  v.deployed = !!state.deployed;
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
    if (!list[i] || list[i].kind !== state.kind || list[i].paintColor !== (state.paintColor || null) || list[i].trafficClass !== (state.trafficClass || null)) {
      if (list[i]) scene.remove(list[i].group);
      list[i] = makeVehicle(state.kind || "normal", state.x || 0, state.z || 48, state.angle || 0, state.paintColor || null, state.trafficClass || null);
      scene.add(list[i].group);
      applyVehicleNetworkState(list[i], state, true);
    } else {
      applyVehicleNetworkState(list[i], state);
    }
  }
}

function syncNetworkHelicopters(states) {
  while (policeHelicopters.length > states.length) removePoliceHelicopter(policeHelicopters.length - 1);
  for (let i = 0; i < states.length; i++) {
    if (!policeHelicopters[i]) policeHelicopters.push(makePoliceHelicopter(states[i].x || 0, states[i].z || 0));
    policeHelicopters[i].remoteTarget = { ...states[i] };
    policeHelicopters[i].hasVisual = !!states[i].hasVisual;
    if (!Number.isFinite(policeHelicopters[i].y)) policeHelicopters[i].y = states[i].y || 250;
  }
}

function syncNetworkRoadblocks(states) {
  while (policeRoadblocks.length > states.length) removePoliceRoadblock(policeRoadblocks.length - 1);
  for (let i = 0; i < states.length; i++) {
    const state = states[i];
    const current = policeRoadblocks[i];
    const needsReplacement = !current || current.hasSpikes !== !!state.hasSpikes || current.strength !== (state.strength || 1);
    if (needsReplacement) {
      if (current) removePoliceRoadblock(i);
      const created = createPoliceRoadblock(state, state.strength || 1, !!state.hasSpikes);
      if (policeRoadblocks[policeRoadblocks.length - 1] === created && i !== policeRoadblocks.length - 1) {
        policeRoadblocks.pop();
        policeRoadblocks.splice(i, 0, created);
      }
    }
    const roadblock = policeRoadblocks[i];
    roadblock.x = state.x || 0;
    roadblock.z = state.z || 0;
    roadblock.angle = state.angle || 0;
    roadblock.life = Number.isFinite(state.life) ? state.life : roadblock.life;
    roadblock.group.position.set(roadblock.x, 0, roadblock.z);
    roadblock.group.rotation.y = roadblock.angle;
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
  if (Number.isFinite(state.chaseTime)) chaseTime = state.chaseTime;
  if (Number.isFinite(state.backupTime)) backupTime = state.backupTime;
  if (Number.isFinite(state.idleHeat)) idleHeat = state.idleHeat;
  if (state.police) {
    for (const key of Object.keys(policeState)) {
      if (typeof policeState[key] === "boolean") policeState[key] = !!state.police[key];
      else if (typeof policeState[key] === "number" && Number.isFinite(state.police[key])) policeState[key] = state.police[key];
      else if (typeof policeState[key] === "string" && typeof state.police[key] === "string") policeState[key] = state.police[key];
    }
  }
  syncNetworkVehicleList(cops, Array.isArray(state.cops) ? state.cops : []);
  syncNetworkVehicleList(traffic, Array.isArray(state.traffic) ? state.traffic : []);
  syncNetworkHelicopters(Array.isArray(state.helicopters) ? state.helicopters : []);
  syncNetworkRoadblocks(Array.isArray(state.roadblocks) ? state.roadblocks : []);
  const vendor = state.storeVendor;
  if (vendor && storeState.vendor) {
    const vendorJustDied = !storeState.vendorDead && !!vendor.dead;
    storeState.vendorHp = Number.isFinite(vendor.hp) ? vendor.hp : VENDOR_MAX_HP;
    storeState.vendorDead = !!vendor.dead;
    storeState.vendorRespawnTimer = Number.isFinite(vendor.respawnTimer) ? vendor.respawnTimer : 0;
    storeState.vendor.position.set(
      Number.isFinite(vendor.x) ? vendor.x : 6004,
      Number.isFinite(vendor.y) ? vendor.y : 0,
      Number.isFinite(vendor.z) ? vendor.z : -274
    );
    storeState.vendor.rotation.set(vendor.rotationX || 0, vendor.rotationY || 0, vendor.rotationZ || 0);
    if (storeState.vendor.userData.rightArm) storeState.vendor.userData.rightArm.rotation.x = vendor.rightArmRotationX || 0;
    if (storeState.vendor.userData.rightArm) storeState.vendor.userData.rightArm.rotation.z = vendor.rightArmRotationZ || 0;
    if (storeState.vendor.userData.leftArm) storeState.vendor.userData.leftArm.rotation.x = vendor.leftArmRotationX || 0;
    if (storeState.vendor.userData.leftArm) storeState.vendor.userData.leftArm.rotation.z = vendor.leftArmRotationZ || 0;
    if (storeState.vendor.userData.leftLeg) storeState.vendor.userData.leftLeg.rotation.x = vendor.leftLegRotationX || 0;
    if (storeState.vendor.userData.rightLeg) storeState.vendor.userData.rightLeg.rotation.x = vendor.rightLegRotationX || 0;
    if (storeState.vendor.userData.head) storeState.vendor.userData.head.rotation.z = vendor.headRotationZ || 0;
    storeState.vendorDeathTimer = Number.isFinite(vendor.deathTimer) ? vendor.deathTimer : 0;
    if (storeState.vendorKnife) storeState.vendorKnife.visible = !!vendor.knifeVisible && !storeState.vendorDead;
    storeState.vendorAggroPeerId = typeof vendor.aggroPeerId === "string" ? vendor.aggroPeerId : "";
    storeState.vendorAggroTimer = Number.isFinite(vendor.aggroTimer) ? vendor.aggroTimer : 0;
    storeState.vendorAttackCooldown = Number.isFinite(vendor.attackCooldown) ? vendor.attackCooldown : 0;
    storeState.vendorAttackTimer = Number.isFinite(vendor.attackTimer) ? vendor.attackTimer : 0;
    storeState.vendor.visible = true;
    updateVendorNameTag();
    if (vendorJustDied && gameMode === "store") {
      createStoreImpactFx(storeState.vendor.position.x, storeState.vendor.position.z, 0x27e86a, 1.25);
      storeState.damageShake = Math.max(storeState.damageShake, 3.8);
    }
  }
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
  for (const helicopter of policeHelicopters) {
    const target = helicopter.remoteTarget;
    if (!target) continue;
    helicopter.x = lerp(helicopter.x, target.x || 0, follow);
    helicopter.z = lerp(helicopter.z, target.z || 0, follow);
    helicopter.y = lerp(helicopter.y || 250, target.y || 250, follow);
    helicopter.angle += angleDelta(helicopter.angle || 0, target.angle || 0) * follow;
    helicopter.rotor.rotation.y += dt * 19;
    helicopter.tailRotor.rotation.x += dt * 24;
    helicopter.group.position.set(helicopter.x, helicopter.y, helicopter.z);
    helicopter.group.rotation.y = helicopter.angle;
    helicopter.searchLight.intensity = helicopter.hasVisual ? 4.2 : 1.25;
  }
}

function animateRemoteOutsideCharacter(remote, dt, moving) {
  const character = remote.outsideCharacter;
  if (!character?.userData?.head) return;
  remote.outsideWalkCycle = moving
    ? (remote.outsideWalkCycle || 0) + dt * 8.3
    : lerp(remote.outsideWalkCycle || 0, Math.round((remote.outsideWalkCycle || 0) / Math.PI) * Math.PI, 1 - Math.exp(-dt * 5));
  const swing = moving ? Math.sin(remote.outsideWalkCycle) * 0.86 : 0;
  const bob = moving ? Math.abs(Math.sin(remote.outsideWalkCycle)) * 1.7 : 0;
  const ease = 1 - Math.exp(-dt * 12);
  character.position.y = lerp(character.position.y, bob, ease);
  character.userData.leftArm.rotation.x = lerp(character.userData.leftArm.rotation.x, swing, ease);
  character.userData.rightArm.rotation.x = lerp(character.userData.rightArm.rotation.x, -swing, ease);
  character.userData.leftLeg.rotation.x = lerp(character.userData.leftLeg.rotation.x, -swing * 0.9, ease);
  character.userData.rightLeg.rotation.x = lerp(character.userData.rightLeg.rotation.x, swing * 0.9, ease);
  character.userData.head.rotation.z = lerp(character.userData.head.rotation.z, moving ? Math.sin(remote.outsideWalkCycle * 2) * 0.04 : 0, ease);
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

    if (remote.outsideCharacter) {
      const outsideTarget = remote.outsideTarget || {};
      const visibleOutside = gameMode !== "store" && outsideTarget.gameMode === "walking";
      remote.outsideCharacter.visible = visibleOutside;
      if (visibleOutside) {
        const previousX = remote.outsideCharacter.position.x;
        const previousZ = remote.outsideCharacter.position.z;
        remote.outsideCharacter.position.x = lerp(previousX, outsideTarget.x || 0, follow);
        remote.outsideCharacter.position.z = lerp(previousZ, outsideTarget.z || 0, follow);
        remote.outsideCharacter.rotation.y += angleDelta(remote.outsideCharacter.rotation.y, outsideTarget.angle || 0) * follow;
        animateRemoteOutsideCharacter(
          remote,
          dt,
          Math.hypot(remote.outsideCharacter.position.x - previousX, remote.outsideCharacter.position.z - previousZ) > 0.12
        );
      }
    }

    if (remote.storeCharacter) {
      const storeTarget = remote.storeTarget || {};
      const visibleInStore = gameMode === "store" && storeTarget.gameMode === "store";
      remote.storeCharacter.visible = visibleInStore;
      if (remote.storeNameTag) remote.storeNameTag.visible = visibleInStore && !storeTarget.dead;
      if (visibleInStore) {
        const previousStoreX = remote.storeCharacter.position.x;
        const previousStoreZ = remote.storeCharacter.position.z;
        remote.storeCharacter.position.x = lerp(remote.storeCharacter.position.x, storeTarget.x || 6000, follow);
        remote.storeCharacter.position.y = lerp(remote.storeCharacter.position.y, storeTarget.dead ? storeTarget.deathY || 0 : storeTarget.y || 0, follow);
        remote.storeCharacter.position.z = lerp(remote.storeCharacter.position.z, storeTarget.z || 220, follow);
        if (storeTarget.dead) {
          remote.storeCharacter.rotation.x = lerp(remote.storeCharacter.rotation.x, storeTarget.deathPitch || Math.PI * 0.5, follow);
          remote.storeCharacter.rotation.y += angleDelta(remote.storeCharacter.rotation.y, storeTarget.angle || Math.PI) * follow;
          remote.storeCharacter.rotation.z = lerp(remote.storeCharacter.rotation.z, storeTarget.deathRoll || 0, follow);
          const flail = Math.exp(-(storeTarget.deathTimer || 0) * 1.8);
          remote.storeCharacter.userData.leftArm.rotation.set(-1.45 * flail, 0, -1.1 * flail);
          remote.storeCharacter.userData.rightArm.rotation.set(1.18 * flail, 0, 1.28 * flail);
          remote.storeCharacter.userData.leftLeg.rotation.x = 0.82 * flail;
          remote.storeCharacter.userData.rightLeg.rotation.x = -0.72 * flail;
          remote.storeCharacter.userData.head.rotation.z = Math.sin((storeTarget.deathTimer || 0) * 12) * 0.32 * flail;
        } else {
          remote.storeCharacter.rotation.x = lerp(remote.storeCharacter.rotation.x, 0, follow);
          remote.storeCharacter.rotation.y += angleDelta(remote.storeCharacter.rotation.y, storeTarget.angle || Math.PI) * follow;
          remote.storeCharacter.rotation.z = lerp(remote.storeCharacter.rotation.z, 0, follow);
          animateRemoteStoreCharacter(
            remote,
            dt,
            Math.hypot(remote.storeCharacter.position.x - previousStoreX, remote.storeCharacter.position.z - previousStoreZ) > 0.2
          );
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
    if (message.event === "vendor-knife" && message.targetPeerId === multiplayer.peerId && gameMode === "store") {
      applyStoreDamage(VENDOR_KNIFE_DAMAGE, VENDOR_NAME, message);
    }
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
  playConfirmSound();
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
    playUiError();
    setMenuStatus(publicServer ? "Public server failed. Try again." : "Multiplayer failed. Try again or use Singleplayer.");
    setMultiplayerStatus("Network error");
    updateGameCodeHud();
  });
}

function createGame() {
  if (!peerLibraryReady()) {
    playUiError();
    setMenuStatus("Multiplayer needs internet access. PeerJS did not load.");
    return;
  }
  playConfirmSound();
  stopMultiplayer();
  multiplayer.mode = "host";
  startHostPeer(0, { publicServer: false });
}

function showJoinGame() {
  playConfirmSound();
  joinForm.classList.remove("hidden");
  setMenuStatus("Enter the 6 digit game code.");
  joinCodeInput.value = "";
  joinCodeInput.focus();
}

function joinGame(code, options = {}) {
  const publicServer = !!options.publicServer;
  const cleanCode = publicServer ? PUBLIC_SERVER_CODE : String(code || "").replace(/\D/g, "").slice(0, 6);
  if (!publicServer && cleanCode.length !== 6) {
    playUiError();
    setMenuStatus("Game code must be 6 numbers.");
    return;
  }
  if (!peerLibraryReady()) {
    playUiError();
    setMenuStatus("Multiplayer needs internet access. PeerJS did not load.");
    return;
  }
  playConfirmSound();

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
          playUiError();
          setMenuStatus("Could not join. Check the code and that host is still in game.");
          setMultiplayerStatus("No host found");
          updateGameCodeHud();
        }
      }
    }, 6000);
  });
  peer.on("error", () => {
    playUiError();
    setMenuStatus(publicServer ? "Could not join public server. Try again." : "Could not connect to multiplayer. Try again.");
    setMultiplayerStatus("Network error");
    updateGameCodeHud();
  });
}

function joinPublicServer() {
  if (!peerLibraryReady()) {
    playUiError();
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
  playConfirmSound();
  inputState.device = device;
  inputState.mobile = device === "phone";
  deviceChoiceEl.classList.add("hidden");
  menuEl.classList.remove("hidden");
  mobileControlsEl.classList.add("hidden");
  mobileJumpButton.classList.add("hidden");
  resetJoystick();
  hintEl.textContent = inputState.mobile ? "Joystick: up/down drive, left/right turn" : "W/S drive, A/D turn";
}

function resetJoystick() {
  inputState.steer = 0;
  inputState.throttle = 0;
  inputState.joystickPointerId = null;
  inputState.lookPointerId = null;
  joystickStickEl.style.transform = "translate(-50%, -50%)";
}

function updateMobileControlLayout() {
  const active = inputState.mobile && running && !gameOver;
  mobileControlsEl.classList.toggle("hidden", !active);
  if (!active) return;

  if (mobileControlsEl.dataset.mode !== gameMode) mobileControlsEl.dataset.mode = gameMode;
  mobileActionButton.classList.toggle("hidden", !["driving", "walking", "store"].includes(gameMode));
  mobileJumpButton.classList.toggle("hidden", gameMode !== "store" || storeState.dead);
  mobilePunchButton.classList.toggle("hidden", gameMode !== "store" || storeState.dead);
  mobileUseButton.classList.toggle("hidden", gameMode !== "store" || storeState.dead || storeState.purchaseTimer > 0);

  if (gameMode === "driving") {
    if (mobileActionButton.textContent !== "EXIT") mobileActionButton.textContent = "EXIT";
  } else if (gameMode === "walking") {
    const ownCarClose = Math.hypot(player.x - outsideState.x, player.z - outsideState.z) < 62;
    const label = ownCarClose ? "ENTER" : findCarjackTarget() ? "JACK" : "ACTION";
    if (mobileActionButton.textContent !== label) mobileActionButton.textContent = label;
  } else {
    if (mobileActionButton.textContent !== "CAM") mobileActionButton.textContent = "CAM";
  }
  const useLabel = storeState.hasMegaforce ? "DRINK" : "BUY";
  if (mobileUseButton.textContent !== useLabel) mobileUseButton.textContent = useLabel;
  if (purchasePromptKeyEl) purchasePromptKeyEl.textContent = inputState.mobile ? "USE" : "E";
}

function updateJoystickFromPointer(event) {
  const rect = joystickEl.getBoundingClientRect();
  const centerX = rect.left + rect.width * 0.5;
  const centerY = rect.top + rect.height * 0.5;
  const maxRadius = rect.width * 0.35;
  const dx = event.clientX - centerX;
  const dy = event.clientY - centerY;
  const distance = Math.hypot(dx, dy);
  const limited = distance > maxRadius ? maxRadius / distance : 1;
  const stickX = dx * limited;
  const stickY = dy * limited;
  const nx = clamp(stickX / maxRadius, -1, 1);
  const ny = clamp(stickY / maxRadius, -1, 1);
  const steerDeadzone = gameMode === "driving" ? 0.2 : 0.14;
  const throttleDeadzone = 0.12;
  const steerAmount = Math.abs(nx) <= steerDeadzone
    ? 0
    : Math.pow((Math.abs(nx) - steerDeadzone) / (1 - steerDeadzone), gameMode === "driving" ? 1.85 : 1.45) * Math.sign(nx);
  const throttleAmount = Math.abs(ny) <= throttleDeadzone
    ? 0
    : ((Math.abs(ny) - throttleDeadzone) / (1 - throttleDeadzone)) * Math.sign(ny);

  const steeringScale = gameMode === "driving" ? 0.64 : gameMode === "store" ? 0.76 : 0.9;
  inputState.steer = -steerAmount * steeringScale;
  inputState.throttle = clamp(-Math.sign(throttleAmount) * Math.pow(Math.abs(throttleAmount), 1.08), -1, 1);
  joystickStickEl.style.transform = `translate(calc(-50% + ${stickX}px), calc(-50% + ${stickY}px))`;
}

function resetGame() {
  if (document.pointerLockElement === canvas) document.exitPointerLock();
  resetJoystick();
  gameMode = "driving";
  transitionLock = false;
  setTransition(false);
  world.visible = true;
  player.group.visible = true;
  if (outsideState.character) outsideState.character.visible = false;
  outsideState.carjackTarget = null;
  outsideState.carjackTimer = 0;
  minimapEl.classList.remove("hidden");
  mobileJumpButton.classList.add("hidden");
  if (storeState.group) storeState.group.visible = false;
  resetVendorAtCheckout();
  storeState.hp = PLAYER_MAX_HP;
  storeState.dead = false;
  storeState.deathY = 0;
  storeState.deathTimer = 0;
  storeState.deathLanded = false;
  storeState.deathAttacker = "";
  storeState.y = 0;
  storeState.vy = 0;
  storeState.grounded = true;
  storeState.cameraMode = "first";
  storeState.cameraYaw = storeState.angle;
  storeState.hasMegaforce = false;
  storeState.drinking = false;
  storeState.drinkProgress = 0;
  storeState.drinkTimer = 0;
  storeState.purchaseTimer = 0;
  storeState.purchaseDuration = 0;
  removeStorePurchaseFx();
  purchasePromptEl.classList.add("hidden");
  storeDeathScreenEl.classList.add("hidden");
  clearStoreImpactFx();
  if (storeState.character) {
    storeState.character.rotation.set(0, storeState.angle, 0);
    resetPersonPose(storeState.character);
  }
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
  for (const helicopter of policeHelicopters) scene.remove(helicopter.group);
  for (const roadblock of policeRoadblocks) scene.remove(roadblock.group);
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
  policeHelicopters.length = 0;
  policeRoadblocks.length = 0;
  traffic.length = 0;
  smoke.length = 0;
  skidMarks.length = 0;
  speedLines.length = 0;
  debris.length = 0;
  tireParticles.length = 0;
  fallingTrees.length = 0;
  updateChunks();

  money = 0;
  speedBoostUntil = 0;
  arrestTime = 0;
  chaseTime = 0;
  backupTime = 0;
  idleHeat = 0;
  Object.assign(policeState, {
    level: MIN_WANTED_LEVEL,
    dispatchPending: true,
    escalationTimer: 0,
    unseenTimer: 0,
    decayTimer: 0,
    spawnTimer: 0,
    roadblockTimer: 0,
    helicopterTimer: 0,
    sightCheckTimer: 0,
    hasVisual: false,
    visualSource: "dispatch",
    lastKnownX: player.x,
    lastKnownZ: player.z,
    lastKnownVx: 0,
    lastKnownVz: 0,
    lastKnownAngle: player.angle,
    lastSeenAgo: 0,
    searchPhase: 0,
  });
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
  hintEl.textContent = "Police dispatch incoming";
  updateWantedMeter();
  updateGameCodeHud();
}

function loseGame() {
  if (gameOver) return;
  showNotification(`${playerName} got arrested`, true);
  playArrestSound();
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
  if (gameMode === "driving" || gameMode === "walking") updateChunks();
  if (running && gameMode !== "store" && worldHostControlsSimulation()) updateVendor(dt);
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
    if (chaseTime > POLICE_INITIAL_DISPATCH_DELAY + 0.2 && policeState.level > 0) hintEl.textContent += policeHudStatus();
  } else if (running && !gameOver && gameMode === "walking") {
    updateWalking(dt);
    if (worldHostControlsSimulation()) {
      updateTraffic(dt);
      updateCops(dt);
    } else {
      updateNetworkWorldVehicles(dt);
    }
    updateCollisions(dt, worldHostControlsSimulation());
    sendNetworkState(dt);
    if (chaseTime > POLICE_INITIAL_DISPATCH_DELAY + 0.2 && policeState.level > 0) hintEl.textContent = `On foot${policeHudStatus()}`;
  } else if (running && !gameOver && gameMode === "store") {
    moveStoreCharacter(dt);
    updateStorePunch(dt);
    updateStoreShop(dt);
    updateStoreDeath(dt);
    updateStoreHealthHud();
    sendNetworkState(dt);
  }
  updateWantedMeter();
  updateMobileControlLayout();
  updatePoliceLights(dt);
  updateRemotePlayers(dt);
  updateDriveEffects(dt);
  updateGlows(dt);
  updateStoreImpactFx(dt);
  if (gameMode === "store") {
    updateStoreCamera(dt);
  } else if (gameMode === "walking") {
    updateOutsideCamera(dt);
    drawMinimap();
  } else {
    updateCamera(dt);
    drawMinimap();
  }
  updateAudio(dt);
}

function loop() {
  const dt = Math.min(clock.getDelta(), 0.033);
  update(dt);
  renderer.render(scene, camera);
  requestAnimationFrame(loop);
}

window.addEventListener("resize", resize);
window.addEventListener("mousemove", handleStoreMouseLook);
window.addEventListener("pointerdown", unlockAudio);
window.addEventListener("mousedown", startStorePunch);
window.addEventListener("mousedown", startStoreDrink);
window.addEventListener("mouseup", releaseStorePunch);
window.addEventListener("mouseup", stopStoreDrink);
canvas.addEventListener("contextmenu", (event) => {
  if (gameMode === "store") event.preventDefault();
});
document.addEventListener("pointerlockchange", updatePointerLockHint);
document.addEventListener("click", (event) => {
  if (event.target.closest("button")) playUiClick();
});
document.addEventListener("pointerover", (event) => {
  if (event.target.closest("button")) playUiHover();
});
window.addEventListener("keydown", (event) => {
  unlockAudio();
  if (event.key.toLowerCase() === "f" && !event.repeat) {
    if (gameMode === "store") toggleStoreCameraMode();
    else if (gameMode === "driving") exitVehicleToFoot();
    else if (gameMode === "walking") handleOutsideAction();
    event.preventDefault();
  }
  if (event.key.toLowerCase() === "e" && !event.repeat) {
    tryBuyMegaforce();
    event.preventDefault();
  }
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
customizeButton.addEventListener("click", openCharacterCustomisation);
saveCustomizeButton.addEventListener("click", () => closeCharacterCustomisation(true));
backCustomizeButton.addEventListener("click", () => closeCharacterCustomisation(false));
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
mobileJumpButton.addEventListener("pointerdown", (event) => {
  if (!inputState.mobile || gameMode !== "store" || transitionLock || storeState.dead) return;
  unlockAudio();
  inputState.jumpQueued = true;
  event.preventDefault();
});
mobileActionButton.addEventListener("pointerdown", (event) => {
  if (!inputState.mobile || transitionLock || gameOver || !running) return;
  unlockAudio();
  mobileActionButton.classList.add("pressed");
  if (mobileActionButton.setPointerCapture) mobileActionButton.setPointerCapture(event.pointerId);
  if (gameMode === "driving") exitVehicleToFoot();
  else if (gameMode === "walking") handleOutsideAction();
  else if (gameMode === "store") toggleStoreCameraMode();
  event.preventDefault();
});
const releaseMobileAction = () => mobileActionButton.classList.remove("pressed");
mobileActionButton.addEventListener("pointerup", releaseMobileAction);
mobileActionButton.addEventListener("pointercancel", releaseMobileAction);

mobilePunchButton.addEventListener("pointerdown", (event) => {
  if (!inputState.mobile || gameMode !== "store" || transitionLock || storeState.dead) return;
  unlockAudio();
  mobilePunchButton.classList.add("pressed");
  if (mobilePunchButton.setPointerCapture) mobilePunchButton.setPointerCapture(event.pointerId);
  startStorePunch({ button: 0 });
  event.preventDefault();
});
const releaseMobilePunch = (event) => {
  mobilePunchButton.classList.remove("pressed");
  if (storeState.punchCharging) releaseStorePunch({ button: 0 });
  if (event) event.preventDefault();
};
mobilePunchButton.addEventListener("pointerup", releaseMobilePunch);
mobilePunchButton.addEventListener("pointercancel", releaseMobilePunch);

mobileUseButton.addEventListener("pointerdown", (event) => {
  if (!inputState.mobile || gameMode !== "store" || transitionLock || storeState.dead) return;
  unlockAudio();
  mobileUseButton.classList.add("pressed");
  if (mobileUseButton.setPointerCapture) mobileUseButton.setPointerCapture(event.pointerId);
  if (storeState.hasMegaforce) startStoreDrink({ button: 2, preventDefault() {} });
  else tryBuyMegaforce();
  event.preventDefault();
});
const releaseMobileUse = (event) => {
  mobileUseButton.classList.remove("pressed");
  if (storeState.drinking) stopStoreDrink({ button: 2, preventDefault() {} });
  if (event) event.preventDefault();
};
mobileUseButton.addEventListener("pointerup", releaseMobileUse);
mobileUseButton.addEventListener("pointercancel", releaseMobileUse);
canvas.addEventListener("click", requestStorePointerLock);
canvas.addEventListener("pointerdown", (event) => {
  if (!inputState.mobile || gameMode !== "store" || transitionLock || storeState.dead) return;
  inputState.lookPointerId = event.pointerId;
  inputState.lookX = event.clientX;
  inputState.lookY = event.clientY;
  canvas.setPointerCapture(event.pointerId);
  event.preventDefault();
});
canvas.addEventListener("pointermove", (event) => {
  if (!inputState.mobile || gameMode !== "store" || inputState.lookPointerId !== event.pointerId) return;
  const dx = event.clientX - inputState.lookX;
  const dy = event.clientY - inputState.lookY;
  inputState.lookX = event.clientX;
  inputState.lookY = event.clientY;
  storeState.angle -= dx * 0.006;
  storeState.cameraYaw = storeState.angle;
  const pitchLimit = storeState.cameraMode === "first" ? 1.48 : 0.62;
  storeState.pitch = clamp(storeState.pitch - dy * 0.0048, -pitchLimit, pitchLimit);
  event.preventDefault();
});
const releaseMobileLook = (event) => {
  if (inputState.lookPointerId === event.pointerId) inputState.lookPointerId = null;
};
canvas.addEventListener("pointerup", releaseMobileLook);
canvas.addEventListener("pointercancel", releaseMobileLook);
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
storeRespawnButton.addEventListener("click", respawnStorePlayer);

resize();
buildCharacterCustomisation();
createSMarketInterior();
createOutsideCharacter();
updateChunks();
updateCamera(0.016);
if (new URLSearchParams(window.location.search).has("play")) {
  playerName = cleanPlayerName(playerName || "Driver");
  nameScreenEl.classList.add("hidden");
  chooseDevice("computer");
  resetGame();
}
loop();
