import * as THREE from './assets/three.module.js';

export function createPedestrians(scene, hooks) {
  const people = new Map();
  const pieces = [];
  const cube = new THREE.BoxGeometry(1, 1, 1);
  const colors = [0x299ebc, 0xd75443, 0x62a557, 0xe4b74e, 0x795ca5, 0xdcb08a, 0x775440, 0x273543];
  const materials = colors.map(color => new THREE.MeshLambertMaterial({ color }));
  let serial = 0, spawnTimer = 0;
  function create(state) {
    const root = new THREE.Group();
    const limbs = [];
    const box = (x, y, z, w, h, d, color) => {
      const mesh = new THREE.Mesh(cube, materials[color]);
      mesh.position.set(x, y, z);
      mesh.scale.set(w, h, d);
      mesh.castShadow = true;
      root.add(mesh);
      return mesh;
    };
    const style = state.style % 5;
    box(0, 19, 0, 11, 14, 6, style);
    box(0, 31, 0, 8, 9, 8, 5 + state.style % 2);
    box(0, 36, 0, 9, 2, 9, 7);
    for (const side of [-1, 1]) {
      limbs.push(box(side * 7, 18, 0, 4, 15, 4, style));
      limbs.push(box(side * 3, 6, 0, 4, 12, 5, 7));
    }
    const knife = box(8, 12, 4, 1.5, 9, 2, 7);
    knife.visible = false;
    const p = { hp: 300, phase: 0, cooldown: 0, aggro: '', aggroTime: 0, dead: false, life: 0, ...state, root, limbs, knife };
    root.position.set(p.x, 0, p.z);
    scene.add(root);
    people.set(p.id, p);
    return p;
  }
  function shatter(p, vx, vz) {
    p.root.updateMatrixWorld(true);
    for (const child of p.root.children) {
      if (!child.visible) continue;
      const mesh = new THREE.Mesh(cube, child.material);
      child.getWorldPosition(mesh.position);
      child.getWorldQuaternion(mesh.quaternion);
      child.getWorldScale(mesh.scale);
      scene.add(mesh);
      pieces.push({ mesh, vx: vx * .7 + (Math.random() - .5) * 65, vz: vz * .7 + (Math.random() - .5) * 65,
        vy: 45 + Math.min(100, Math.hypot(vx, vz) * .35) + Math.random() * 35, spin: Math.random() * 9 - 4.5, life: 5 });
    }
    p.root.visible = false;
    while (pieces.length > 144) scene.remove(pieces.shift().mesh);
    if (hooks.near(p.x, p.z)) hooks.impact();
  }
  function damage(p, amount, attacker, vx = 0, vz = 0) {
    if (!p || p.dead) return;
    p.hp = Math.max(0, p.hp - amount);
    p.aggro = attacker;
    p.aggroTime = 15;
    if (!p.hp) {
      p.dead = true;
      p.life = 8;
      p.vx = vx;
      p.vz = vz;
      shatter(p, vx, vz);
      if (attacker) hooks.crime();
    }
  }
  function punch(id, actor) {
    const p = people.get(id);
    if (!actor || actor.mode !== 'walking' || !p || p.dead || Math.hypot(p.x - actor.x, p.z - actor.z) > 48) return;
    const dx = p.x - actor.x, dz = p.z - actor.z;
    if (dx * -Math.sin(actor.angle) + dz * -Math.cos(actor.angle) < 0) return;
    damage(p, 100, actor.id, dx * 3, dz * 3);
  }
  function target(actor) {
    return [...people.values()].filter(p => !p.dead && Math.hypot(p.x - actor.x, p.z - actor.z) < 44
      && (p.x - actor.x) * -Math.sin(actor.angle) + (p.z - actor.z) * -Math.cos(actor.angle) > 0)
      .sort((a, b) => Math.hypot(a.x - actor.x, a.z - actor.z) - Math.hypot(b.x - actor.x, b.z - actor.z))[0]?.id;
  }
  function update(dt, authority, actors, vehicles) {
    for (let i = pieces.length - 1; i >= 0; i--) {
      const p = pieces[i];
      p.life -= dt; p.vy -= 150 * dt;
      p.mesh.position.x += p.vx * dt; p.mesh.position.y += p.vy * dt; p.mesh.position.z += p.vz * dt;
      p.mesh.rotation.x += p.spin * dt; p.mesh.rotation.z += p.spin * .7 * dt;
      if (p.mesh.position.y < 4) { p.mesh.position.y = 4; p.vy = Math.abs(p.vy) * .3; p.vx *= .8; p.vz *= .8; }
      if (p.life < .5) p.mesh.scale.multiplyScalar(Math.max(0, 1 - dt * 5));
      if (p.life <= 0) { scene.remove(p.mesh); pieces.splice(i, 1); }
    }
    if (authority && actors.length) {
      spawnTimer -= dt;
      if (spawnTimer <= 0 && people.size < 24) {
        spawnTimer = .8;
        const actor = actors[Math.floor(Math.random() * actors.length)];
        const spot = hooks.spawn(actor);
        if (spot && ![...people.values()].some(p => Math.hypot(p.x - spot.x, p.z - spot.z) < 35)) {
          create({ ...spot, id: `ped-${++serial}`, style: serial % 10, angle: Math.random() * Math.PI * 2 });
        }
      }
    }
    for (const p of people.values()) {
      if (authority) {
        if (p.dead) p.life -= dt;
        if ((p.dead && p.life <= 0) || (!p.dead && actors.length && actors.every(a => Math.hypot(a.x - p.x, a.z - p.z) > 1500))) {
          scene.remove(p.root); people.delete(p.id); continue;
        }
        if (p.dead) continue;
        p.cooldown = Math.max(0, p.cooldown - dt); p.aggroTime -= dt;
        const enemy = actors.find(a => a.id === p.aggro && a.mode === 'walking');
        if (!enemy || p.aggroTime <= 0) p.aggro = '';
        let speed = 11;
        if (p.aggro && enemy) {
          p.angle = Math.atan2(enemy.x - p.x, enemy.z - p.z); speed = 36;
          if (Math.hypot(enemy.x - p.x, enemy.z - p.z) < 27) {
            speed = 0;
            if (!p.cooldown) { p.cooldown = 2; hooks.attack(enemy.id); }
          }
        }
        const nx = p.x + Math.sin(p.angle) * speed * dt, nz = p.z + Math.cos(p.angle) * speed * dt;
        if (hooks.clear(nx, nz) && (p.aggro || !hooks.road(nx, nz))) { p.x = nx; p.z = nz; }
        else p.angle += Math.PI * .6;
        for (const v of vehicles) {
          if ((v.y || 0) > 30 || Math.hypot(v.vx, v.vz) < 32) continue;
          const dx = p.x - v.x, dz = p.z - v.z;
          const side = dx * Math.cos(v.angle) - dz * Math.sin(v.angle);
          const front = -dx * Math.sin(v.angle) - dz * Math.cos(v.angle);
          if (Math.abs(side) < (v.halfWidth || 16) + 5 && Math.abs(front) < (v.halfLength || 28) + 5 + Math.hypot(v.vx, v.vz) * dt) {
            damage(p, 300, v.actorId || '', v.vx, v.vz); break;
          }
        }
      }
      if (p.dead) continue;
      p.phase += dt * (p.aggro ? 10 : 4);
      p.root.position.set(p.x, 0, p.z); p.root.rotation.y = p.angle;
      p.limbs.forEach((limb, i) => { limb.rotation.x = Math.sin(p.phase + (i < 2 ? 0 : Math.PI)) * .45; });
      p.knife.visible = !!p.aggro;
      if (p.cooldown > 1.6) p.limbs[2].rotation.x = -1.8;
    }
  }
  function snapshot() { return [...people.values()].map(({ id, x, z, angle, hp, style, dead, vx, vz, aggro, cooldown }) => ({ id, x, z, angle, hp, style, dead, vx, vz, aggro, cooldown })); }
  function sync(states) {
    const ids = new Set(states.map(p => p.id));
    for (const p of people.values()) if (!ids.has(p.id)) { scene.remove(p.root); people.delete(p.id); }
    for (const state of states.slice(0, 24)) {
      let p = people.get(state.id);
      if (!p) { p = create(state); p.root.visible = !state.dead; }
      else { if (!p.dead && state.dead) shatter(p, state.vx || 0, state.vz || 0); Object.assign(p, state); }
    }
  }
  function reset() { for (const p of people.values()) scene.remove(p.root); for (const p of pieces) scene.remove(p.mesh); people.clear(); pieces.length = 0; spawnTimer = 0; }
  return { update, snapshot, sync, reset, punch, target };
}
