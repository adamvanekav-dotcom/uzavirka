import * as THREE from 'three';
import {
  makeFloorTile,
  makeWallTile,
  makeConcrete,
  makeMetal,
  makeNeonSign,
  makePlaster,
} from './textures.js';
import { createWater, updateWater } from './water.js';
import { createWatcher, updateWatcher } from './Watcher.js';

/**
 * Connected night aquapark. Interactables use userData:
 * - interactId + interactKind 'action' → story action id
 * - interactKind 'exit' → location id for engine.go
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

    this.floorTex = makeFloorTile(512);
    this.floorTex.repeat.set(8, 8);
    this.wallTex = makeWallTile(512);
    this.wallTex.repeat.set(4, 2);
    this.concreteTex = makeConcrete(512);
    this.concreteTex.repeat.set(6, 6);
    this.metalTex = makeMetal(256);
    this.plasterTex = makePlaster(256);
    this.plasterTex.repeat.set(3, 3);
    this.neonTex = makeNeonSign('ATLANTIS WAVE', 1024);
  }

  build() {
    this._lighting();
    this._parkingAndLobby();
    this._lockers();
    this._wavePool();
    this._tower();
    this._kids();
    this._wellness();
    this._office();
    this._filtration();
    this._decor();
    this.watcher = createWatcher();
    this.group.add(this.watcher);
    return this;
  }

  _matFloor() {
    const map = this.floorTex.clone();
    map.repeat.copy(this.floorTex.repeat);
    return new THREE.MeshStandardMaterial({
      map,
      roughness: 0.18,
      metalness: 0.22,
      envMapIntensity: 1.2,
    });
  }

  _matWall() {
    const map = this.wallTex.clone();
    map.repeat.copy(this.wallTex.repeat);
    return new THREE.MeshStandardMaterial({
      map,
      roughness: 0.35,
      metalness: 0.08,
    });
  }

  _matConcrete() {
    return new THREE.MeshStandardMaterial({
      map: this.concreteTex,
      roughness: 0.82,
      metalness: 0.04,
    });
  }

  _matMetal(color = 0x9aabbb) {
    return new THREE.MeshStandardMaterial({
      map: this.metalTex,
      color,
      roughness: 0.28,
      metalness: 0.92,
    });
  }

  _matPlaster() {
    return new THREE.MeshStandardMaterial({
      map: this.plasterTex,
      roughness: 0.9,
      metalness: 0.02,
    });
  }

  /** @deprecated use _matFloor */
  _matTile() {
    return this._matFloor();
  }

  _box(w, h, d, mat, x, y, z, opts = {}) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    if (opts.rotY) mesh.rotation.y = opts.rotY;
    this.group.add(mesh);
    if (opts.collide !== false && h > 1.0) {
      mesh.updateMatrixWorld(true);
      this.colliders.push(new THREE.Box3().setFromObject(mesh));
    }
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

  _room(cx, cz, w, d, h, wallMat, floorMat) {
    this._floor(w, d, 0.01, floorMat, cx, cz);
    const t = 0.35;
    this._box(w, h, t, wallMat, cx, h / 2, cz - d / 2);
    this._box(w, h, t, wallMat, cx, h / 2, cz + d / 2);
    this._box(t, h, d, wallMat, cx - w / 2, h / 2, cz);
    this._box(t, h, d, wallMat, cx + w / 2, h / 2, cz);
    const ceil = this._box(w, 0.25, d, new THREE.MeshStandardMaterial({ color: 0x0a1016, roughness: 1 }), cx, h, cz, { collide: false });
    return ceil;
  }

  _lamp(x, y, z, color = 0xaaccff, intensity = 2.2, size = 0.35) {
    const bulb = new THREE.Mesh(
      new THREE.BoxGeometry(size * 2.2, 0.08, size),
      new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity: 2.5,
        roughness: 0.4,
      }),
    );
    bulb.position.set(x, y, z);
    this.group.add(bulb);
    const l = new THREE.PointLight(color, intensity, 18, 1.4);
    l.position.set(x, y - 0.15, z);
    l.userData.baseIntensity = intensity;
    this.group.add(l);
    this.dynamicLights.push(l);
    return l;
  }

  _interact(mesh, id, label, kind = 'action') {
    mesh.userData.interactId = id;
    mesh.userData.interactLabel = label;
    mesh.userData.interactKind = kind;
    mesh.userData.baseEmissive = mesh.material?.emissive?.clone?.() || new THREE.Color(0x000000);
    mesh.userData.baseEmissiveIntensity = mesh.material?.emissiveIntensity ?? 0;
    if (mesh.material && 'emissive' in mesh.material) {
      mesh.material.emissive = new THREE.Color(0x0a4050);
      mesh.material.emissiveIntensity = 0.2;
    }
    // floating marker diamond
    const mark = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.08, 0),
      new THREE.MeshStandardMaterial({
        color: 0x7ef0f0,
        emissive: 0x3ad0d0,
        emissiveIntensity: 1.4,
        transparent: true,
        opacity: 0.85,
      }),
    );
    const box = new THREE.Box3().setFromObject(mesh);
    const c = new THREE.Vector3();
    box.getCenter(c);
    mark.position.set(c.x, box.max.y + 0.25, c.z);
    mark.userData.markerFor = id;
    this.group.add(mark);
    mesh.userData.marker = mark;
    this.interactables.push(mesh);
    return mesh;
  }

  _lighting() {
    this.scene.background = new THREE.Color(0x0a1520);
    this.scene.fog = new THREE.FogExp2(0x0c1a24, 0.008);

    this.scene.add(new THREE.AmbientLight(0x6a8a9a, 1.05));
    this.scene.add(new THREE.HemisphereLight(0xb0d0e8, 0x2a1810, 0.75));

    const moon = new THREE.DirectionalLight(0xd0e4f8, 1.35);
    moon.position.set(-20, 50, 18);
    moon.castShadow = true;
    moon.shadow.mapSize.set(2048, 2048);
    moon.shadow.camera.left = -55;
    moon.shadow.camera.right = 55;
    moon.shadow.camera.top = 55;
    moon.shadow.camera.bottom = -55;
    moon.shadow.bias = -0.0002;
    this.scene.add(moon);
  }

  _parkingAndLobby() {
    this.zoneMarkers.parking = new THREE.Vector3(0, 1.65, 24);
    this.zoneMarkers.lobby = new THREE.Vector3(0, 1.65, 12);

    this._floor(36, 20, 0, this._matConcrete(), 0, 24);

    const wall = this._matWall();
    this._floor(20, 16, 0.01, this._matFloor(), 0, 12);
    this._box(20, 5, 0.4, wall, 0, 2.5, 20);
    this._box(0.4, 5, 16, wall, -10, 2.5, 12);
    this._box(0.4, 5, 16, wall, 10, 2.5, 12);
    this._box(7, 5, 0.4, wall, -6.5, 2.5, 4);
    this._box(7, 5, 0.4, wall, 6.5, 2.5, 4);
    this._box(20, 0.3, 16, this._matPlaster(), 0, 5, 12, { collide: false });

    // skirting boards
    this._box(20, 0.12, 0.08, this._matMetal(0x667788), 0, 0.06, 19.78, { collide: false });
    this._box(20, 0.12, 0.08, this._matMetal(0x667788), 0, 0.06, 4.22, { collide: false });

    // door frames
    this._doorFrame(0, 4.15, 2.8, 2.6);
    this._doorFrame(-9.85, 12, 1.8, 2.4, Math.PI / 2);

    const sign = new THREE.Mesh(
      new THREE.PlaneGeometry(9, 1.5),
      new THREE.MeshStandardMaterial({
        map: this.neonTex,
        emissiveMap: this.neonTex,
        emissive: 0xffffff,
        emissiveIntensity: 1.6,
      }),
    );
    sign.position.set(0, 4.3, 20.25);
    sign.rotation.y = Math.PI;
    this.group.add(sign);

    const desk = this._box(4.2, 1.05, 1.1, this._matMetal(0x7a8a98), -3.2, 0.52, 14.5);
    // desk top detail
    this._box(4.3, 0.06, 1.2, this._matMetal(0xa0b0c0), -3.2, 1.08, 14.5, { collide: false });
    this._interact(desk, 'lobby_drawer', 'Otevřít šuplík u recepce');

    const flyer = this._box(0.35, 0.02, 0.28, new THREE.MeshStandardMaterial({ color: 0xe8d9a0, roughness: 0.55 }), -2.2, 1.12, 14.5);
    this._interact(flyer, 'lobby_flyer', 'Sebrat leták');

    const book = this._box(0.45, 0.07, 0.32, new THREE.MeshStandardMaterial({ color: 0x6a3040, roughness: 0.7 }), -1.2, 1.12, 14.5);
    this._interact(book, 'lobby_guest_book', 'Otevřít knihu přání');

    const batt = this._box(0.22, 0.08, 0.14, new THREE.MeshStandardMaterial({ color: 0x1a1a1a, emissive: 0x1a6a1a, emissiveIntensity: 0.7 }), -3.9, 1.12, 14.5);
    this._interact(batt, 'lobby_batteries_fix', 'Vzít baterie');

    const mapBoard = this._box(2.4, 1.5, 0.08, this._matMetal(0x445566), 5, 1.9, 4.3);
    this._interact(mapBoard, 'lobby_map', 'Prohlédnout mapu areálu');

    const vending = this._box(1.15, 2.1, 0.75, this._matMetal(0x556677), 7.5, 1.05, 16);
    this._interact(vending, 'lobby_vending', 'Kopnout do automatu');

    const turn = this._box(1.6, 1.15, 0.35, this._matMetal(0xaabbcc), 0, 0.57, 8.2);
    this._interact(turn, 'lobby_turnstile', 'Projít turniketem s kartou');

    const toLockers = this._box(1.7, 2.3, 0.12, this._matMetal(0x779999), -9.85, 1.15, 12);
    this._interact(toLockers, 'lockers', 'Do šaten', 'exit');

    const toPool = this._box(2.8, 2.5, 0.1, this._matMetal(0x668899), 0, 1.25, 4.15);
    this._interact(toPool, 'wavepool', 'K vlnovému bazénu', 'exit');

    const toParking = this._box(2.2, 2.5, 0.1, this._matMetal(0x667788), 0, 1.25, 19.75);
    this._interact(toParking, 'parking', 'Zpět na parkoviště', 'exit');

    this._lamp(-4, 4.7, 12, 0xc8e8ff, 4.5);
    this._lamp(4, 4.7, 12, 0xc8e8ff, 4.5);
    this._lamp(0, 4.7, 16, 0x98ffdd, 3.5);
    this._lamp(-3, 3.2, 14.5, 0xffe8b0, 2.4, 0.25);
    this._lamp(0, 4.5, 8, 0xaadfff, 3.0);
  }

  _doorFrame(x, z, w, h, rotY = 0) {
    const m = this._matMetal(0x8899aa);
    const t = 0.08;
    const left = this._box(t, h, t, m, x - w / 2, h / 2, z, { collide: false });
    const right = this._box(t, h, t, m, x + w / 2, h / 2, z, { collide: false });
    const top = this._box(w + t * 2, t, t, m, x, h, z, { collide: false });
    left.rotation.y = right.rotation.y = top.rotation.y = rotY;
  }

  _lockers() {
    this.zoneMarkers.lockers = new THREE.Vector3(-16, 1.65, 12);
    const wall = this._matWall();
    this._floor(12, 12, 0.01, this._matFloor(), -16, 12);
    this._box(12, 4.2, 0.35, wall, -16, 2.1, 6);
    this._box(12, 4.2, 0.35, wall, -16, 2.1, 18);
    this._box(0.35, 4.2, 12, wall, -22, 2.1, 12);
    this._box(0.35, 4.2, 4, wall, -10, 2.1, 8);
    this._box(0.35, 4.2, 4, wall, -10, 2.1, 16);
    this._box(12, 0.25, 12, this._matPlaster(), -16, 4.2, 12, { collide: false });
    this._lamp(-16, 3.9, 12, 0xaaccff, 3.2);
    this._lamp(-19, 3.5, 10, 0x88ffaa, 1.8);

    // locker bank
    for (let i = 0; i < 8; i++) {
      const lx = -20 + (i % 2) * 1.1;
      const lz = 8 + Math.floor(i / 2) * 1.3;
      const locker = this._box(1, 2.2, 0.55, this._matMetal(0x3a4a55), lx, 1.1, lz);
      if (i === 3) this._interact(locker, 'lockers_117', 'Otevřít skříňku 117');
    }

    const cart = this._box(1.4, 1.0, 0.7, this._matMetal(0x8899aa), -14, 0.5, 9);
    this._interact(cart, 'lockers_cart', 'Prohledat úklidový vozík');

    const mirror = this._box(1.6, 2.0, 0.05, new THREE.MeshStandardMaterial({ color: 0xaacccc, metalness: 0.95, roughness: 0.1 }), -16, 1.6, 6.3);
    this._interact(mirror, 'lockers_mirror', 'Otřít zrcadlo');

    const drain = this._box(0.6, 0.05, 0.6, this._matMetal(0x222222), -13, 0.04, 15);
    this._interact(drain, 'lockers_drain', 'Naklonit se k odtoku');

    const backLobby = this._box(1.5, 2.2, 0.1, this._matMetal(0x668888), -10.2, 1.1, 12);
    this._interact(backLobby, 'lobby', 'Zpět do haly', 'exit');

    const toKids = this._box(1.5, 2.2, 0.1, this._matMetal(0x668866), -16, 1.1, 17.8);
    this._interact(toKids, 'kids', 'K dětskému klubu', 'exit');

    const toPool = this._box(1.5, 2.2, 0.1, this._matMetal(0x557788), -12, 1.1, 6.3);
    this._interact(toPool, 'wavepool', 'K vlnovému bazénu', 'exit');
  }

  _wavePool() {
    this.zoneMarkers.wavepool = new THREE.Vector3(0, 1.65, -10);

    // deck
    this._floor(36, 28, 0.01, this._matConcrete(), 0, -10);

    // pool basin walls
    const tile = this._matFloor();
    this._box(18, 1.4, 0.4, tile, 0, 0.3, -4);
    this._box(18, 1.4, 0.4, tile, 0, 0.3, -22);
    this._box(0.4, 1.4, 18, tile, -9, 0.3, -13);
    this._box(0.4, 1.4, 18, tile, 9, 0.3, -13);

    // pool floor
    this._floor(17.2, 17.2, -0.9, tile, 0, -13);

    this.water = createWater(16.5, 16.5, 0.28);
    this.water.mesh.position.set(0, 0.28, -13);
    this.water.deep.position.set(0, -0.55, -13);
    this.water.glow.position.set(0, 1.2, -13);
    this.group.add(this.water.deep);
    this.group.add(this.water.mesh);
    this.group.add(this.water.glow);
    this.dynamicLights.push(this.water.glow);

    // suction grate
    const grate = this._box(1.4, 0.08, 1.4, this._matMetal(0x222833), -4, 0.32, -16);
    this._interact(grate, 'wave_grate', 'Jít k sacímu koši (sektor B)');
    const grate2 = this._box(1.2, 0.05, 1.2, this._matMetal(0x11151c), -4, 0.33, -16, { collide: false });
    this._interact(grate2, 'wave_grate_again', 'Znovu se podívat do mřížky');

    // lifeguard chair
    const pole = this._box(0.15, 2.8, 0.15, this._matMetal(), 5, 1.4, -7);
    const seat = this._box(1.1, 0.15, 1.1, this._matMetal(0xcc5533), 5, 2.7, -7);
    this._interact(seat, 'wave_lifeguard_chair', 'Prohledat plavčíkovu kukaň');

    const cam = this._box(0.4, 0.3, 0.5, this._matMetal(0x333333), 0, 3.5, -5, { collide: false });
    this._interact(cam, 'wave_photo', 'Vyfotit bazén pro pojišťovnu');

    const steps = this._box(2.2, 0.35, 1.2, tile, 0, 0.15, -5.5);
    this._interact(steps, 'wave_steps', 'Sesednout na schody bazénu');

    const lookTower = this._box(0.8, 0.8, 0.8, new THREE.MeshStandardMaterial({ color: 0x224466, transparent: true, opacity: 0.01 }), 12, 1.2, -8);
    this._interact(lookTower, 'wave_tower_look', 'Zvednout hlavu k tobogánové věži');

    // exits
    this._interact(this._box(2, 2.3, 0.12, this._matMetal(0x557788), 0, 1.15, -3.7), 'lobby', 'Zpět do haly', 'exit');
    this._interact(this._box(2, 2.3, 0.12, this._matMetal(0x668888), -12, 1.15, -6), 'lockers', 'Do šaten', 'exit');
    this._interact(this._box(2, 2.3, 0.12, this._matMetal(0x886655), 12, 1.15, -10), 'tower', 'Na tobogánovou věž', 'exit');
    this._interact(this._box(2, 2.3, 0.12, this._matMetal(0x668866), 10, 1.15, -20), 'kids', 'K dětskému klubu', 'exit');
    this._interact(this._box(2, 2.3, 0.12, this._matMetal(0xaa8866), 8, 1.15, -6), 'office', 'Do plavčíkovy kanceláře', 'exit');

    // lounge chairs
    for (let i = 0; i < 5; i++) {
      this._box(0.7, 0.35, 1.8, new THREE.MeshStandardMaterial({ color: 0xc4a35a, roughness: 0.7 }), -12 + i * 1.2, 0.25, -2.5, { collide: false });
    }

    this._lamp(0, 4.5, -8, 0x66e0e8, 5.5, 0.6);
    this._lamp(-6, 3.5, -14, 0x44ffaa, 2.2);
    this._lamp(6, 3.5, -14, 0x44ffaa, 2.2);
    this._lamp(-4, 1.2, -16, 0xff6644, 1.4, 0.2);
  }

  _tower() {
    this.zoneMarkers.tower = new THREE.Vector3(16, 1.65, -10);
    const metal = this._matMetal(0x5a6a78);

    // platform structure
    this._box(8, 0.35, 8, metal, 16, 6, -12, { collide: false });
    this._box(0.5, 6, 0.5, metal, 13, 3, -9);
    this._box(0.5, 6, 0.5, metal, 19, 3, -9);
    this._box(0.5, 6, 0.5, metal, 13, 3, -15);
    this._box(0.5, 6, 0.5, metal, 19, 3, -15);

    // stairs (simplified)
    for (let i = 0; i < 10; i++) {
      this._box(2.2, 0.25, 0.9, metal, 12.5, 0.2 + i * 0.55, -7 - i * 0.35, { collide: false });
    }

    // slide tubes
    const colors = [0x2266aa, 0xaa2222, 0x111111, 0xddaa22];
    for (let i = 0; i < 4; i++) {
      const tube = new THREE.Mesh(
        new THREE.CylinderGeometry(0.55, 0.55, 7, 16, 1, true),
        new THREE.MeshStandardMaterial({ color: colors[i], side: THREE.DoubleSide, roughness: 0.35, metalness: 0.4 }),
      );
      tube.position.set(14 + i * 1.35, 4.2, -14);
      tube.rotation.z = 0.55;
      tube.rotation.y = -0.4;
      this.group.add(tube);
    }

    // interact on platform — use elevated trigger near stairs top
    const blackhole = this._box(1.2, 1.2, 1.2, new THREE.MeshStandardMaterial({ color: 0x050505, emissive: 0x220011, emissiveIntensity: 0.4 }), 15, 6.8, -14);
    this._interact(blackhole, 'tower_blackhole', 'Naklonit se do Černé díry');

    const radio = this._box(0.4, 0.25, 0.25, this._matMetal(0x333333), 17, 6.3, -11);
    this._interact(radio, 'tower_radio', 'Zkusit vysílačku');

    const lookDown = this._box(1, 0.4, 1, this._matMetal(0x445566), 16, 6.25, -10);
    this._interact(lookDown, 'tower_look_down', 'Podívat se dolů na bazén');

    this._interact(this._box(2, 2, 0.12, metal, 12, 1.1, -8), 'wavepool', 'Dolů k vlnovému bazénu', 'exit');
    this._interact(this._box(2, 2, 0.12, metal, 18, 1.1, -18), 'kids', 'Přes lávku k dětskému klubu', 'exit');
  }

  _kids() {
    this.zoneMarkers.kids = new THREE.Vector3(8, 1.65, -28);
    const wall = this._matConcrete();
    this._floor(14, 12, 0.01, this._matTile(), 8, -28);
    this._box(14, 3.8, 0.3, wall, 8, 1.9, -22);
    this._box(14, 3.8, 0.3, wall, 8, 1.9, -34);
    this._box(0.3, 3.8, 12, wall, 1, 1.9, -28);
    this._box(0.3, 3.8, 12, wall, 15, 1.9, -28);

    // shallow fountain
    const bowl = new THREE.Mesh(
      new THREE.CylinderGeometry(1.6, 1.8, 0.4, 24),
      this._matTile(),
    );
    bowl.position.set(8, 0.2, -28);
    this.group.add(bowl);
    this._interact(bowl, 'kids_fountain', 'Sáhnout do misky fontánky');

    const drawings = this._box(3, 1.4, 0.05, new THREE.MeshStandardMaterial({ color: 0xf0e6d0 }), 8, 1.8, -22.2);
    this._interact(drawings, 'kids_drawings', 'Prohlédnout dětské obrázky');

    const cabinet = this._box(1.4, 1.8, 0.6, this._matMetal(0x556677), 12, 0.9, -32);
    this._interact(cabinet, 'kids_cabinet', 'Prohledat skříň animátorů');
    const cabinetEarly = this._box(1.2, 0.4, 0.4, this._matMetal(0x445566), 12, 2.0, -32);
    this._interact(cabinetEarly, 'kids_cabinet_early', 'Prohledat skříň (navíc)');

    this._interact(this._box(1.6, 2.1, 0.1, this._matMetal(), 8, 1.05, -22.2), 'wavepool', 'K vlnovému bazénu', 'exit');
    this._interact(this._box(1.6, 2.1, 0.1, this._matMetal(), 1.3, 1.05, -26), 'lockers', 'Zpět do šaten', 'exit');
    this._interact(this._box(1.6, 2.1, 0.1, this._matMetal(), 14.7, 1.05, -30), 'tower', 'Na tobogánovou věž', 'exit');
    this._interact(this._box(1.6, 2.1, 0.1, this._matMetal(0x886655), 8, 1.05, -33.8), 'wellness', 'K wellness', 'exit');

    // toys
    for (let i = 0; i < 6; i++) {
      const toy = new THREE.Mesh(
        new THREE.SphereGeometry(0.18, 12, 12),
        new THREE.MeshStandardMaterial({ color: new THREE.Color().setHSL(i / 6, 0.6, 0.5) }),
      );
      toy.position.set(5 + i * 0.7, 0.2, -26);
      this.group.add(toy);
    }
  }

  _wellness() {
    this.zoneMarkers.wellness = new THREE.Vector3(8, 1.65, -40);
    const wall = this._matConcrete();
    this._floor(10, 8, 0.01, new THREE.MeshStandardMaterial({ color: 0x2a1e16, roughness: 0.85 }), 8, -40);
    this._box(10, 3.5, 0.3, wall, 8, 1.75, -36);
    this._box(10, 3.5, 0.3, wall, 8, 1.75, -44);
    this._box(0.3, 3.5, 8, wall, 3, 1.75, -40);
    this._box(0.3, 3.5, 8, wall, 13, 1.75, -40);

    const bench = this._box(3.5, 0.35, 0.55, new THREE.MeshStandardMaterial({ color: 0x5a3a22 }), 8, 0.5, -40);
    this._interact(bench, 'well_break', 'Strhnout pásku a vejít / prohledat saunu');

    const phone = this._box(0.25, 0.45, 0.12, this._matMetal(0x222222), 7, 0.85, -40);
    this._interact(phone, 'well_phone', 'Poslechnout hlasovky na Nokii');

    this._interact(this._box(1.5, 2.1, 0.1, this._matMetal(), 8, 1.05, -36.2), 'kids', 'Zpět do dětského klubu', 'exit');
    this._interact(this._box(1.5, 2.1, 0.1, this._matMetal(0xaa8866), 12.7, 1.05, -40), 'office', 'Do plavčíkovy kanceláře', 'exit');
  }

  _office() {
    this.zoneMarkers.office = new THREE.Vector3(14, 1.65, -4);
    const wall = this._matConcrete();
    this._floor(8, 7, 0.01, this._matTile(), 14, -4);
    this._box(8, 3.6, 0.3, wall, 14, 1.8, -0.5);
    this._box(8, 3.6, 0.3, wall, 14, 1.8, -7.5);
    this._box(0.3, 3.6, 7, wall, 10, 1.8, -4);
    this._box(0.3, 3.6, 7, wall, 18, 1.8, -4);

    const desk = this._box(2.4, 0.9, 1.1, this._matMetal(0x5a6a70), 14, 0.45, -4);
    const folder = this._box(0.4, 0.08, 0.3, new THREE.MeshStandardMaterial({ color: 0xccaa44, emissive: 0x664400, emissiveIntensity: 0.3 }), 14.3, 0.95, -4);
    this._interact(folder, 'office_folder', 'Otevřít složku DŮKAZY');

    const monitor = this._box(1.2, 0.8, 0.1, new THREE.MeshStandardMaterial({ color: 0x111111, emissive: 0x113322, emissiveIntensity: 0.6 }), 13.2, 1.5, -1);
    this._interact(monitor, 'office_cctv', 'Zapnout kamerový monitor');

    const leave = this._box(1.2, 1.8, 0.1, this._matMetal(0xaa5555), 16.5, 0.9, -4);
    this._interact(leave, 'office_leave_early', 'Vzít důkazy a odejít (volba konce)');

    this._interact(this._box(1.5, 2.1, 0.1, this._matMetal(), 10.2, 1.05, -4), 'wavepool', 'Zpět k vlnovému bazénu', 'exit');
    this._interact(this._box(1.5, 2.1, 0.1, this._matMetal(0x444444), 14, 1.05, -7.3), 'filtration', 'Do filtrace', 'exit');
    this._interact(this._box(1.5, 2.1, 0.1, this._matMetal(), 14, 1.05, -0.7), 'lobby', 'Utíkat do haly', 'exit');
  }

  _filtration() {
    this.zoneMarkers.filtration = new THREE.Vector3(0, -2.2, -14);
    const wall = this._matConcrete();

    // underground room
    this._floor(14, 12, -4, wall, 0, -14);
    this._box(14, 4, 0.4, wall, 0, -2, -8);
    this._box(14, 4, 0.4, wall, 0, -2, -20);
    this._box(0.4, 4, 12, wall, -7, -2, -14);
    this._box(0.4, 4, 12, wall, 7, -2, -14);
    this._box(14, 0.3, 12, new THREE.MeshStandardMaterial({ color: 0x080c10 }), 0, 0, -14, { collide: false });

    // stairs from office side
    for (let i = 0; i < 8; i++) {
      this._box(2, 0.25, 0.8, wall, 10 - i * 0.15, -0.2 - i * 0.45, -8.5 - i * 0.4, { collide: false });
    }

    // pipes
    for (let i = 0; i < 5; i++) {
      const pipe = new THREE.Mesh(
        new THREE.CylinderGeometry(0.28, 0.28, 5, 12),
        this._matMetal(0x6a7a88),
      );
      pipe.rotation.z = Math.PI / 2;
      pipe.position.set(0, -1.2, -10 - i * 1.5);
      this.group.add(pipe);
    }

    // valves A B C D
    const valves = [
      ['valve_a', 'Otočit ventil A', -3],
      ['valve_b', 'Otočit ventil B', -1],
      ['valve_c_correct', 'Otočit ventil C (správně)', 1],
      ['valve_c_early', 'Otočit ventil C hned (špatně!)', 2.2],
      ['valve_d', 'Zavřít bypass D a odejít', 3.5],
    ];
    for (const [id, label, x] of valves) {
      const v = this._box(0.5, 0.5, 0.35, this._matMetal(0xcc3333), x, -1.5, -12);
      this._interact(v, id, label);
    }

    const panel = this._box(1.2, 1.8, 0.25, this._matMetal(0x334455), -4.5, -2.2, -17);
    this._interact(panel, 'filter_code', 'Zadat kód do skříně jističů');

    const listen = this._box(1.5, 0.4, 1.5, this._matMetal(0x222222), 3, -3.9, -17);
    this._interact(listen, 'filter_listen', 'Poslouchat přepad');

    const flee = this._box(1.4, 2, 0.12, this._matMetal(0xaa4444), 0, -2.5, -8.3);
    this._interact(flee, 'filter_flee', 'Vyběhnout ven bez uzavření');

    this._interact(this._box(1.5, 2, 0.12, this._matMetal(), 5, -2.5, -8.3), 'office', 'Zpět do kanceláře', 'exit');
    this._interact(this._box(1.5, 2, 0.12, this._matMetal(), -5, -2.5, -8.3), 'lobby', 'Utíkat do haly', 'exit');
  }

  _decor() {
    // wet puddle decals
    for (const [x, z] of [[2, 10], [-4, 15], [1, -6], [-8, -12], [6, -27], [0, 18], [-2, 8]]) {
      const p = new THREE.Mesh(
        new THREE.CircleGeometry(0.6 + Math.random() * 0.5, 16),
        new THREE.MeshStandardMaterial({
          color: 0x1a4050,
          transparent: true,
          opacity: 0.45,
          metalness: 0.8,
          roughness: 0.15,
        }),
      );
      p.rotation.x = -Math.PI / 2;
      p.position.set(x, 0.02, z);
      this.group.add(p);
    }

    // pool umbrellas
    for (const [x, z] of [[-11, -3], [-8, -3], [11, -4]]) {
      const pole = this._box(0.08, 2.2, 0.08, this._matMetal(), x, 1.1, z, { collide: false });
      const canopy = new THREE.Mesh(
        new THREE.ConeGeometry(1.4, 0.35, 12, 1, true),
        new THREE.MeshStandardMaterial({ color: 0xc45a4a, side: THREE.DoubleSide, roughness: 0.6 }),
      );
      canopy.position.set(x, 2.3, z);
      this.group.add(canopy);
    }

    // fake palm trunks parking
    for (const [x, z] of [[-8, 26], [8, 26], [-12, 22]]) {
      const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.18, 0.25, 3.2, 8),
        new THREE.MeshStandardMaterial({ color: 0x5a4030 }),
      );
      trunk.position.set(x, 1.6, z);
      this.group.add(trunk);
      const leaves = new THREE.Mesh(
        new THREE.SphereGeometry(1.1, 8, 6),
        new THREE.MeshStandardMaterial({ color: 0x1e5a38, flatShading: true }),
      );
      leaves.position.set(x, 3.4, z);
      leaves.scale.y = 0.55;
      this.group.add(leaves);
    }

    // floating dust particles
    const dustGeo = new THREE.BufferGeometry();
    const count = 400;
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 50;
      pos[i * 3 + 1] = Math.random() * 8 - 2;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 60;
    }
    dustGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    this.dust = new THREE.Points(
      dustGeo,
      new THREE.PointsMaterial({ color: 0x88aacc, size: 0.04, transparent: true, opacity: 0.35 }),
    );
    this.group.add(this.dust);
  }

  update(t, tension = 0.2, playerPos = null) {
    updateWater(this.water, t);
    for (const l of this.dynamicLights) {
      if (l.userData?.baseIntensity != null && l.color.g > 0.7 && l.color.r < 0.55) {
        l.intensity = l.userData.baseIntensity * (0.88 + Math.sin(t * 2.4 + l.position.x) * 0.12);
      }
    }
    if (this.dust) this.dust.rotation.y = t * 0.02;
    // bob interact markers
    for (const obj of this.interactables) {
      const m = obj.userData.marker;
      if (!m) continue;
      if (m.userData.baseY == null) m.userData.baseY = m.position.y;
      m.rotation.y = t * 2;
      m.position.y = m.userData.baseY + Math.sin(t * 3 + m.position.x) * 0.06;
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
