import * as THREE from './assets/three.module.js';

const walls = [0xd9e3e1, 0x9cbabe, 0xc56c5e, 0xe0bc61, 0x729078, 0xdacbd7, 0x929496, 0xc4d5e4]
  .map(color => new THREE.MeshLambertMaterial({ color }));
const roofMaterials = [0x343e43, 0x873f40, 0x4d625d, 0x5d6272]
  .map(color => new THREE.MeshLambertMaterial({ color }));

// Each model stays inside its supplied footprint, including balconies and roofs.
export function buildArchitecture({ x, z, w, d, rng, district, shop, mats }) {
  const root = new THREE.Group();
  const variant = shop ? 6 : district === 'urban' ? (rng() < .65 ? 3 : 4)
    : district === 'industrial' ? (rng() < .65 ? 5 : 6) : Math.floor(rng() * 5);
  const wall = walls[Math.floor(rng() * walls.length)];
  const roof = roofMaterials[Math.floor(rng() * roofMaterials.length)];
  const bw = w - 14, bd = d - 16;
  const floors = variant === 3 ? 3 + Math.floor(rng() * 4) : variant === 4 ? 2 : 1;
  const height = variant === 5 ? 42 : variant === 2 ? 44 : floors * 26 + 8;
  const box = (px, py, pz, width, tall, deep, mat) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, tall, deep), mat);
    mesh.position.set(px, py, pz); mesh.castShadow = true; mesh.receiveShadow = true;
    root.add(mesh); return mesh;
  };
  box(0, 2, 0, bw + 4, 4, bd + 4, mats.foundation);
  box(0, height / 2 + 4, 0, bw, height, bd, wall);
  const window = (wx, wy, wz, width = 12, side = false) => {
    const frame = box(wx, wy, wz, side ? 1.7 : width + 2, 16, side ? width + 2 : 1.7, mats.curb);
    box(wx + (side ? 1 : 0), wy, wz - (side ? 0 : 1), side ? 2 : width, 13, side ? width : 2,
      rng() < .23 ? mats.windowWarm : mats.window);
    return frame;
  };
  if ([0, 1, 4].includes(variant)) {
    const rise = variant === 1 ? 21 : 13;
    const slope = Math.atan2(rise, bd / 2);
    for (const side of [-1, 1]) {
      const panel = box(0, height + 4 + rise / 2, side * bd / 4, bw + 10, 3,
        Math.hypot(bd / 2 + 3, rise), roof);
      panel.rotation.x = side * slope;
    }
    const chimney = box(-bw * .28, height + 19, bd * .12, 7, 24, 7, mats.marketBrick);
    box(chimney.position.x, height + 32, chimney.position.z, 9, 2, 9, roof);
  } else {
    box(0, height + 7, 0, bw + 8, 6, bd + 8, roof);
    if (variant === 2 || variant === 3) {
      box(-bw * .25, height + 14, bd * .18, 15, 10, 18, mats.metal);
      box(bw * .25, height + 11, bd * .15, 16, 2, 20, mats.policeBlue || mats.pumpBlue);
    }
  }
  if (variant === 5) {
    for (let i = -1; i <= 1; i++) {
      box(i * bw * .3, 19, -bd / 2 - 1, bw * .24, 30, 2, roof);
      for (let y = 8; y < 32; y += 6) box(i * bw * .3, y, -bd / 2 - 2.2, bw * .24, .8, 1, mats.metal);
    }
    for (let i = 0; i < 6; i++) box(-bw / 2 + i * bw / 5, 28, bd / 2 + .6, 1.2, 38, 1, roof);
  } else if (variant === 6) {
    box(0, 17, -bd / 2 - 1, bw * .82, 23, 2, mats.window);
    for (let i = -1; i <= 1; i++) box(i * bw * .27, 17, -bd / 2 - 2.5, 2, 25, 2, mats.metal);
    for (let i = 0; i < 8; i++) box(-bw * .44 + i * bw * .125, 31, -bd / 2 - 3,
      bw * .125, 3, 8, i % 2 ? mats.curb : wall);
    box(0, 37, -bd / 2 - 1, bw * .85, 8, 3, roof);
  } else {
    const columns = Math.max(2, Math.floor(bw / 22));
    for (let floor = 0; floor < floors; floor++) {
      for (let col = 0; col < columns; col++) {
        const wx = -bw * .34 + col * bw * .68 / (columns - 1);
        if (floor || col !== columns - 1) window(wx, 21 + floor * 26, -bd / 2 - 1, Math.min(14, bw / columns - 5));
        if (variant === 3 && floor && col % 2 === 0) {
          box(wx, 12 + floor * 26, -bd / 2 - 3, 17, 2, 6, mats.concrete);
          box(wx, 17 + floor * 26, -bd / 2 - 6, 17, 8, 1, roof);
        }
      }
      window(bw / 2 + .8, 21 + floor * 26, bd * .2, 13, true);
    }
    box(bw * .28, 16, -bd / 2 - 1, 11, 24, 2, mats.door);
    box(bw * .28, 30, -bd / 2 - 3, 18, 2, 8, roof);
    if (variant === 1) {
      for (let y = 9; y < height; y += 5) box(0, y, bd / 2 + .8, bw, .7, 1, roof);
    }
    if (variant === 2) {
      box(-bw * .22, height + 16, bd * .18, bw * .5, 24, bd * .45, walls[0]);
      box(-bw * .22, height + 29, bd * .18, bw * .55, 3, bd * .5, roof);
    }
  }
  root.position.set(x, 0, z);
  root.userData.architecture = variant;
  return root;
}
