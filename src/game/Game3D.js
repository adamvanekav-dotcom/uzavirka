import * as THREE from 'three';
import { World } from './world/World.js';
import { Player3D } from './player/Player3D.js';
import { createOverlayPass } from './world/overlay.js';

export class Game3D {
  constructor(canvas, engine, audio) {
    this.canvas = canvas;
    this.engine = engine;
    this.audio = audio;
    this.active = false;
    this.clock = new THREE.Clock();

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.55;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(72, window.innerWidth / window.innerHeight, 0.08, 120);

    this.world = new World(this.scene).build();
    this.player = new Player3D(this.camera, this.scene, audio);
    this.player.setColliders(this.world.colliders);
    this.player.position.copy(this.world.zoneMarkers.lobby);
    this.player.euler.set(0, Math.PI, 0);
    this.player.syncCamera();
    this.overlayMat = createOverlayPass(this.camera);

    this._onResize = () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', this._onResize);

    this.canvas.addEventListener('click', () => {
      if (this.active && !this.player.pointerLocked) {
        this.canvas.requestPointerLock();
      }
    });
    document.addEventListener('pointerlockchange', () => {
      this.player.pointerLocked = document.pointerLockElement === this.canvas;
    });

    window.addEventListener('keydown', (e) => {
      if (!this.active) return;
      if (e.code === 'KeyE') this.tryInteract();
      if (e.code === 'Escape' && this.player.pointerLocked) {
        document.exitPointerLock();
      }
    });

    this._raf = null;
    this._loop = () => {
      this._raf = requestAnimationFrame(this._loop);
      const dt = Math.min(0.05, this.clock.getDelta());
      if (this.active) {
        this.player.update(dt, this.world.interactables);
        this.world.update(this.clock.elapsedTime, this.engine.state.tension, this.player.position);
        if (this.overlayMat) {
          this.overlayMat.uniforms.uTime.value = this.clock.elapsedTime;
          this.overlayMat.uniforms.uTension.value = this.engine.state.tension;
          this.overlayMat.uniforms.uBattery.value = this.player.battery / 100;
        }
        this.onFrame?.(this.getHud());
      }
      this.renderer.render(this.scene, this.camera);
    };
    this._loop();
  }

  start() {
    this.active = true;
    const loc = this.engine.state.location || 'lobby';
    if (this.engine.state.location === 'parking') {
      // soft start inside visible lobby for first paint
      this.engine.state.location = 'lobby';
    }
    this.world.teleportPlayer(this.player, this.engine.state.location || 'lobby');
    this.player.euler.set(0, Math.PI, 0);
    this.player.syncCamera();
    this.canvas.requestPointerLock();
  }

  stop() {
    this.active = false;
    document.exitPointerLock();
  }

  getHud() {
    const h = this.player.hovered;
    return {
      battery: this.player.battery,
      stamina: this.player.stamina,
      flashlightOn: this.player.flashlightOn,
      prompt: h ? (h.userData.interactLabel || 'Interagovat') : null,
      interactId: h?.userData?.interactId || null,
      kind: h?.userData?.interactKind || null,
    };
  }

  tryInteract() {
    const h = this.player.hovered;
    if (!h) return null;
    const { interactId, interactKind } = h.userData;
    if (interactKind === 'exit') {
      // respect story exit gates when possible
      const loc = this.engine.story.locations[this.engine.state.location];
      const exit = (loc?.exits || []).find((e) => e.to === interactId);
      if (exit) {
        if (exit.requireFlag && !this.engine.flag(exit.requireFlag)) {
          return {
            title: 'Zamčeno',
            body: 'Tudy ještě nemůžeš. Nejdřív splň úkol v této zóně.',
          };
        }
        if (exit.requireItem && !this.engine.has(exit.requireItem)) {
          return {
            title: 'Zamčeno',
            body: `Potřebuješ: ${this.engine.story.items[exit.requireItem]?.name || exit.requireItem}.`,
          };
        }
      } else {
        // allow free roam between connected zones if story exit not listed from current — soft gate
        const softGates = {
          wavepool: () => this.engine.flag('turnstile_ok'),
          lockers: () => this.engine.flag('got_badge'),
          tower: () => this.engine.flag('saw_grate'),
          kids: () => this.engine.flag('found_locker'),
          wellness: () => this.engine.flag('got_usb'),
          office: () => this.engine.has('office_key'),
          filtration: () => this.engine.has('filter_key'),
        };
        const gate = softGates[interactId];
        if (gate && !gate()) {
          return {
            title: 'Zamčeno',
            body: 'Ještě na to nemáš přístup. Prozkoumej okolí a seber potřebné věci.',
          };
        }
      }
      this.engine.go(interactId);
      this.world.teleportPlayer(this.player, interactId);
      this.audio.blip('ui');
      return { silent: true };
    }

    // story action
    const result = this.engine.doAction(interactId);
    if (!result) {
      return {
        title: 'Nic',
        body: 'Teď to nefunguje — možná chybí předmět, nebo už je hotovo.',
      };
    }
    if (result.go) this.world.teleportPlayer(this.player, result.go);
    if (interactId === 'lobby_batteries_fix' || result.item === 'batteries') {
      this.player.addBattery(45);
    }
    if (this.engine.flag('flashlight_fresh')) this.player.addBattery(30);
    return result;
  }

  applyItemUse(itemId) {
    const result = this.engine.useItem(itemId);
    if (itemId === 'batteries' && result) this.player.addBattery(50);
    return result;
  }
}
