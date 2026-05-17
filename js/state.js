// ─── Game State ────────────────────────────────────────────────────────────
export const GAME_TIME  = 120;
export const BUOY_COUNT = 18;
export const FISH_COUNT = 12;
export const MINE_COUNT = 6;

export const BUOY_COLORS  = [0xff8800, 0xff3366, 0x44ffaa, 0xffdd00, 0x44aaff];
export const BUOY_POINTS  = { 0xff8800: 10, 0xff3366: 25, 0x44ffaa: 15, 0xffdd00: 20, 0x44aaff: 30 };
export const FISH_COLORS  = [0x44aaff, 0xffaa44, 0x44ffaa, 0xff88cc, 0xffff44];

export const state = {
  running:   false,
  score:     0,
  collected: 0,
  timeLeft:  GAME_TIME,
  lives:     3,
  highscore: 0,
};

export function resetState() {
  state.running   = true;
  state.score     = 0;
  state.collected = 0;
  state.timeLeft  = GAME_TIME;
  state.lives     = 3;
}
