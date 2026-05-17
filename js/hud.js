import { state } from './state.js';

const scoreEl     = document.getElementById('score-val');
const timerEl     = document.getElementById('timer-val');
const collectedEl = document.getElementById('collected-val');
const timerBox    = document.getElementById('timer-box');
const livesEl     = document.getElementById('lives-val');

let _lastScore = -1, _lastLives = -1, _lastCollected = -1, _lastTime = -1;

export function updateHUD() {
  if (state.score !== _lastScore) { scoreEl.textContent = state.score; _lastScore = state.score; }
  if (state.lives !== _lastLives) {
    if (livesEl) livesEl.textContent = '❤️'.repeat(Math.max(0, state.lives));
    _lastLives = state.lives;
  }
  if (state.collected !== _lastCollected) { collectedEl.textContent = state.collected; _lastCollected = state.collected; }
  const secs = Math.floor(state.timeLeft);
  if (secs !== _lastTime) {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    timerEl.textContent = `${m}:${s.toString().padStart(2, '0')}`;
    timerBox.classList.toggle('urgent', state.timeLeft < 30);
    _lastTime = secs;
  }
}

export function resetHUD() {
  _lastScore = _lastLives = _lastCollected = _lastTime = -1;
}

export function showCollectFlash(x, y, text) {
  const el = document.createElement('div');
  el.className = 'collect-flash';
  el.textContent = text;
  el.style.left = x + 'px';
  el.style.top  = y + 'px';
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1000);
}
