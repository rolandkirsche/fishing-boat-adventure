import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.165.0/build/three.module.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.165.0/examples/jsm/loaders/GLTFLoader.js';
import { createWater } from './water.js';
import { updateHUD, resetHUD, showCollectFlash } from './hud.js';
import { state, resetState } from './state.js';
import { spawnAll, clearAll, updateEntities, buoys, fishes, mines } from './entities.js';

// ─── Renderer ──────────────────────────────────────────────────────────────
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;
document.body.appendChild(renderer.domElement);

// ─── Scene ─────────────────────────────────────────────────────────────────
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a4a7a);
scene.fog = new THREE.FogExp2(0x2a6a9a, 0.014);

const camera = new THREE.PerspectiveCamera(65, innerWidth/innerHeight, 0.1, 500);
camera.position.set(0, 4, 10);

// ─── Lighting ──────────────────────────────────────────────────────────────
const sun = new THREE.DirectionalLight(0xfff4d6, 2.2);
sun.position.set(30, 60, 20);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.near = 1; sun.shadow.camera.far = 200;
sun.shadow.camera.left = -60; sun.shadow.camera.right = 60;
sun.shadow.camera.top = 60; sun.shadow.camera.bottom = -60;
scene.add(sun);
scene.add(new THREE.AmbientLight(0x1a4080, 1.2));
scene.add(new THREE.HemisphereLight(0x4488cc, 0x001133, 0.8));

// ─── Water ─────────────────────────────────────────────────────────────────
const waterMat = createWater(scene);

// ─── Stars ─────────────────────────────────────────────────────────────────
const starGeo = new THREE.BufferGeometry();
const starPos = new Float32Array(3000);
for (let i = 0; i < 3000; i += 3) {
  const theta = Math.random()*Math.PI*2, phi = Math.acos(Math.random()*2-1), r = 200+Math.random()*50;
  starPos[i] = r*Math.sin(phi)*Math.cos(theta); starPos[i+1] = Math.abs(r*Math.cos(phi))+20; starPos[i+2] = r*Math.sin(phi)*Math.sin(theta);
}
starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.4, sizeAttenuation: true })));

// ─── Ship ──────────────────────────────────────────────────────────────────
const ship = new THREE.Group();
ship.position.set(0, -0.6, 0);
scene.add(ship);

const loader = new GLTFLoader();
loader.load('./assets/Fischerboot.glb', (gltf) => {
  const model = gltf.scene;
  const box = new THREE.Box3().setFromObject(model);
  const size = box.getSize(new THREE.Vector3());
  model.scale.setScalar(4.5 / Math.max(size.x, size.y, size.z));
  box.setFromObject(model);
  const center = box.getCenter(new THREE.Vector3());
  model.position.sub(center);
  const cube = model.getObjectByName('Cube');
  if (cube) cube.visible = false;
  const box2 = new THREE.Box3();
  model.traverse(c => { if (c.isMesh && c.visible) box2.expandByObject(c); });
  model.position.y -= box2.min.y;
  model.rotation.y = Math.PI;
  model.traverse(c => { if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; } });
  ship.add(model);
});

const wakeLight = new THREE.PointLight(0x4488ff, 0.8, 8);
wakeLight.position.set(0, 0.5, 2);
ship.add(wakeLight);

// ─── Controls ──────────────────────────────────────────────────────────────
const keys = {};
window.addEventListener('keydown', e => keys[e.code] = true);
window.addEventListener('keyup',   e => keys[e.code] = false);

let shipVelocity = 0, shipAngle = 0;
const SPEED_MAX = 14, SPEED_ACC = 8, SPEED_BRK = 12, TURN_SPD = 1.6;
const camOffset = new THREE.Vector3(0, 3.5, 9);
const camTarget = new THREE.Vector3();

// ─── Wake Particles ────────────────────────────────────────────────────────
const wakeParticles = [];
const wakeMat = new THREE.MeshBasicMaterial({ color: 0xaaddff, transparent: true, opacity: 0.5 });
let wakeTimer = 0;

function spawnWake(pos) {
  if (Math.abs(shipVelocity) < 1 || wakeParticles.length > 80) return;
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.12+Math.random()*0.1, 5, 4), wakeMat.clone());
  mesh.position.copy(pos); mesh.position.y = 0.05;
  scene.add(mesh);
  wakeParticles.push({ mesh, life: 1.0, vx: (Math.random()-0.5)*0.5, vz: (Math.random()-0.5)*0.5 });
}

function spawnBowWave() {
  if (Math.abs(shipVelocity) < 2 || wakeParticles.length > 80) return;
  const bowOffset = new THREE.Vector3(-Math.sin(shipAngle)*1.6, 0.05, -Math.cos(shipAngle)*1.6);
  const bowPos = ship.position.clone().add(bowOffset);
  [-1, 1].forEach(side => {
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.08+Math.random()*0.1, 4, 3), new THREE.MeshBasicMaterial({ color: 0xddeeff, transparent: true, opacity: 0.7 }));
    mesh.position.copy(bowPos);
    const sideAngle = shipAngle + side * Math.PI * 0.35;
    scene.add(mesh);
    wakeParticles.push({ mesh, life: 1.0, vx: Math.sin(sideAngle)*(1.5+Math.random()), vz: Math.cos(sideAngle)*(1.5+Math.random()), vy: 0.2+Math.random()*0.3, isBow: true });
  });
}

