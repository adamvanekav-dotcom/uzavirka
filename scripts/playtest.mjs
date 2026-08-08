/**
 * Headless playtest — walk critical paths to all 3 endings.
 * Run: node scripts/playtest.mjs
 */
import { story } from '../src/game/story.js';
import { Engine } from '../src/game/engine.js';

class FakeAudio {
  blip() {}
  setTension() {}
  init() {}
  resume() {}
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function pathWitness() {
  const e = new Engine(story, new FakeAudio());
  e.startFresh();
  e.go('lobby');
  e.doAction('lobby_drawer');
  e.doAction('lobby_batteries_fix');
  e.doAction('lobby_turnstile');
  e.go('lockers');
  e.doAction('lockers_cart');
  e.doAction('lockers_117');
  e.go('wavepool');
  e.doAction('wave_grate');
  e.doAction('wave_lifeguard_chair');
  e.go('tower');
  e.doAction('tower_blackhole');
  e.go('kids');
  e.doAction('kids_cabinet');
  e.go('wellness');
  e.doAction('well_break');
  e.doAction('well_phone');
  e.go('office');
  e.doAction('office_folder');
  e.doAction('office_cctv');
  assert(e.has('usb') && e.has('evidence_folder') && e.has('filter_key'), 'missing evidence kit');
  e.go('filtration');
  // simulate code
  e.setFlag('power_ok');
  e.doAction('valve_a');
  e.doAction('valve_b');
  e.doAction('valve_c_correct');
  e.doAction('valve_d');
  assert(e.state.ending === 'witness', `expected witness, got ${e.state.ending}`);
  console.log('OK witness ending');
}

function pathDeep() {
  const e = new Engine(story, new FakeAudio());
  e.startFresh();
  e.go('lobby');
  e.doAction('lobby_drawer');
  e.doAction('lobby_turnstile');
  e.go('lockers');
  e.doAction('lockers_cart');
  e.doAction('lockers_117');
  e.go('wavepool');
  e.doAction('wave_grate');
  e.doAction('wave_lifeguard_chair');
  e.go('tower');
  e.doAction('tower_blackhole');
  e.go('kids');
  e.doAction('kids_cabinet');
  e.go('office');
  e.doAction('office_folder');
  e.go('filtration');
  e.setFlag('power_ok');
  e.doAction('valve_c_early');
  assert(e.state.ending === 'deep', `expected deep, got ${e.state.ending}`);
  console.log('OK deep ending');
}

function pathEscape() {
  const e = new Engine(story, new FakeAudio());
  e.startFresh();
  e.go('lobby');
  e.doAction('lobby_drawer');
  e.doAction('lobby_turnstile');
  e.go('lockers');
  e.doAction('lockers_cart');
  e.doAction('lockers_117');
  e.go('wavepool');
  e.doAction('wave_grate');
  e.doAction('wave_lifeguard_chair');
  e.go('tower');
  e.doAction('tower_blackhole');
  e.go('kids');
  e.doAction('kids_cabinet');
  e.go('office');
  e.doAction('office_folder');
  e.go('filtration');
  e.doAction('filter_flee');
  assert(e.state.ending === 'escape', `expected escape, got ${e.state.ending}`);
  console.log('OK escape ending');
}

function pathGates() {
  const e = new Engine(story, new FakeAudio());
  e.startFresh();
  // start in lobby now
  const before = e.getView().exits.map((x) => x.to);
  assert(!before.includes('wavepool'), 'wavepool should be gated');
  e.doAction('lobby_drawer');
  e.doAction('lobby_turnstile');
  const after = e.getView().exits.map((x) => x.to);
  assert(after.includes('wavepool'), 'wavepool unlock failed');
  console.log('OK gates');
}

pathGates();
pathWitness();
pathDeep();
pathEscape();
console.log('All playtests passed.');
