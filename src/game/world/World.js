import * as THREE from 'three';
import { Materials } from './materials.js';
import { makeNeonSign, makeKidsDrawings, makeMapBoard } from './textures.js';
import { createWater, updateWater } from './water.js';
import { createWatcher, updateWatcher } from './Watcher.js';

/**
 * Connected night aquapark. Interactables:
 * interactKind 'action' → story action id
 * interactKind 'exit' → location id for engine.go
 */
export class World {
  constructor(scene) {
    this.scene = scene;
    this.colliders = [];
    this.interactables = [];
    this.zoneMarkers = {};
    this.dynamicLights = [];
    this.water = null;
    this.group = new THREE.Group();
    this.scene.add(this.group);
    this.mats = new Materials(8);
  }

  async load() {
    await this.mats.load();
    this.neonTex = makeNeonSign();
    this.kidsArt = makeKidsDrawings();
    this.mapTex = makeMapBoard();
    this.build();
    return this;
  }

  build() {
    this._lighting();
    this._parking();
    this._lobby();
    this._lockers();
    this._wavePool();
    this._tower();
    this._kids();
    this._wellness();
    this._office();
    this._filtration();
    this._atmosphere();
    this.watcher = createWatcher();
    this.group.add(this.watcher);
    return this;
  }

  _box(w, h, d, mat, x, y, z, opts = {}) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    if (opts.rotY) mesh.rotation.y = opts.rotY;
    this.group.add(mesh);
    if (opts.collide !== false && h > 0.9) {
      mesh.updateMatrixWorld(true);
      this.colliders.push(new THREE.Box3().setFromObject(mesh));
    }
    return mesh;
  }

  _cyl(rTop, rBot, h, mat, x, y, z, opts = {}) {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBot, h, opts.seg || 16), mat);
    mesh.position.set(x, y, z);
    if (opts.rotX) mesh.rotation.x = opts.rotX;
    if (opts.rotZ) mesh.rotation.z = opts.rotZ;
    if (opts.rotY) mesh.rotation.y = opts.rotY;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    this.group.add(mesh);
    return mesh;
  }

  _floor(w, d, y, mat, x = 0, z = 0) {
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(x, y, z);
    mesh.receiveShadow = true;
    this.group.add(mesh);
    return mesh;
  }

  /** Room shell with optional door openings: { n, s, e, w } = door width on that side. */
  _shell(cx, cz, w, d, h, wallMat, floorMat, openings = {}) {
    this._floor(w, d, 0.01, floorMat, cx, cz);
    const t = 0.32;
    const doorH = 2.55;
    const sides = [
      { key: 'n', ax: 'z', x: cx, z: cz - d / 2, len: w, horiz: true },
      { key: 's', ax: 'z', x: cx, z: cz + d / 2, len: w, horiz: true },
      { key: 'w', ax: 'x', x: cx - w / 2, z: cz, len: d, horiz: false },
      { key: 'e', ax: 'x', x: cx + w / 2, z: cz, len: d, horiz: false },
    ];
    for (const s of sides) {
      const gap = openings[s.key];
      if (!gap) {
        if (s.horiz) this._box(s.len, h, t, wallMat, s.x, h / 2, s.z);
        else this._box(t, h, s.len, wallMat, s.x, h / 2, s.z);
        continue;
      }
      const remain = (s.len - gap) / 2;
      if (s.horiz) {
        this._box(remain, h, t, wallMat, s.x - (gap + remain) / 2, h / 2, s.z);
        this._box(remain, h, t, wallMat, s.x + (gap + remain) / 2, h / 2, s.z);
        this._box(gap, h - doorH, t, wallMat, s.x, doorH + (h - doorH) / 2, s.z, { collide: false });
      } else {
        this._box(t, h, remain, wallMat, s.x, h / 2, s.z - (gap + remain) / 2);
        this._box(t, h, remain, wallMat, s.x, h / 2, s.z + (gap + remain) / 2);
        this._box(t, h - doorH, gap, wallMat, s.x, doorH + (h - doorH) / 2, s.z, { collide: false });
      }
    }
    this._box(w, 0.22, d, this.mats.make('plaster', { repeat: [4, 4], color: 0x1a2228, roughness: 0.95 }), cx, h, cz, { collide: false });
  }

  _lamp(x, y, z, color = 0xc8d8e8, intensity = 2.4, size = 0.32) {
    const can = this._cyl(size * 0.7, size * 0.85, 0.16, this.mats.make('metal', { repeat: [1, 1], color: 0x3a424c }), x, y + 0.04, z);
    can.castShadow = false;
    const bulb = new THREE.Mesh(
      new THREE.CircleGeometry(size * 0.52, 16),
      new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity: 2.8,
        roughness: 0.35,
        side: THREE.DoubleSide,
      }),
    );
    bulb.rotation.x = Math.PI / 2;
    bulb.position.set(x, y - 0.03, z);
    this.group.add(bulb);
    const l = new THREE.PointLight(color, intensity, 16, 1.45);
    l.position.set(x, y - 0.18, z);
    l.userData.baseIntensity = intensity;
    this.group.add(l);
    this.dynamicLights.push(l);
    return l;
  }

  _portal(w, h, x, y, z, to, label, rotY = 0) {
    const mesh = this._box(w, h, 0.1, this.mats.make('metal', { repeat: [1, 1], color: 0x667888 }), x, y, z, { collide: false, rotY });
    this._interact(mesh, to, label, 'exit');
    return mesh;
  }

  _interact(mesh, id, label, kind = 'action') {
    mesh.userData.interactId = id;
    mesh.userData.interactLabel = label;
    mesh.userData.interactKind = kind;
    if (kind === 'exit') {
      mesh.material = mesh.material.clone();
      mesh.material.transparent = true;
      mesh.material.opacity = 0.18;
      mesh.material.depthWrite = false;
      mesh.material.emissive = new THREE.Color(0x1a6070);
      mesh.material.emissiveIntensity = 0.45;
      mesh.castShadow = false;
    } else if (mesh.material && 'emissive' in mesh.material) {
      mesh.material = mesh.material.clone();
      mesh.material.emissive = new THREE.Color(0x0a3040);
      mesh.material.emissiveIntensity = 0.18;
    }

    const mark = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.07, 0),
      new THREE.MeshStandardMaterial({
        color: kind === 'exit' ? 0xa0ffe0 : 0x7ef0f0,
        emissive: kind === 'exit' ? 0x40d0a0 : 0x3ad0d0,
        emissiveIntensity: 1.15,
        transparent: true,
        opacity: 0.75,
      }),
    );
    const box = new THREE.Box3().setFromObject(mesh);
    const c = new THREE.Vector3();
    box.getCenter(c);
    mark.position.set(c.x, box.max.y + 0.22, c.z);
    mark.userData.markerFor = id;
    this.group.add(mark);
    mesh.userData.marker = mark;
    this.interactables.push(mesh);
    return mesh;
  }

  _lighting() {
    this.scene.background = new THREE.Color(0x03080e);
    this.scene.fog = new THREE.FogExp2(0x071018, 0.012);

    this.scene.add(new THREE.AmbientLight(0x3a4e5c, 0.22));
    this.scene.add(new THREE.HemisphereLight(0x6a88a0, 0x0c0806, 0.28));

    const moon = new THREE.DirectionalLight(0xb8cce0, 0.55);
    moon.position.set(-18, 42, 22);
    moon.castShadow = true;
    moon.shadow.mapSize.set(2048, 2048);
    moon.shadow.camera.left = -50;
    moon.shadow.camera.right = 50;
    moon.shadow.camera.top = 50;
    moon.shadow.camera.bottom = -50;
    moon.shadow.bias = -0.00025;
    moon.shadow.normalBias = 0.025;
    this.scene.add(moon);

    const warm = new THREE.DirectionalLight(0xffc090, 0.12);
    warm.position.set(10, 14, -6);
    this.scene.add(warm);
  }

  _parking() {
    this.zoneMarkers.parking = new THREE.Vector3(0, 1.65, 26);
    this._floor(40, 22, 0, this.mats.make('asphalt', { repeat: [8, 5], roughness: 0.92, env: 0.45 }), 0, 26);
    for (let i = 0; i < 7; i++) {
      this._box(0.12, 0.02, 4.8, new THREE.MeshStandardMaterial({ color: 0xc8c090 }), -12 + i * 4, 0.03, 28, { collide: false });
    }
    this._cyl(0.14, 0.14, 1.5, this.mats.make('metal', { repeat: [1, 1] }), -7, 0.75, 22.4);
    this._box(3.4, 0.1, 0.16, new THREE.MeshStandardMaterial({ color: 0xb02828, roughness: 0.45 }), -5.2, 1.25, 22.4, { collide: false });
    this._box(1.7, 0.9, 0.08, new THREE.MeshStandardMaterial({
      color: 0x1a2030, emissive: 0x401010, emissiveIntensity: 0.35,
    }), 6, 1.9, 22.5, { collide: false });
  }

  _lobby() {
    this.zoneMarkers.lobby = new THREE.Vector3(0, 1.65, 12);
    const wall = this.mats.wall([4, 2], 0xc8d0d4);
    const floor = this.mats.wetFloor([7, 6], 0x9eb0b8);
    this._shell(0, 12, 20, 16, 5.2, wall, floor, { n: 3.0, s: 2.6, w: 2.2 });

    const sign = new THREE.Mesh(
      new THREE.PlaneGeometry(8.5, 1.4),
      new THREE.MeshStandardMaterial({
        map: this.neonTex,
        emissiveMap: this.neonTex,
        emissive: 0xffffff,
        emissiveIntensity: 1.7,
      }),
    );
    sign.position.set(0, 4.15, 19.85);
    sign.rotation.y = Math.PI;
    this.group.add(sign);
    const neon = new THREE.PointLight(0x4ad0e0, 2.2, 14, 1.6);
    neon.position.set(0, 4.1, 18.5);
    this.group.add(neon);

    const desk = this._box(4.5, 0.95, 1.2, this.mats.make('metal', { repeat: [2, 1], color: 0x6a7884, metalness: 0.85, roughness: 0.35 }), -3.2, 0.48, 14.6);
    this._box(4.6, 0.06, 1.3, this.mats.make('metal', { repeat: [2, 1], color: 0x9aa8b4 }), -3.2, 0.98, 14.6, { collide: false });
    this._box(0.06, 0.52, 0.72, this.mats.make('metal', { repeat: [1, 1], color: 0x222830 }), -4.5, 1.4, 14.4, { collide: false });
    this._box(0.03, 0.46, 0.64, new THREE.MeshStandardMaterial({ color: 0x0a1812, emissive: 0x1a6644, emissiveIntensity: 0.75 }), -4.46, 1.4, 14.4, { collide: false });
    this._interact(desk, 'lobby_drawer', 'Otevřít šuplík u recepce');

    const flyer = this._box(0.34, 0.02, 0.26, new THREE.MeshStandardMaterial({ color: 0xe8d9a0, roughness: 0.55 }), -2.2, 1.04, 14.55);
    this._interact(flyer, 'lobby_flyer', 'Sebrat leták');
    const book = this._box(0.42, 0.06, 0.3, new THREE.MeshStandardMaterial({ color: 0x6a3040, roughness: 0.7 }), -1.2, 1.04, 14.55);
    this._interact(book, 'lobby_guest_book', 'Otevřít knihu přání');
    const batt = this._box(0.2, 0.07, 0.12, new THREE.MeshStandardMaterial({ color: 0x1a1a1a, emissive: 0x1a6a1a, emissiveIntensity: 0.7 }), -2.7, 1.04, 14.9);
    this._interact(batt, 'lobby_batteries_fix', 'Vzít baterie');

    const mapBoard = this._box(2.2, 1.55, 0.08, this.mats.make('metal', { repeat: [1, 1] }), 5.2, 1.9, 4.25);
    this._box(2.0, 1.35, 0.02, new THREE.MeshStandardMaterial({ map: this.mapTex, roughness: 0.7 }), 5.2, 1.9, 4.32, { collide: false });
    this._interact(mapBoard, 'lobby_map', 'Prohlédnout mapu areálu');

    const vending = this._box(1.1, 2.15, 0.78, this.mats.make('metal', { repeat: [1, 2], color: 0x3a4850, metalness: 0.9 }), 7.4, 1.08, 16);
    this._box(0.92, 1.3, 0.04, new THREE.MeshPhysicalMaterial({
      color: 0x88b0c8, transparent: true, opacity: 0.28, roughness: 0.05, metalness: 0.1,
    }), 7.4, 1.28, 16.42, { collide: false });
    this._interact(vending, 'lobby_vending', 'Kopnout do automatu');

    const turn = this._box(0.32, 1.05, 0.32, this.mats.make('metal', { repeat: [1, 1], color: 0x8899aa }), 0, 0.52, 7.9);
    for (let i = 0; i < 3; i++) {
      const arm = this._box(1.35, 0.05, 0.05, this.mats.make('metal', { repeat: [1, 1] }), 0, 0.85, 7.9, { collide: false });
      const a = (i * Math.PI * 2) / 3;
      arm.position.set(Math.cos(a) * 0.52, 0.85, 7.9 + Math.sin(a) * 0.52);
      arm.rotation.y = a;
    }
    this._interact(turn, 'lobby_turnstile', 'Projít turniketem s kartou');

    this._portal(2.1, 2.45, -9.85, 1.22, 12, 'lockers', 'Do šaten', Math.PI / 2);
    this._portal(2.8, 2.5, 0, 1.25, 4.15, 'wavepool', 'K vlnovému bazénu');
    this._portal(2.4, 2.5, 0, 1.25, 19.85, 'parking', 'Zpět na parkoviště');

    this._lamp(-4.2, 4.9, 12, 0xc4d4e4, 2.6);
    this._lamp(4.2, 4.9, 12, 0xc4d4e4, 2.6);
    this._lamp(0, 4.9, 16.2, 0x88c8b0, 2.0);
    this._lamp(-3.2, 2.9, 14.6, 0xffd090, 1.5, 0.22);
    this._lamp(0, 4.7, 8, 0xa8c4d8, 1.8);

    this._box(2.1, 0.42, 0.65, this.mats.make('metal', { repeat: [1, 1], color: 0x5a6a78 }), 6.4, 0.32, 10, { collide: false });
    this._box(2.1, 0.08, 0.65, new THREE.MeshStandardMaterial({ color: 0x2a3038 }), 6.4, 0.56, 10, { collide: false });
    this._cyl(0.22, 0.18, 0.32, this.mats.make('concrete', { repeat: [1, 1], color: 0x6a4a32 }), 8.4, 0.18, 17.6);
    const bush = new THREE.Mesh(new THREE.SphereGeometry(0.42, 12, 10), new THREE.MeshStandardMaterial({ color: 0x1c6a38, roughness: 0.85, flatShading: true }));
    bush.position.set(8.4, 0.62, 17.6);
    this.group.add(bush);
  }

  _lockers() {
    this.zoneMarkers.lockers = new THREE.Vector3(-16, 1.65, 12);
    const wall = this.mats.wall([3, 2], 0xb8c4c8);
    const floor = this.mats.wetFloor([5, 5], 0x8aa0a8);
    this._shell(-16, 12, 12, 12, 4.3, wall, floor, { e: 2.2, s: 2.0, n: 2.0 });
    this._lamp(-16, 4.05, 12, 0xb8d0e8, 2.8);
    this._lamp(-19, 3.6, 10, 0x88e0aa, 1.6);

    for (let i = 0; i < 10; i++) {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const lx = -20.15 + col * 1.12;
      const lz = 7.7 + row * 1.32;
      const locker = this._box(1.02, 2.12, 0.48, this.mats.make('metal', { repeat: [1, 2], color: 0x3e4e58, metalness: 0.92, roughness: 0.32 }), lx, 1.08, lz);
      this._box(0.05, 0.32, 0.07, this.mats.make('metal', { repeat: [1, 1], color: 0xc0d0e0 }), lx + 0.38, 1.08, lz + 0.26, { collide: false });
      if (i === 3) this._interact(locker, 'lockers_117', 'Otevřít skříňku 117');
    }

    const cart = this._box(1.3, 0.12, 0.62, this.mats.make('metal', { repeat: [1, 1], color: 0x8899aa }), -14, 0.55, 9);
    this._box(1.25, 0.5, 0.07, this.mats.make('metal', { repeat: [1, 1] }), -14, 0.82, 8.74, { collide: false });
    this._cyl(0.07, 0.06, 0.2, new THREE.MeshStandardMaterial({ color: 0x2080c0 }), -14.3, 0.74, 9);
    this._interact(cart, 'lockers_cart', 'Prohledat úklidový vozík');

    const mirror = this._box(1.55, 1.95, 0.05, new THREE.MeshPhysicalMaterial({
      color: 0xc8e4ec, metalness: 0.95, roughness: 0.06, clearcoat: 1, envMapIntensity: 1.8,
    }), -16, 1.55, 6.25);
    this._interact(mirror, 'lockers_mirror', 'Otřít zrcadlo');

    const drain = this._box(0.68, 0.04, 0.68, this.mats.make('metal', { repeat: [1, 1], color: 0x1a1e24 }), -13, 0.03, 15);
    this._interact(drain, 'lockers_drain', 'Naklonit se k odtoku');

    this._portal(1.6, 2.25, -10.15, 1.12, 12, 'lobby', 'Zpět do haly', Math.PI / 2);
    this._portal(1.55, 2.2, -16, 1.1, 17.85, 'kids', 'K dětskému klubu');
    this._portal(1.55, 2.2, -12.2, 1.1, 6.15, 'wavepool', 'K vlnovému bazénu');
  }

  _wavePool() {
    this.zoneMarkers.wavepool = new THREE.Vector3(0, 1.65, -8);
    const deck = this.mats.make('deck', { repeat: [8, 6], roughness: 0.7, env: 0.7, color: 0xc8c4bc });
    this._floor(36, 30, 0.01, deck, 0, -10);

    const mosaic = this.mats.mosaic([10, 10], 0x7aadb8);
    this._box(20, 1.35, 0.38, mosaic, 0, 0.28, -2.2);
    this._box(20, 1.35, 0.38, mosaic, 0, 0.28, -20.8);
    this._box(0.38, 1.35, 18.6, mosaic, -10, 0.28, -11.5);
    this._box(0.38, 1.35, 18.6, mosaic, 10, 0.28, -11.5);
    this._box(20.5, 0.1, 0.5, this.mats.make('concrete', { repeat: [6, 1], color: 0xd0ccc4 }), 0, 1.0, -2.15, { collide: false });
    this._box(20.5, 0.1, 0.5, this.mats.make('concrete', { repeat: [6, 1], color: 0xd0ccc4 }), 0, 1.0, -20.85, { collide: false });
    this._floor(19.2, 18.2, -1.15, mosaic, 0, -11.5);

    this.water = createWater(18.6, 17.6, 0.34);
    this.water.mesh.position.set(0, 0.34, -11.5);
    this.water.deep.position.set(0, -1.0, -11.5);
    this.water.glow.position.set(0, 1.15, -11.5);
    this.group.add(this.water.deep);
    this.group.add(this.water.mesh);
    this.group.add(this.water.glow);
    this.dynamicLights.push(this.water.glow);

    const grate = this._box(1.45, 0.1, 1.45, this.mats.make('metal', { repeat: [1, 1], color: 0x1a1e28, metalness: 0.95 }), -4, 0.36, -15.2);
    for (let i = 0; i < 6; i++) {
      this._box(1.3, 0.03, 0.05, this.mats.make('metal', { repeat: [1, 1] }), -4, 0.42, -15.7 + i * 0.2, { collide: false });
    }
    this._interact(grate, 'wave_grate', 'Jít k sacímu koši (sektor B)');
    const grate2 = this._box(1.15, 0.04, 1.15, this.mats.make('metal', { repeat: [1, 1], color: 0x11151c }), -4, 0.45, -15.2, { collide: false });
    this._interact(grate2, 'wave_grate_again', 'Znovu se podívat do mřížky');

    this._cyl(0.11, 0.13, 2.85, this.mats.make('metal', { repeat: [1, 2] }), 5.2, 1.42, -5.2);
    for (let i = 0; i < 7; i++) {
      this._box(0.4, 0.04, 0.05, this.mats.make('metal', { repeat: [1, 1] }), 4.95, 0.35 + i * 0.32, -5.2, { collide: false });
    }
    this._box(1.3, 0.08, 1.3, this.mats.make('metal', { repeat: [1, 1] }), 5.2, 2.62, -5.2, { collide: false });
    const seat = this._box(0.95, 0.12, 0.95, new THREE.MeshStandardMaterial({ color: 0xc44828, roughness: 0.5 }), 5.2, 2.75, -5.2);
    const umbrella = new THREE.Mesh(new THREE.ConeGeometry(0.95, 0.32, 12), new THREE.MeshStandardMaterial({ color: 0xd8dde4, roughness: 0.65, side: THREE.DoubleSide }));
    umbrella.position.set(5.2, 4.0, -5.2);
    this.group.add(umbrella);
    this._interact(seat, 'wave_lifeguard_chair', 'Prohledat plavčíkovu kukaň');

    const cam = this._box(0.38, 0.28, 0.48, this.mats.make('metal', { repeat: [1, 1], color: 0x2a2e34 }), 0, 3.45, -3.4, { collide: false });
    this._interact(cam, 'wave_photo', 'Vyfotit bazén pro pojišťovnu');

    const steps = this._box(2.3, 0.32, 1.15, mosaic, 0, 0.16, -3.6);
    this._interact(steps, 'wave_steps', 'Sesednout na schody bazénu');

    const lookTower = this._box(0.7, 0.7, 0.7, new THREE.MeshStandardMaterial({ color: 0x224466, transparent: true, opacity: 0.02 }), 12.2, 1.2, -8);
    this._interact(lookTower, 'wave_tower_look', 'Zvednout hlavu k tobogánové věži');

    this._portal(2.1, 2.35, 0, 1.18, -1.9, 'lobby', 'Zpět do haly');
    this._portal(2.0, 2.3, -12.4, 1.15, -5, 'lockers', 'Do šaten');
    this._portal(2.0, 2.3, 12.4, 1.15, -9.5, 'tower', 'Na tobogánovou věž');
    this._portal(2.0, 2.3, 9.5, 1.15, -20.4, 'kids', 'K dětskému klubu');
    this._portal(2.0, 2.3, 8.2, 1.15, -4.2, 'office', 'Do plavčíkovy kanceláře');

    for (let i = 0; i < 5; i++) {
      const x = -12.5 + i * 1.25;
      this._box(0.07, 0.42, 1.65, this.mats.make('metal', { repeat: [1, 1] }), x - 0.28, 0.24, -1.2, { collide: false });
      this._box(0.07, 0.42, 1.65, this.mats.make('metal', { repeat: [1, 1] }), x + 0.28, 0.24, -1.2, { collide: false });
      this._box(0.68, 0.1, 1.75, new THREE.MeshStandardMaterial({ color: 0xb8954a, roughness: 0.62 }), x, 0.4, -1.2, { collide: false });
    }
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.44, 0.09, 10, 24), new THREE.MeshStandardMaterial({ color: 0xd03030, roughness: 0.45 }));
    ring.position.set(9.4, 1.55, -3.6);
    ring.rotation.y = Math.PI / 2;
    this.group.add(ring);

    this._lamp(0, 5.2, -6, 0x66d8e0, 5.2, 0.55);
    this._lamp(-6.5, 4.0, -12, 0x44e0aa, 2.1);
    this._lamp(6.5, 4.0, -12, 0x44e0aa, 2.1);
    this._lamp(-4, 1.15, -15.2, 0xff6644, 1.3, 0.18);

    const steamGeo = new THREE.BufferGeometry();
    const sc = 140;
    const spos = new Float32Array(sc * 3);
    for (let i = 0; i < sc; i++) {
      spos[i * 3] = (Math.random() - 0.5) * 16;
      spos[i * 3 + 1] = 0.4 + Math.random() * 1.3;
      spos[i * 3 + 2] = -11.5 + (Math.random() - 0.5) * 15;
    }
    steamGeo.setAttribute('position', new THREE.BufferAttribute(spos, 3));
    this.steam = new THREE.Points(steamGeo, new THREE.PointsMaterial({
      color: 0xb8d8e0, size: 0.2, transparent: true, opacity: 0.2, depthWrite: false,
    }));
    this.group.add(this.steam);

    for (let i = 0; i < 12; i++) {
      const f = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 10), new THREE.MeshStandardMaterial({
        color: i % 2 ? 0xe8e8e8 : 0xd03030, roughness: 0.35,
      }));
      f.position.set(-6.5 + i * 1.1, 0.38, -8.4);
      this.group.add(f);
    }
  }

  _tower() {
    this.zoneMarkers.tower = new THREE.Vector3(16.5, 1.65, -10);
    const metal = this.mats.make('metal', { repeat: [2, 2], color: 0x6a7a88, metalness: 0.95, roughness: 0.3 });
    this._box(8, 0.32, 8, metal, 16.5, 6, -12, { collide: false });
    this._box(0.48, 6, 0.48, metal, 13.4, 3, -9);
    this._box(0.48, 6, 0.48, metal, 19.6, 3, -9);
    this._box(0.48, 6, 0.48, metal, 13.4, 3, -15);
    this._box(0.48, 6, 0.48, metal, 19.6, 3, -15);
    for (let i = 0; i < 10; i++) {
      this._box(2.15, 0.22, 0.85, metal, 12.6, 0.2 + i * 0.55, -7 - i * 0.35, { collide: false });
    }
    const colors = [0x2266aa, 0xaa2222, 0x111111, 0xddaa22];
    for (let i = 0; i < 4; i++) {
      const tube = new THREE.Mesh(
        new THREE.CylinderGeometry(0.52, 0.52, 7.2, 18, 1, true),
        new THREE.MeshPhysicalMaterial({ color: colors[i], side: THREE.DoubleSide, roughness: 0.28, metalness: 0.45, clearcoat: 0.6, envMapIntensity: 1.3 }),
      );
      tube.position.set(14.4 + i * 1.32, 4.15, -14.2);
      tube.rotation.z = 0.55;
      tube.rotation.y = -0.4;
      this.group.add(tube);
    }
    const blackhole = this._box(1.15, 1.15, 1.15, new THREE.MeshStandardMaterial({ color: 0x050505, emissive: 0x220011, emissiveIntensity: 0.45 }), 15.2, 6.75, -14);
    this._interact(blackhole, 'tower_blackhole', 'Naklonit se do Černé díry');
    const radio = this._box(0.38, 0.22, 0.22, this.mats.make('metal', { repeat: [1, 1], color: 0x333333 }), 17.2, 6.28, -11);
    this._interact(radio, 'tower_radio', 'Zkusit vysílačku');
    const lookDown = this._box(1, 0.35, 1, metal, 16.5, 6.22, -10);
    this._interact(lookDown, 'tower_look_down', 'Podívat se dolů na bazén');
    this._portal(2, 2, 12.2, 1.1, -8, 'wavepool', 'Dolů k vlnovému bazénu');
    this._portal(2, 2, 18.2, 1.1, -18, 'kids', 'Přes lávku k dětskému klubu');
  }

  _kids() {
    this.zoneMarkers.kids = new THREE.Vector3(8, 1.65, -28);
    const wall = this.mats.wall([3, 2], 0xe0d4c4);
    const floor = this.mats.wetFloor([5, 4], 0xc8b8a0);
    this._shell(8, -28, 14, 12, 3.9, wall, floor, { n: 2.0, s: 2.0, w: 2.0, e: 2.0 });
    this._lamp(8, 3.55, -28, 0xffe0a0, 2.8);
    this._lamp(4.2, 3.3, -30, 0xffb0c8, 1.4, 0.22);

    const bowl = this._cyl(1.65, 1.85, 0.32, this.mats.mosaic([4, 1], 0xd8c8b0), 8, 0.18, -28);
    this._cyl(0.2, 0.26, 0.85, new THREE.MeshStandardMaterial({ color: 0xe8e0d0 }), 8, 0.68, -28);
    this._cyl(0.82, 0.52, 0.26, new THREE.MeshStandardMaterial({ color: 0xd04050, roughness: 0.42 }), 8, 1.18, -28);
    this._interact(bowl, 'kids_fountain', 'Sáhnout do misky fontánky');

    const drawings = this._box(3.1, 1.45, 0.05, new THREE.MeshStandardMaterial({ map: this.kidsArt, roughness: 0.75 }), 8, 1.85, -22.2);
    this._interact(drawings, 'kids_drawings', 'Prohlédnout dětské obrázky');

    const cabinet = this._box(1.35, 1.75, 0.58, this.mats.make('metal', { repeat: [1, 1], color: 0x556677 }), 12, 0.88, -32);
    this._interact(cabinet, 'kids_cabinet', 'Prohledat skříň animátorů');
    const cabinetEarly = this._box(1.15, 0.38, 0.38, this.mats.make('metal', { repeat: [1, 1], color: 0x445566 }), 12, 1.95, -32);
    this._interact(cabinetEarly, 'kids_cabinet_early', 'Prohledat skříň (navíc)');

    this._portal(1.6, 2.15, 8, 1.08, -22.15, 'wavepool', 'K vlnovému bazénu');
    this._portal(1.6, 2.15, 1.2, 1.08, -26, 'lockers', 'Zpět do šaten', Math.PI / 2);
    this._portal(1.6, 2.15, 14.8, 1.08, -30, 'tower', 'Na tobogánovou věž', Math.PI / 2);
    this._portal(1.6, 2.15, 8, 1.08, -33.85, 'wellness', 'K wellness');

    const cubeCols = [0xe05050, 0x40a0e0, 0xf0c020, 0x50c070];
    for (let i = 0; i < 4; i++) {
      this._box(0.42, 0.42, 0.42, new THREE.MeshStandardMaterial({ color: cubeCols[i], roughness: 0.7 }), 5.4 + i * 0.52, 0.24, -25.4, { collide: false });
    }
  }

  _wellness() {
    this.zoneMarkers.wellness = new THREE.Vector3(8, 1.65, -40);
    const wall = this.mats.make('concrete', { repeat: [3, 2], color: 0x8a7a6c, roughness: 0.88 });
    const floor = this.mats.make('wood', { repeat: [4, 3], roughness: 0.55, env: 0.7 });
    this._shell(8, -40, 10, 8, 3.5, wall, floor, { n: 1.8, e: 1.8 });
    this._lamp(8, 3.25, -40, 0xff8844, 1.7, 0.28);
    this._lamp(5.2, 2.4, -42, 0xff6622, 0.85, 0.18);

    const wood = this.mats.make('wood', { repeat: [2, 1], roughness: 0.7 });
    this._box(4.1, 0.1, 0.68, wood, 8, 0.45, -41.2, { collide: false });
    this._box(4.1, 0.1, 0.68, wood, 8, 0.95, -42.0, { collide: false });
    this._box(4.1, 0.1, 0.68, wood, 8, 1.45, -42.8, { collide: false });
    const bench = this._box(3.4, 0.32, 0.52, wood, 8, 0.48, -39.4);
    this._interact(bench, 'well_break', 'Strhnout pásku a vejít / prohledat saunu');

    this._box(0.68, 0.82, 0.52, this.mats.make('metal', { repeat: [1, 1], color: 0x333333 }), 5.2, 0.42, -42.4);
    const heaterGlow = new THREE.PointLight(0xff5522, 1.15, 5, 2);
    heaterGlow.position.set(5.2, 0.88, -42.4);
    this.group.add(heaterGlow);
    this.dynamicLights.push(heaterGlow);

    const phone = this._box(0.16, 0.36, 0.07, this.mats.make('metal', { repeat: [1, 1], color: 0x1a1a22 }), 7, 0.82, -39.5);
    this._interact(phone, 'well_phone', 'Poslechnout hlasovky na Nokii');

    this._portal(1.5, 2.1, 8, 1.05, -36.15, 'kids', 'Zpět do dětského klubu');
    this._portal(1.5, 2.1, 12.85, 1.05, -40, 'office', 'Do plavčíkovy kanceláře', Math.PI / 2);
  }

  _office() {
    this.zoneMarkers.office = new THREE.Vector3(14, 1.65, -4);
    const wall = this.mats.make('plaster', { repeat: [3, 2], color: 0xb8c0c4, roughness: 0.82 });
    const floor = this.mats.wetFloor([3, 3], 0x8a969c);
    this._shell(14, -4, 8, 7, 3.6, wall, floor, { w: 1.8, s: 1.8, n: 1.8 });
    this._lamp(14, 3.35, -4, 0x88ffcc, 2.4);

    const desk = this._box(2.35, 0.88, 1.08, this.mats.make('metal', { repeat: [2, 1], color: 0x4a5a60 }), 14, 0.44, -4);
    this._box(2.45, 0.05, 1.15, this.mats.make('metal', { repeat: [2, 1], color: 0x6a7a80 }), 14, 0.9, -4, { collide: false });
    const folder = this._box(0.38, 0.07, 0.28, new THREE.MeshStandardMaterial({ color: 0xccaa44, emissive: 0x664400, emissiveIntensity: 0.3 }), 14.3, 0.96, -4);
    this._interact(folder, 'office_folder', 'Otevřít složku DŮKAZY');
    this._cyl(0.07, 0.06, 0.11, new THREE.MeshStandardMaterial({ color: 0xc8c8c8 }), 13.5, 1.0, -3.7);

    this._box(1.32, 0.98, 0.32, this.mats.make('metal', { repeat: [1, 1], color: 0x2a2e34 }), 13.2, 1.52, -1.05, { collide: false });
    const monitor = this._box(1.02, 0.7, 0.07, new THREE.MeshStandardMaterial({
      color: 0x0a1a12, emissive: 0x1a6644, emissiveIntensity: 0.95, roughness: 0.25,
    }), 13.2, 1.52, -0.88);
    this._interact(monitor, 'office_cctv', 'Zapnout kamerový monitor');

    const leave = this._box(1.15, 1.75, 0.1, this.mats.make('metal', { repeat: [1, 1], color: 0xaa5555 }), 16.5, 0.88, -4);
    this._interact(leave, 'office_leave_early', 'Vzít důkazy a odejít (volba konce)');

    this._portal(1.5, 2.1, 10.15, 1.05, -4, 'wavepool', 'Zpět k vlnovému bazénu', Math.PI / 2);
    this._portal(1.5, 2.1, 14, 1.05, -7.35, 'filtration', 'Do filtrace');
    this._portal(1.5, 2.1, 14, 1.05, -0.65, 'lobby', 'Utíkat do haly');
  }

  _filtration() {
    this.zoneMarkers.filtration = new THREE.Vector3(0, -2.2, -14);
    const wall = this.mats.make('concrete', { repeat: [4, 2], roughness: 0.9, color: 0x9aa0a4 });
    const floor = this.mats.make('concrete', { repeat: [5, 4], roughness: 0.85, color: 0x7a8084 });
    this._floor(14, 12, -4, floor, 0, -14);
    this._box(14, 4, 0.4, wall, 0, -2, -8);
    this._box(14, 4, 0.4, wall, 0, -2, -20);
    this._box(0.4, 4, 12, wall, -7, -2, -14);
    this._box(0.4, 4, 12, wall, 7, -2, -14);
    this._box(14, 0.28, 12, this.mats.make('plaster', { repeat: [3, 3], color: 0x1a2228 }), 0, 0, -14, { collide: false });
    this._lamp(0, -0.45, -14, 0xff8844, 3.2, 0.45);
    this._lamp(-4, -1.15, -17, 0xffaa66, 1.8);

    for (let i = 0; i < 8; i++) {
      this._box(1.15, 0.07, 0.22, new THREE.MeshStandardMaterial({
        color: i % 2 ? 0x111111 : 0xe8a010, roughness: 0.5,
      }), -5 + i * 1.28, -3.95, -11, { collide: false });
    }
    for (let i = 0; i < 8; i++) {
      this._box(1.9, 0.22, 0.75, wall, 10 - i * 0.15, -0.2 - i * 0.45, -8.5 - i * 0.4, { collide: false });
    }

    const rust = this.mats.make('rust', { repeat: [2, 1], metalness: 0.7, roughness: 0.55, env: 1.1 });
    for (let i = 0; i < 5; i++) {
      const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 5, 14), rust);
      pipe.rotation.z = Math.PI / 2;
      pipe.position.set(0, -1.2, -10 - i * 1.5);
      this.group.add(pipe);
      const flange = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.055, 8, 16), this.mats.make('metal', { repeat: [1, 1] }));
      flange.rotation.y = Math.PI / 2;
      flange.position.set(-2.2, -1.2, -10 - i * 1.5);
      this.group.add(flange);
    }

    const valves = [
      ['valve_a', 'Otočit ventil A', -3],
      ['valve_b', 'Otočit ventil B', -1],
      ['valve_c_correct', 'Otočit ventil C (správně)', 1],
      ['valve_c_early', 'Otočit ventil C hned (špatně!)', 2.2],
      ['valve_d', 'Zavřít bypass D a odejít', 3.5],
    ];
    for (const [id, label, x] of valves) {
      const stem = this._cyl(0.08, 0.1, 0.55, this.mats.make('metal', { repeat: [1, 1] }), x, -1.55, -12);
      const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.26, 0.045, 8, 18), this.mats.make('metal', { repeat: [1, 1], color: 0xc03030 }));
      wheel.position.set(x, -1.2, -12);
      wheel.rotation.x = Math.PI / 2;
      this.group.add(wheel);
      this._interact(stem, id, label);
    }

    const panel = this._box(1.3, 1.85, 0.26, this.mats.make('metal', { repeat: [1, 2], color: 0x2a3540 }), -4.5, -2.2, -17);
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 4; c++) {
        const on = (r + c) % 3 !== 0;
        this._box(0.16, 0.24, 0.07, new THREE.MeshStandardMaterial({ color: on ? 0xd0d8e0 : 0x334044 }), -5.0 + c * 0.26, -1.5 - r * 0.28, -16.84, { collide: false });
      }
    }
    this._interact(panel, 'filter_code', 'Zadat kód do skříně jističů');

    const listen = this._box(1.55, 0.08, 1.55, this.mats.make('metal', { repeat: [1, 1], color: 0x1a1e24 }), 3, -3.95, -17);
    this._interact(listen, 'filter_listen', 'Poslouchat přepad');

    const flee = this._box(1.35, 2, 0.1, this.mats.make('metal', { repeat: [1, 1], color: 0xaa4444 }), 0, -2.5, -8.25);
    this._interact(flee, 'filter_flee', 'Vyběhnout ven bez uzavření');
    this._portal(1.5, 2, 5, -2.5, -8.25, 'office', 'Zpět do kanceláře');
    this._portal(1.5, 2, -5, -2.5, -8.25, 'lobby', 'Utíkat do haly');
  }

  _atmosphere() {
    const dustGeo = new THREE.BufferGeometry();
    const n = 220;
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 48;
      pos[i * 3 + 1] = Math.random() * 7 - 1.5;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 58;
    }
    dustGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    this.dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({
      color: 0x88aacc, size: 0.035, transparent: true, opacity: 0.28,
    }));
    this.group.add(this.dust);

    for (const [x, z] of [[2, 10], [-4, 15], [1, -6], [-8, -12], [6, -27], [0, 18]]) {
      const p = new THREE.Mesh(
        new THREE.CircleGeometry(0.55 + Math.random() * 0.4, 16),
        new THREE.MeshPhysicalMaterial({
          color: 0x1a4050, transparent: true, opacity: 0.42, metalness: 0.75, roughness: 0.12, clearcoat: 1,
        }),
      );
      p.rotation.x = -Math.PI / 2;
      p.position.set(x, 0.025, z);
      this.group.add(p);
    }
  }

  update(t, tension = 0.2, playerPos = null, engine = null) {
    updateWater(this.water, t);
    for (const l of this.dynamicLights) {
      if (l.userData?.baseIntensity != null && l.color.g > 0.7 && l.color.r < 0.55) {
        l.intensity = l.userData.baseIntensity * (0.88 + Math.sin(t * 2.4 + l.position.x) * 0.12);
      }
    }
    if (this.dust) this.dust.rotation.y = t * 0.02;
    if (this.steam) {
      this.steam.rotation.y = t * 0.05;
      const arr = this.steam.geometry.attributes.position.array;
      for (let i = 0; i < arr.length; i += 3) {
        arr[i + 1] += Math.sin(t + i) * 0.0015;
        if (arr[i + 1] > 2.2) arr[i + 1] = 0.35;
      }
      this.steam.geometry.attributes.position.needsUpdate = true;
    }
    for (const obj of this.interactables) {
      const m = obj.userData.marker;
      if (!m) continue;
      if (m.userData.baseY == null) m.userData.baseY = m.position.y;
      m.rotation.y = t * 2;
      m.position.y = m.userData.baseY + Math.sin(t * 3 + m.position.x) * 0.06;
      if (engine) {
        const id = obj.userData.interactId;
        const spent = engine.flag(`done_${id}`);
        const dist = playerPos ? playerPos.distanceTo(m.position) : 99;
        const near = dist < 5.5;
        m.visible = !spent && near;
        obj.visible = obj.userData.interactKind === 'exit' ? true : !spent;
      }
    }
    updateWatcher(this.watcher, tension, t, playerPos);
  }

  teleportPlayer(player, locationId) {
    const m = this.zoneMarkers[locationId];
    if (!m) return;
    player.baseY = Math.max(0, m.y - 1.65);
    if (locationId === 'filtration') player.baseY = -4;
    player.position.x = m.x;
    player.position.z = m.z;
    player.position.y = player.baseY + player.eyeHeight;
    player.syncCamera();
  }
}