// ─── Overlay / UI ──────────────────────────────────────────────────────────
const overlay   = document.getElementById('overlay');
const startBtn  = document.getElementById('start-btn');
const finalScore  = document.getElementById('final-score');
const highscoreEl = document.getElementById('highscore-display');
const overlaySub  = document.getElementById('overlay-sub');
const overlayTitle = document.querySelector('#overlay h1');

function startGame() {
  resetState();
  resetHUD();
  overlay.style.display = 'none';
  ship.position.set(0, -0.6, 0);
  shipVelocity = 0; shipAngle = 0; ship.rotation.y = 0;
  spawnAll(scene);
  updateHUD();
}

function endGame() {
  state.running = false;
  if (state.score > state.highscore) state.highscore = state.score;
  overlayTitle.innerHTML = 'Zeit abgelaufen!';
  overlaySub.textContent = 'Dein Ergebnis:';
  finalScore.style.display = 'block';
  finalScore.textContent = state.score + ' Punkte';
  highscoreEl.style.display = 'block';
  highscoreEl.textContent = 'Highscore: ' + state.highscore;
  startBtn.textContent = 'Nochmal spielen';
  overlay.style.display = 'flex';
}

startBtn.addEventListener('click', startGame);

// ─── Main Loop ─────────────────────────────────────────────────────────────
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);
  const t  = clock.getElapsedTime();

  waterMat.uniforms.uTime.value = t;

  if (state.running) {
    state.timeLeft -= dt;
    if (state.timeLeft <= 0) { state.timeLeft = 0; updateHUD(); endGame(); return; }

    // Controls
    const fwd = (keys['KeyS'] ? 1 : 0) - (keys['KeyW'] ? 1 : 0)
              + (keys['ArrowDown'] ? 1 : 0) - (keys['ArrowUp'] ? 1 : 0);
    const trn = (keys['KeyD'] ? 1 : 0) - (keys['KeyA'] ? 1 : 0)
              + (keys['ArrowRight'] ? 1 : 0) - (keys['ArrowLeft'] ? 1 : 0);

    if (fwd > 0) shipVelocity = Math.min(shipVelocity + SPEED_ACC*dt, SPEED_MAX*fwd);
    else if (fwd < 0) shipVelocity = Math.max(shipVelocity - SPEED_ACC*dt, SPEED_MAX*0.4*fwd);
    else shipVelocity *= (1 - SPEED_BRK*dt*0.1);
    if (Math.abs(shipVelocity) < 0.01) shipVelocity = 0;

    if (Math.abs(shipVelocity) > 0.2) shipAngle += trn * TURN_SPD * dt * (shipVelocity/SPEED_MAX);
    ship.rotation.y = shipAngle;
    ship.position.x -= Math.sin(shipAngle) * shipVelocity * dt;
    ship.position.z -= Math.cos(shipAngle) * shipVelocity * dt;
    ship.position.y = -0.6 + Math.sin(t*1.3) * 0.06;
    ship.rotation.z = Math.sin(t*0.9) * 0.025;
    ship.rotation.x = Math.sin(t*1.1) * 0.015;

    // Wake
    wakeTimer += dt;
    if (wakeTimer > 0.08 && Math.abs(shipVelocity) > 1) {
      wakeTimer = 0;
      const wp = ship.position.clone();
      wp.x += Math.sin(shipAngle)*-1.2; wp.z += Math.cos(shipAngle)*-1.2;
      spawnWake(wp);
      if (Math.abs(shipVelocity) > 3) spawnBowWave();
    }

    // Entities
    const shipPos2D = new THREE.Vector2(ship.position.x, ship.position.z);
    updateEntities(scene, ship, shipAngle, shipPos2D, state, t, dt);
    if (state.lives <= 0) { endGame(); return; }

    updateHUD();
  }

  // Wake update
  for (let i = wakeParticles.length-1; i >= 0; i--) {
    const wp = wakeParticles[i];
    wp.life -= dt * (wp.isBow ? 1.8 : 0.8);
    wp.mesh.position.x += wp.vx*dt; wp.mesh.position.z += wp.vz*dt;
    if (wp.isBow) {
      wp.mesh.position.y += (wp.vy||0)*dt; wp.vy = (wp.vy||0)-1.5*dt;
      wp.mesh.scale.setScalar(1+(1-wp.life)*1.5); wp.mesh.material.opacity = wp.life*0.6;
    } else {
      wp.mesh.scale.setScalar(1+(1-wp.life)*2); wp.mesh.material.opacity = wp.life*0.4;
    }
    if (wp.life <= 0) { scene.remove(wp.mesh); wakeParticles.splice(i,1); }
  }

  // Camera
  const idealOffset = new THREE.Vector3(Math.sin(shipAngle)*-camOffset.z, camOffset.y, Math.cos(shipAngle)*-camOffset.z);
  camera.position.lerp(ship.position.clone().add(idealOffset), 0.06);
  camTarget.lerp(ship.position, 0.1);
  camera.lookAt(camTarget);

  renderer.render(scene, camera);
}

animate();

window.addEventListener('resize', () => {
  camera.aspect = innerWidth/innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});
