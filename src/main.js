import './style.css';
import { story } from './game/story.js';
import { Engine } from './game/engine.js';
import { AudioBus } from './game/audio.js';
import { createUI } from './game/ui.js';
import { Game3D } from './game/Game3D.js';

const root = document.querySelector('#app');
const audio = new AudioBus();
const engine = new Engine(story, audio);

let game3d = null;

function ensure3D(canvas) {
  if (game3d && game3d.canvas !== canvas) {
    game3d.active = false;
    game3d = null;
  }
  if (!game3d) {
    game3d = new Game3D(canvas, engine, audio);
  }
  return game3d;
}

createUI(root, engine, audio, {
  ensure3D,
  getGame3D: () => game3d,
});

window.__uzavirka = { engine, story, audio, get game3d() { return game3d; } };
