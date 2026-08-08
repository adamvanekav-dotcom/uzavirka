import './style.css';
import { story } from './game/story.js';
import { Engine } from './game/engine.js';
import { AudioBus } from './game/audio.js';
import { createUI } from './game/ui.js';

const root = document.querySelector('#app');
const audio = new AudioBus();
const engine = new Engine(story, audio);

createUI(root, engine, audio);

// Expose for debugging / playtest
window.__uzavirka = { engine, story, audio };
