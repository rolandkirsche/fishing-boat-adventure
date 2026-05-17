import * as THREE from 'three';
import { BUOY_COLORS, BUOY_POINTS, FISH_COLORS, FISH_COUNT, MINE_COUNT } from './state.js';
import { showCollectFlash } from './hud.js';

// ─── Buoy ──────────────────────────────────────────────────────────────────
function buildBuoy(color = 0xff8800) {
  const buoy = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({ color, roughness: 0.4, metalness: 0.2, emissive: color, emissiveIntensity: 0.4 });
  buoy.add(new THREE.Mesh(new THREE.SphereGeometry(0.38, 12, 10), bodyMat));
  const band = new THREE.Mesh(new THREE.TorusGeometry(0.38, 0.07, 6, 20), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 }));
  band.rotation.x = Math.PI / 2; band.position.y = 0.05;
  buoy.add(band);
  const top = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.3, 6), new THREE.MeshStandardMaterial({ color: 0xffffff }));
  top.position.y = 0.52; buoy.add(top);
  const glow = new THREE.PointLight(color, 1.5, 4);
  glow.position.y = 0.3; buoy.add(glow);
  return buoy;
}

// ─── Fish ──────────────────────────────────────────────────────────────────
export function buildFish(color = 0x44aaff) {
  const fish = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.5, metalness: 0.3 });
  const bodyGeo = new THREE.SphereGeometry(0.28, 8, 6);
  bodyGeo.scale(1.8, 0.7, 0.7);
  fish.add(new THREE.Mesh(bodyGeo, mat));
  const tail = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.3, 5), mat);
  tail.rotation.z = Math.PI / 2; tail.position.x = 0.45; fish.add(tail);
  const eye = new THREE.Mesh(new THREE.SphereGeometry(0.06, 5, 4), new THREE.MeshStandardMaterial({ color: 0x000000 }));
  eye.position.set(-0.22, 0.1, 0.2); fish.add(eye);
  const fin = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.22, 4), mat);
  fin.position.set(-0.05, 0.28, 0); fin.rotation.z = -0.3; fish.add(fin);
  fish.scale.setScalar(0.9);
  return fish;
}

// ─── Mine ──────────────────────────────────────────────────────────────────
function buildMine() {
  const mine = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.6, metalness: 0.7 });
  const spikeMat = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.8, roughness: 0.4 });
  mine.add(new THREE.Mesh(new THREE.SphereGeometry(0.5, 12, 10), mat));
  [[0,1,0],[0,-1,0],[1,0,0],[-1,0,0],[0,0,1],[0,0,-1],[0.7,0.7,0],[-0.7,0.7,0],[0.7,-0.7,0],[-0.7,-0.7,0],[0.7,0,0.7],[-0.7,0,0.7],[0.7,0,-0.7],[-0.7,0,-0.7]].forEach(([x,y,z]) => {
    const spike = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.35, 5), spikeMat);
    const dir = new THREE.Vector3(x,y,z).normalize();
    spike.position.copy(dir.clone().multiplyScalar(0.5));
    spike.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0), dir);
    mine.add(spike);
  });
  const chain = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.8, 5), spikeMat);
  chain.position.y = -0.9; mine.add(chain);
  const warnLight = new THREE.PointLight(0xff2200, 1.2, 3);
  warnLight.position.y = 0.5; mine.add(warnLight);
  mine.userData.warnLight = warnLight;
  return mine;
}

// ─── Spawners ──────────────────────────────────────────────────────────────
export const buoys = [];
export const fishes = [];
export const mines  = [];

export function spawnAll(scene) {
  clearAll(scene);
  spawnBuoys(scene);
  spawnFishes(scene);
  spawnMines(scene);
}

export function clearAll(scene) {
  [...buoys, ...fishes, ...mines].forEach(e => scene.remove(e.mesh));
  buoys.length = fishes.length = mines.length = 0;
}

function spawnBuoys(scene) {
  for (let i = 0; i < 18; i++) spawnOneBuoy(scene);
}

export function spawnOneBuoy(scene) {
  const color = BUOY_COLORS[Math.floor(Math.random() * BUOY_COLORS.length)];
  const mesh = buildBuoy(color);
  const angle = Math.random() * Math.PI * 2;
  const dist  = 15 + Math.random() * 55;
  mesh.position.set(Math.cos(angle)*dist, 0.4, Math.sin(angle)*dist);
  mesh.userData = { phase: Math.random()*Math.PI*2, color, points: BUOY_POINTS[color]||10 };
  scene.add(mesh);
  buoys.push({ mesh, collected: false });
}

function spawnFishes(scene) {
  for (let i = 0; i < FISH_COUNT; i++) spawnOneFish(scene);
}

export function spawnOneFish(scene) {
  const color = FISH_COLORS[Math.floor(Math.random() * FISH_COLORS.length)];
  const mesh = buildFish(color);
  const angle = Math.random() * Math.PI * 2;
  mesh.position.set(Math.cos(angle)*40, 0.15, Math.sin(angle)*40);
  mesh.userData = { swimAngle: Math.random()*Math.PI*2, turnSpeed: (Math.random()-0.5)*0.4, speed: 0.3+Math.random()*0.5, yOff: Math.random()*Math.PI*2, points: 20, collected: false };
  scene.add(mesh);
  fishes.push({ mesh, collected: false });
}

function spawnMines(scene) {
  for (let i = 0; i < MINE_COUNT; i++) {
    const mesh = buildMine();
    const angle = Math.random() * Math.PI * 2;
    const dist  = 12 + Math.random() * 50;
    mesh.position.set(Math.cos(angle)*dist, 0.1, Math.sin(angle)*dist);
    mesh.userData.bobPhase = Math.random() * Math.PI * 2;
    scene.add(mesh);
    mines.push({ mesh, hit: false });
  }
}

// ─── Update ────────────────────────────────────────────────────────────────
export function updateEntities(scene, ship, shipAngle, shipPos2D, state, t, dt) {
  // Buoys
  buoys.forEach(b => {
    if (b.collected) return;
    b.mesh.position.y = 0.4 + Math.sin(t*1.8 + b.mesh.userData.phase) * 0.12;
    b.mesh.rotation.y += dt * 1.1;
    const bp = new THREE.Vector2(b.mesh.position.x, b.mesh.position.z);
    if (shipPos2D.distanceTo(bp) < 1.8) {
      b.collected = true;
      scene.remove(b.mesh);
      state.score += b.mesh.userData.points;
      state.collected++;
      showCollectFlash(innerWidth*0.5, innerHeight*0.45, `+${b.mesh.userData.points}`);
      setTimeout(() => { if (state.running) spawnOneBuoy(scene); }, 5000);
    }
  });

  // Fish
  fishes.forEach(f => {
    if (f.collected) return;
    const ud = f.mesh.userData;
    ud.swimAngle += ud.turnSpeed * dt;
    f.mesh.position.x += Math.sin(ud.swimAngle) * ud.speed * dt;
    f.mesh.position.z += Math.cos(ud.swimAngle) * ud.speed * dt;
    f.mesh.position.y = 0.15 + Math.sin(t*2.2 + ud.yOff) * 0.06;
    f.mesh.rotation.y = -ud.swimAngle;
    if (f.mesh.children[1]) f.mesh.children[1].rotation.y = Math.sin(t*6 + ud.yOff) * 0.3;
    const fd = Math.sqrt(f.mesh.position.x**2 + f.mesh.position.z**2);
    if (fd > 90) ud.swimAngle += Math.PI * dt;
    const fp = new THREE.Vector2(f.mesh.position.x, f.mesh.position.z);
    if (shipPos2D.distanceTo(fp) < 1.6) {
      f.collected = true;
      scene.remove(f.mesh);
      state.score += 20;
      state.collected++;
      showCollectFlash(innerWidth*0.5, innerHeight*0.45, '+20 🐟');
      setTimeout(() => { if (state.running) spawnOneFish(scene); }, 5000);
    }
  });

  // Mines
  mines.forEach(m => {
    if (m.hit) return;
    m.mesh.position.y = 0.1 + Math.sin(t*0.8 + m.mesh.userData.bobPhase) * 0.08;
    m.mesh.rotation.y += dt * 0.3;
    if (m.mesh.userData.warnLight) m.mesh.userData.warnLight.intensity = 0.6 + Math.abs(Math.sin(t*3)) * 1.4;
    const mp = new THREE.Vector2(m.mesh.position.x, m.mesh.position.z);
    if (shipPos2D.distanceTo(mp) < 1.4) {
      m.hit = true;
      scene.remove(m.mesh);
      state.lives--;
      const flash = document.createElement('div');
      flash.style.cssText = 'position:fixed;inset:0;background:rgba(255,80,0,0.55);z-index:50;pointer-events:none;animation:fadeOut 0.5s forwards';
      document.body.appendChild(flash);
      setTimeout(() => flash.remove(), 500);
      showCollectFlash(innerWidth*0.5, innerHeight*0.4, '💥 Mine! -❤️');
    }
  });
}
