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

    const floor = makeFloorTile(512);
    this.floorTex = floor.map;
    this.floorNormal = floor.normalMap;
    this.floorTex.repeat.set(8, 8);
    this.floorNormal.repeat.set(8, 8);

    const wall = makeWallTile(512);
    this.wallTex = wall.map;
    this.wallNormal = wall.normalMap;
    this.wallTex.repeat.set(4, 2);
    this.wallNormal.repeat.set(4, 2);

    const concrete = makeConcrete(512);
    this.concreteTex = concrete.map;
    this.concreteNormal = concrete.normalMap;
    this.concreteTex.repeat.set(6, 6);
    this.concreteNormal.repeat.set(6, 6);

    const metal = makeMetal(256);
    this.metalTex = metal.map;
    this.metalNormal = metal.normalMap;

    const plaster = makePlaster(256);
    this.plasterTex = plaster.map;
    this.plasterNormal = plaster.normalMap;
    this.plasterTex.repeat.set(3, 3);
    this.plasterNormal.repeat.set(3, 3);

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
    const normalMap = this.floorNormal.clone();
    map.repeat.copy(this.floorTex.repeat);
    normalMap.repeat.copy(this.floorNormal.repeat);
    return new THREE.MeshPhysicalMaterial({
      map,
      normalMap,
      normalScale: new THREE.Vector2(1.1, 1.1),
      roughness: 0.1,
      metalness: 0.12,
      clearcoat: 1.0,
      clearcoatRoughness: 0.15,
      reflectivity: 0.55,
      envMapIntensity: 1.35,
    });
  }

  _matWall() {
    const map = this.wallTex.clone();
    const normalMap = this.wallNormal.clone();
    map.repeat.copy(this.wallTex.repeat);
    normalMap.repeat.copy(this.wallNormal.repeat);
    return new THREE.MeshStandardMaterial({
      map,
      normalMap,
      normalScale: new THREE.Vector2(0.9, 0.9),
      roughness: 0.32,
      metalness: 0.06,
      envMapIntensity: 0.9,
    });
  }

  _matConcrete() {
    return new THREE.MeshStandardMaterial({
      map: this.concreteTex,
      normalMap: this.concreteNormal,
      normalScale: new THREE.Vector2(0.7, 0.7),
      roughness: 0.78,
      metalness: 0.04,
      envMapIntensity: 0.6,
    });
  }

  _matMetal(color = 0x9aabbb) {
    return new THREE.MeshStandardMaterial({
      map: this.metalTex,
      normalMap: this.metalNormal,
      color,
      roughness: 0.26,
      metalness: 0.95,
      envMapIntensity: 1.4,
    });
  }

  _matPlaster() {
    return new THREE.MeshStandardMaterial({
      map: this.plasterTex,
      normalMap: this.plasterNormal,
      roughness: 0.88,
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

  _cyl(rTop, rBot, h, mat, x, y, z, opts = {}) {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBot, h, opts.seg || 16), mat);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    if (opts.rotX) mesh.rotation.x = opts.rotX;
    if (opts.rotZ) mesh.rotation.z = opts.rotZ;
    if (opts.rotY) mesh.rotation.y = opts.rotY;
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
    // recessed can
    const can = new THREE.Mesh(
      new THREE.CylinderGeometry(size * 0.7, size * 0.85, 0.18, 16),
      this._matMetal(0x2a323c),
    );
    can.position.set(x, y + 0.05, z);
    this.group.add(can);
    const bulb = new THREE.Mesh(
      new THREE.CircleGeometry(size * 0.55, 16),
      new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity: 3.2,
        roughness: 0.3,
        side: THREE.DoubleSide,
      }),
    );
    bulb.rotation.x = Math.PI / 2;
    bulb.position.set(x, y - 0.02, z);
    this.group.add(bulb);
    const l = new THREE.PointLight(color, intensity, 18, 1.4);
    l.position.set(x, y - 0.2, z);
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

    if (kind === 'exit') {
      // Door slabs must NOT block walking — they are teleport triggers
      mesh.material = mesh.material.clone();
      mesh.material.transparent = true;
      mesh.material.opacity = 0.22;
      mesh.material.depthWrite = false;
      mesh.material.emissive = new THREE.Color(0x2a8090);
      mesh.material.emissiveIntensity = 0.55;
      mesh.castShadow = false;
      const c = new THREE.Vector3();
      mesh.updateMatrixWorld(true);
      new THREE.Box3().setFromObject(mesh).getCenter(c);
      this.colliders = this.colliders.filter((box) => box.getCenter(new THREE.Vector3()).distanceTo(c) > 0.45);
    } else if (mesh.material && 'emissive' in mesh.material) {
      mesh.material.emissive = new THREE.Color(0x0a4050);
      mesh.material.emissiveIntensity = 0.2;
    }

    const mark = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.06, 0),
      new THREE.MeshStandardMaterial({
        color: kind === 'exit' ? 0xa0ffe0 : 0x7ef0f0,
        emissive: kind === 'exit' ? 0x40d0a0 : 0x3ad0d0,
        emissiveIntensity: 1.2,
        transparent: true,
        opacity: 0.7,
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
    this.scene.background = new THREE.Color(0x040a12);
    this.scene.fog = new THREE.FogExp2(0x061018, 0.013);

    this.scene.add(new THREE.AmbientLight(0x3a5060, 0.38));
    this.scene.add(new THREE.HemisphereLight(0x5a7890, 0x120c08, 0.42));

    const moon = new THREE.DirectionalLight(0xa8bdd4, 0.72);
    moon.position.set(-20, 50, 18);
    moon.castShadow = true;
    moon.shadow.mapSize.set(2048, 2048);
    moon.shadow.camera.left = -55;
    moon.shadow.camera.right = 55;
    moon.shadow.camera.top = 55;
    moon.shadow.camera.bottom = -55;
    moon.shadow.bias = -0.00025;
    moon.shadow.normalBias = 0.02;
    this.scene.add(moon);

    // warm contact fill near floor — kills flat cyan wash
    const fill = new THREE.DirectionalLight(0xffc090, 0.18);
    fill.position.set(8, 12, -4);
    this.scene.add(fill);
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

    // Reception desk — multi-piece, not one box
    const deskBody = this._box(4.4, 0.95, 1.15, this._matMetal(0x5a6a78), -3.2, 0.48, 14.5);
    this._box(4.5, 0.07, 1.25, this._matMetal(0x8a9aaa), -3.2, 0.98, 14.5, { collide: false });
    // front panel
    this._box(4.35, 0.7, 0.06, this._matMetal(0x3a4a55), -3.2, 0.4, 15.05, { collide: false });
    // monitor
    this._box(0.08, 0.55, 0.7, this._matMetal(0x222830), -4.4, 1.4, 14.35, { collide: false });
    this._box(0.04, 0.48, 0.62, new THREE.MeshStandardMaterial({
      color: 0x0a1812,
      emissive: 0x1a6644,
      emissiveIntensity: 0.7,
    }), -4.35, 1.4, 14.35, { collide: false });
    // keyboard + mouse
    this._box(0.55, 0.03, 0.22, this._matMetal(0x1a1e22), -3.6, 1.02, 14.7, { collide: false });
    this._box(0.08, 0.03, 0.05, this._matMetal(0x111111), -3.15, 1.02, 14.55, { collide: false });
    this._interact(deskBody, 'lobby_drawer', 'Otevřít šuplík u recepce');

    const flyer = this._box(0.35, 0.02, 0.28, new THREE.MeshStandardMaterial({ color: 0xe8d9a0, roughness: 0.55 }), -2.2, 1.04, 14.5);
    this._interact(flyer, 'lobby_flyer', 'Sebrat leták');

    const book = this._box(0.45, 0.07, 0.32, new THREE.MeshStandardMaterial({ color: 0x6a3040, roughness: 0.7 }), -1.2, 1.04, 14.5);
    this._interact(book, 'lobby_guest_book', 'Otevřít knihu přání');

    const batt = this._box(0.22, 0.08, 0.14, new THREE.MeshStandardMaterial({ color: 0x1a1a1a, emissive: 0x1a6a1a, emissiveIntensity: 0.7 }), -2.7, 1.04, 14.85);
    this._interact(batt, 'lobby_batteries_fix', 'Vzít baterie');

    const mapBoard = this._box(2.4, 1.5, 0.08, this._matMetal(0x445566), 5, 1.9, 4.3);
    this._interact(mapBoard, 'lobby_map', 'Prohlédnout mapu areálu');

    const vending = this._box(1.15, 2.1, 0.75, this._matMetal(0x334048), 7.5, 1.05, 16);
    // glass front + drink rows
    this._box(0.95, 1.35, 0.04, new THREE.MeshPhysicalMaterial({
      color: 0x88aacc,
      transparent: true,
      opacity: 0.28,
      roughness: 0.05,
      metalness: 0.1,
      transmission: 0.4,
    }), 7.5, 1.25, 16.4, { collide: false });
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 3; c++) {
        this._cyl(0.06, 0.06, 0.22, new THREE.MeshStandardMaterial({
          color: [0xc03030, 0x2080c0, 0xe8a020, 0x30a050][r],
          roughness: 0.35,
        }), 7.15 + c * 0.28, 0.55 + r * 0.32, 16.25);
      }
    }
    this._box(0.5, 0.08, 0.35, this._matMetal(0x222830), 7.5, 0.25, 16.35, { collide: false });
    this._interact(vending, 'lobby_vending', 'Kopnout do automatu');

    const turnBase = this._box(0.35, 1.05, 0.35, this._matMetal(0x667788), 0, 0.52, 8.2);
    for (let i = 0; i < 3; i++) {
      const arm = this._box(1.4, 0.06, 0.06, this._matMetal(0xaabbcc), 0.55, 0.85, 8.2, { collide: false });
      arm.rotation.y = (i * Math.PI * 2) / 3;
      arm.position.set(
        Math.cos((i * Math.PI * 2) / 3) * 0.55,
        0.85,
        8.2 + Math.sin((i * Math.PI * 2) / 3) * 0.55,
      );
    }
    this._interact(turnBase, 'lobby_turnstile', 'Projít turniketem s kartou');

    const toLockers = this._box(1.7, 2.3, 0.12, this._matMetal(0x779999), -9.85, 1.15, 12);
    this._interact(toLockers, 'lockers', 'Do šaten', 'exit');

    const toPool = this._box(2.8, 2.5, 0.1, this._matMetal(0x668899), 0, 1.25, 4.15);
    this._interact(toPool, 'wavepool', 'K vlnovému bazénu', 'exit');

    const toParking = this._box(2.2, 2.5, 0.1, this._matMetal(0x667788), 0, 1.25, 19.75);
    this._interact(toParking, 'parking', 'Zpět na parkoviště', 'exit');

    this._lamp(-4, 4.7, 12, 0xa8c8e0, 2.8);
    this._lamp(4, 4.7, 12, 0xa8c8e0, 2.8);
    this._lamp(0, 4.7, 16, 0x78c8a8, 2.2);
    this._lamp(-3, 3.0, 14.5, 0xffd090, 1.6, 0.25);
    this._lamp(0, 4.5, 8, 0x88b8d8, 2.0);

    // wall dirt / water stains
    for (const [x, y, z, ry] of [
      [-9.78, 1.2, 11, Math.PI / 2],
      [9.78, 1.5, 15, -Math.PI / 2],
      [2, 0.8, 19.78, Math.PI],
    ]) {
      const stain = new THREE.Mesh(
        new THREE.PlaneGeometry(1.8, 1.2),
        new THREE.MeshStandardMaterial({
          color: 0x1a2830,
          transparent: true,
          opacity: 0.35,
          roughness: 1,
          depthWrite: false,
        }),
      );
      stain.position.set(x, y, z);
      stain.rotation.y = ry;
      this.group.add(stain);
    }
    // ceiling cornice
    this._box(19.6, 0.12, 0.18, this._matMetal(0x556670), 0, 4.85, 12, { collide: false });
    this._box(0.18, 0.12, 15.5, this._matMetal(0x556670), -9.8, 4.85, 12, { collide: false });
    this._box(0.18, 0.12, 15.5, this._matMetal(0x556670), 9.8, 4.85, 12, { collide: false });
    this._box(2.2, 0.45, 0.7, this._matMetal(0x5a6a78), 6.5, 0.35, 10, { collide: false });
    this._box(2.2, 0.08, 0.7, new THREE.MeshStandardMaterial({ color: 0x2a3038 }), 6.5, 0.6, 10, { collide: false });
    const extinguisher = this._box(0.22, 0.55, 0.22, new THREE.MeshStandardMaterial({ color: 0xb02020, roughness: 0.4, metalness: 0.3 }), -8.5, 1.0, 18.5, { collide: false });
    extinguisher.material.emissive = new THREE.Color(0x400000);
    extinguisher.material.emissiveIntensity = 0.15;
    const poster = this._box(1.4, 1.0, 0.04, new THREE.MeshStandardMaterial({ color: 0xd8c090, roughness: 0.65 }), 9.7, 2.0, 10, { collide: false });
    poster.rotation.y = -Math.PI / 2;
    // plant
    const pot = new THREE.Mesh(
      new THREE.CylinderGeometry(0.25, 0.2, 0.35, 10),
      new THREE.MeshStandardMaterial({ color: 0x6a4a32 }),
    );
    pot.position.set(8.5, 0.2, 18.5);
    this.group.add(pot);
    const bush = new THREE.Mesh(
      new THREE.SphereGeometry(0.45, 10, 8),
      new THREE.MeshStandardMaterial({ color: 0x1e6a3a, flatShading: true }),
    );
    bush.position.set(8.5, 0.7, 18.5);
    this.group.add(bush);
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

      // locker bank — numbered doors with handles
    for (let i = 0; i < 10; i++) {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const lx = -20.2 + col * 1.15;
      const lz = 7.6 + row * 1.35;
      const locker = this._box(1.05, 2.15, 0.5, this._matMetal(0x3e4e5a), lx, 1.1, lz);
      this._box(0.06, 0.35, 0.08, this._matMetal(0xc0d0e0), lx + 0.4, 1.1, lz + 0.28, { collide: false });
      const num = this._box(0.28, 0.18, 0.02, new THREE.MeshStandardMaterial({
        color: 0xe8f0ff,
        emissive: 0x445566,
        emissiveIntensity: 0.3,
      }), lx, 1.85, lz + 0.27, { collide: false });
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

    // pool basin walls + coping
    const tile = this._matFloor();
    this._box(18, 1.4, 0.4, tile, 0, 0.3, -4);
    this._box(18, 1.4, 0.4, tile, 0, 0.3, -22);
    this._box(0.4, 1.4, 18, tile, -9, 0.3, -13);
    this._box(0.4, 1.4, 18, tile, 9, 0.3, -13);
    // stone coping ledge
    this._box(18.6, 0.12, 0.55, this._matConcrete(), 0, 1.05, -4.05, { collide: false });
    this._box(18.6, 0.12, 0.55, this._matConcrete(), 0, 1.05, -21.95, { collide: false });
    this._box(0.55, 0.12, 18.6, this._matConcrete(), -9.05, 1.05, -13, { collide: false });
    this._box(0.55, 0.12, 18.6, this._matConcrete(), 9.05, 1.05, -13, { collide: false });
    // depth stripe on basin wall
    this._box(17.2, 0.18, 0.06, new THREE.MeshStandardMaterial({ color: 0xd8d0c0, roughness: 0.45 }), 0, 0.55, -4.18, { collide: false });
    this._box(17.2, 0.18, 0.06, new THREE.MeshStandardMaterial({ color: 0xd8d0c0, roughness: 0.45 }), 0, 0.55, -21.82, { collide: false });

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

    // suction grate with bars
    const grate = this._box(1.5, 0.1, 1.5, this._matMetal(0x1a1e28), -4, 0.32, -16);
    for (let i = 0; i < 6; i++) {
      this._box(1.35, 0.04, 0.06, this._matMetal(0x445566), -4, 0.38, -16.55 + i * 0.22, { collide: false });
      this._box(0.06, 0.04, 1.35, this._matMetal(0x445566), -4.55 + i * 0.22, 0.39, -16, { collide: false });
    }
    this._interact(grate, 'wave_grate', 'Jít k sacímu koši (sektor B)');
    const grate2 = this._box(1.2, 0.05, 1.2, this._matMetal(0x11151c), -4, 0.42, -16, { collide: false });
    this._interact(grate2, 'wave_grate_again', 'Znovu se podívat do mřížky');

    // lifeguard tower — ladder + platform + seat + umbrella
    this._cyl(0.12, 0.14, 2.9, this._matMetal(0x8899aa), 5, 1.45, -7);
    this._box(0.08, 2.4, 0.08, this._matMetal(0x667788), 4.55, 1.2, -7, { collide: false });
    for (let i = 0; i < 7; i++) {
      this._box(0.42, 0.04, 0.06, this._matMetal(0x8899aa), 4.78, 0.35 + i * 0.32, -7, { collide: false });
    }
    this._box(1.35, 0.08, 1.35, this._matMetal(0x556677), 5, 2.65, -7, { collide: false });
    const seat = this._box(0.95, 0.12, 0.95, new THREE.MeshStandardMaterial({ color: 0xc84828, roughness: 0.55 }), 5, 2.78, -7);
    this._box(0.95, 0.55, 0.1, new THREE.MeshStandardMaterial({ color: 0xa83820, roughness: 0.55 }), 5, 3.1, -7.4, { collide: false });
    this._cyl(0.04, 0.04, 1.1, this._matMetal(), 5, 3.5, -7);
    const umbrella = new THREE.Mesh(
      new THREE.ConeGeometry(0.95, 0.35, 12),
      new THREE.MeshStandardMaterial({ color: 0xd0d8e0, roughness: 0.7, side: THREE.DoubleSide }),
    );
    umbrella.position.set(5, 4.05, -7);
    this.group.add(umbrella);
    this._interact(seat, 'wave_lifeguard_chair', 'Prohledat plavčíkovu kukaň');

    // starting blocks
    for (let i = 0; i < 3; i++) {
      this._box(0.55, 0.45, 0.7, this._matMetal(0xffffff), -2 + i * 2, 0.55, -4.6, { collide: false });
      this._box(0.45, 0.08, 0.35, new THREE.MeshStandardMaterial({ color: 0x2266aa }), -2 + i * 2, 0.8, -4.55, { collide: false });
    }

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

    // lounge chairs with frames
    for (let i = 0; i < 5; i++) {
      const x = -12 + i * 1.2;
      this._box(0.08, 0.45, 1.7, this._matMetal(0x8899aa), x - 0.3, 0.25, -2.5, { collide: false });
      this._box(0.08, 0.45, 1.7, this._matMetal(0x8899aa), x + 0.3, 0.25, -2.5, { collide: false });
      this._box(0.7, 0.12, 1.8, new THREE.MeshStandardMaterial({ color: 0xb8954a, roughness: 0.65 }), x, 0.42, -2.5, { collide: false });
    }
    // life ring on wall
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.45, 0.1, 8, 20),
      new THREE.MeshStandardMaterial({ color: 0xd03030, roughness: 0.5 }),
    );
    ring.position.set(8.7, 1.6, -5);
    ring.rotation.y = Math.PI / 2;
    this.group.add(ring);

    this._lamp(0, 4.5, -8, 0x66e0e8, 5.5, 0.6);
    this._lamp(-6, 3.5, -14, 0x44ffaa, 2.2);
    this._lamp(6, 3.5, -14, 0x44ffaa, 2.2);
    this._lamp(-4, 1.2, -16, 0xff6644, 1.4, 0.2);

    // steam / mist near water surface
    const steamGeo = new THREE.BufferGeometry();
    const sc = 120;
    const spos = new Float32Array(sc * 3);
    for (let i = 0; i < sc; i++) {
      spos[i * 3] = (Math.random() - 0.5) * 14;
      spos[i * 3 + 1] = 0.4 + Math.random() * 1.2;
      spos[i * 3 + 2] = -13 + (Math.random() - 0.5) * 14;
    }
    steamGeo.setAttribute('position', new THREE.BufferAttribute(spos, 3));
    this.steam = new THREE.Points(
      steamGeo,
      new THREE.PointsMaterial({
        color: 0xaad8e0,
        size: 0.22,
        transparent: true,
        opacity: 0.22,
        depthWrite: false,
      }),
    );
    this.group.add(this.steam);

    // lane ropes / float line
    for (let i = 0; i < 12; i++) {
      const float = new THREE.Mesh(
        new THREE.SphereGeometry(0.12, 8, 8),
        new THREE.MeshStandardMaterial({ color: i % 2 ? 0xe8e8e8 : 0xd03030, roughness: 0.4 }),
      );
      float.position.set(-7 + i * 1.15, 0.35, -10);
      this.group.add(float);
    }
    // depth markers
    for (const [label, x] of [[1.2, -7], [1.6, 0], [1.8, 6]]) {
      const sign = this._box(0.5, 0.35, 0.05, this._matMetal(0x226688), x, 1.1, -4.3, { collide: false });
      sign.material = new THREE.MeshStandardMaterial({ color: 0x1a5060, emissive: 0x0a2030, emissiveIntensity: 0.3 });
    }
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
    const wall = this._matWall();
    this._floor(14, 12, 0.01, this._matFloor(), 8, -28);
    this._box(14, 3.8, 0.3, wall, 8, 1.9, -22);
    this._box(14, 3.8, 0.3, wall, 8, 1.9, -34);
    this._box(0.3, 3.8, 12, wall, 1, 1.9, -28);
    this._box(0.3, 3.8, 12, wall, 15, 1.9, -28);
    this._lamp(8, 3.4, -28, 0xffe0a0, 3.0);
    this._lamp(4, 3.2, -30, 0xffb0c8, 1.6, 0.25);
    this._lamp(12, 3.2, -26, 0xb0e0ff, 1.6, 0.25);

    // mushroom fountain
    const bowl = this._cyl(1.7, 1.9, 0.35, this._matTile(), 8, 0.2, -28);
    this._cyl(0.22, 0.28, 0.9, new THREE.MeshStandardMaterial({ color: 0xe8e0d0 }), 8, 0.7, -28);
    this._cyl(0.85, 0.55, 0.28, new THREE.MeshStandardMaterial({ color: 0xd04050, roughness: 0.45 }), 8, 1.2, -28);
    this._interact(bowl, 'kids_fountain', 'Sáhnout do misky fontánky');

    // mini plastic slide
    this._box(0.9, 0.12, 2.4, new THREE.MeshStandardMaterial({ color: 0xf0c020, roughness: 0.4 }), 4.2, 0.85, -30.5, { collide: false, rotY: 0.2 });
    this._box(0.12, 1.1, 0.12, new THREE.MeshStandardMaterial({ color: 0x2080c0 }), 3.7, 0.55, -29.5, { collide: false });
    this._box(0.12, 1.1, 0.12, new THREE.MeshStandardMaterial({ color: 0x2080c0 }), 4.7, 0.55, -29.5, { collide: false });
    this._box(0.12, 0.5, 0.12, new THREE.MeshStandardMaterial({ color: 0x2080c0 }), 3.75, 0.3, -31.4, { collide: false });
    this._box(0.12, 0.5, 0.12, new THREE.MeshStandardMaterial({ color: 0x2080c0 }), 4.65, 0.3, -31.4, { collide: false });

    const drawings = this._box(3.2, 1.5, 0.05, new THREE.MeshStandardMaterial({ color: 0xf5ecd8 }), 8, 1.85, -22.2);
    // crayon blotches on board
    for (let i = 0; i < 8; i++) {
      this._box(0.35, 0.3, 0.02, new THREE.MeshStandardMaterial({
        color: new THREE.Color().setHSL(i / 8, 0.7, 0.55),
      }), 6.8 + (i % 4) * 0.7, 1.5 + Math.floor(i / 4) * 0.55, -22.16, { collide: false });
    }
    this._interact(drawings, 'kids_drawings', 'Prohlédnout dětské obrázky');

    const cabinet = this._box(1.4, 1.8, 0.6, this._matMetal(0x556677), 12, 0.9, -32);
    this._box(1.2, 0.05, 0.55, this._matMetal(0x33444a), 12, 1.2, -32, { collide: false });
    this._box(0.08, 0.25, 0.04, this._matMetal(0xccddee), 12.55, 1.0, -31.68, { collide: false });
    this._interact(cabinet, 'kids_cabinet', 'Prohledat skříň animátorů');
    const cabinetEarly = this._box(1.2, 0.4, 0.4, this._matMetal(0x445566), 12, 2.0, -32);
    this._interact(cabinetEarly, 'kids_cabinet_early', 'Prohledat skříň (navíc)');

    this._interact(this._box(1.6, 2.1, 0.1, this._matMetal(), 8, 1.05, -22.2), 'wavepool', 'K vlnovému bazénu', 'exit');
    this._interact(this._box(1.6, 2.1, 0.1, this._matMetal(), 1.3, 1.05, -26), 'lockers', 'Zpět do šaten', 'exit');
    this._interact(this._box(1.6, 2.1, 0.1, this._matMetal(), 14.7, 1.05, -30), 'tower', 'Na tobogánovou věž', 'exit');
    this._interact(this._box(1.6, 2.1, 0.1, this._matMetal(0x886655), 8, 1.05, -33.8), 'wellness', 'K wellness', 'exit');

    // soft-play cubes + balls
    const cubeCols = [0xe05050, 0x40a0e0, 0xf0c020, 0x50c070];
    for (let i = 0; i < 4; i++) {
      this._box(0.45, 0.45, 0.45, new THREE.MeshStandardMaterial({ color: cubeCols[i], roughness: 0.7 }), 5.5 + i * 0.55, 0.25, -25.5, { collide: false });
    }
    for (let i = 0; i < 6; i++) {
      const toy = new THREE.Mesh(
        new THREE.SphereGeometry(0.18, 12, 12),
        new THREE.MeshStandardMaterial({ color: new THREE.Color().setHSL(i / 6, 0.65, 0.52) }),
      );
      toy.position.set(5 + i * 0.7, 0.2, -26.8);
      this.group.add(toy);
    }
  }

  _wellness() {
    this.zoneMarkers.wellness = new THREE.Vector3(8, 1.65, -40);
    const wall = this._matConcrete();
    const wood = new THREE.MeshStandardMaterial({ color: 0x6a4228, roughness: 0.82 });
    this._floor(10, 8, 0.01, new THREE.MeshStandardMaterial({ color: 0x1e140e, roughness: 0.9 }), 8, -40);
    this._box(10, 3.5, 0.3, wall, 8, 1.75, -36);
    this._box(10, 3.5, 0.3, wall, 8, 1.75, -44);
    this._box(0.3, 3.5, 8, wall, 3, 1.75, -40);
    this._box(0.3, 3.5, 8, wall, 13, 1.75, -40);
    this._box(10, 0.25, 8, new THREE.MeshStandardMaterial({ color: 0x2a1c12, roughness: 0.95 }), 8, 3.4, -40, { collide: false });
    this._lamp(8, 3.2, -40, 0xff8844, 1.8, 0.3);
    this._lamp(5, 2.4, -42, 0xff6622, 0.9, 0.2);

    // tiered sauna benches
    this._box(4.2, 0.12, 0.7, wood, 8, 0.45, -41.2);
    this._box(4.2, 0.12, 0.7, wood, 8, 0.95, -42.0);
    this._box(4.2, 0.12, 0.7, wood, 8, 1.45, -42.8);
    const bench = this._box(3.5, 0.35, 0.55, wood, 8, 0.5, -39.5);
    this._interact(bench, 'well_break', 'Strhnout pásku a vejít / prohledat saunu');

    // heater + stones
    this._box(0.7, 0.85, 0.55, this._matMetal(0x333333), 5.2, 0.45, -42.5);
    for (let i = 0; i < 7; i++) {
      this._cyl(0.08 + (i % 3) * 0.02, 0.1, 0.08, new THREE.MeshStandardMaterial({ color: 0x555560, roughness: 0.9 }), 5.0 + (i % 3) * 0.14, 0.95, -42.35 - Math.floor(i / 3) * 0.14);
    }
    const heaterGlow = new THREE.PointLight(0xff5522, 1.2, 5, 2);
    heaterGlow.position.set(5.2, 0.9, -42.5);
    this.group.add(heaterGlow);
    this.dynamicLights.push(heaterGlow);

    // caution tape across door
    for (let i = 0; i < 5; i++) {
      this._box(1.6, 0.06, 0.02, new THREE.MeshStandardMaterial({
        color: i % 2 ? 0x111111 : 0xe8a010,
        roughness: 0.5,
      }), 8, 1.1 + i * 0.12, -36.35, { collide: false });
    }

    const phone = this._box(0.18, 0.38, 0.08, this._matMetal(0x1a1a22), 7, 0.85, -39.6);
    this._box(0.12, 0.08, 0.02, new THREE.MeshStandardMaterial({ color: 0x334422, emissive: 0x223311, emissiveIntensity: 0.4 }), 7, 0.95, -39.55, { collide: false });
    this._interact(phone, 'well_phone', 'Poslechnout hlasovky na Nokii');

    this._interact(this._box(1.5, 2.1, 0.1, this._matMetal(), 8, 1.05, -36.2), 'kids', 'Zpět do dětského klubu', 'exit');
    this._interact(this._box(1.5, 2.1, 0.1, this._matMetal(0xaa8866), 12.7, 1.05, -40), 'office', 'Do plavčíkovy kanceláře', 'exit');
  }

  _office() {
    this.zoneMarkers.office = new THREE.Vector3(14, 1.65, -4);
    const wall = this._matWall();
    this._floor(8, 7, 0.01, this._matFloor(), 14, -4);
    this._box(8, 3.6, 0.3, wall, 14, 1.8, -0.5);
    this._box(8, 3.6, 0.3, wall, 14, 1.8, -7.5);
    this._box(0.3, 3.6, 7, wall, 10, 1.8, -4);
    this._box(0.3, 3.6, 7, wall, 18, 1.8, -4);
    this._lamp(14, 3.3, -4, 0x88ffcc, 2.8);

    const desk = this._box(2.4, 0.9, 1.1, this._matMetal(0x4a5a60), 14, 0.45, -4);
    this._box(2.5, 0.06, 1.2, this._matMetal(0x6a7a80), 14, 0.92, -4, { collide: false });
    // drawers
    this._box(0.7, 0.28, 0.95, this._matMetal(0x3a4a50), 13.2, 0.35, -4, { collide: false });
    this._box(0.7, 0.28, 0.95, this._matMetal(0x3a4a50), 14.0, 0.35, -4, { collide: false });
    this._box(0.08, 0.04, 0.04, this._matMetal(0xccddee), 13.55, 0.35, -3.48, { collide: false });
    this._box(0.08, 0.04, 0.04, this._matMetal(0xccddee), 14.35, 0.35, -3.48, { collide: false });
    const folder = this._box(0.4, 0.08, 0.3, new THREE.MeshStandardMaterial({ color: 0xccaa44, emissive: 0x664400, emissiveIntensity: 0.3 }), 14.3, 0.98, -4);
    this._interact(folder, 'office_folder', 'Otevřít složku DŮKAZY');
    // mug + papers
    this._cyl(0.07, 0.06, 0.12, new THREE.MeshStandardMaterial({ color: 0xc8c8c8 }), 13.5, 1.02, -3.7);
    this._box(0.35, 0.01, 0.25, new THREE.MeshStandardMaterial({ color: 0xe8e4d8 }), 14.7, 0.96, -3.7, { collide: false });
    this._box(0.32, 0.01, 0.22, new THREE.MeshStandardMaterial({ color: 0xd8e0e8 }), 14.75, 0.975, -3.72, { collide: false });

    // CRT bezel + screen
    this._box(1.35, 1.0, 0.35, this._matMetal(0x2a2e34), 13.2, 1.55, -1.05, { collide: false });
    const monitor = this._box(1.05, 0.72, 0.08, new THREE.MeshStandardMaterial({
      color: 0x0a1a12,
      emissive: 0x1a6644,
      emissiveIntensity: 0.9,
      roughness: 0.25,
    }), 13.2, 1.55, -0.88);
    this._box(1.0, 0.68, 0.02, new THREE.MeshStandardMaterial({
      color: 0x102818,
      emissive: 0x33aa66,
      emissiveIntensity: 0.5,
      transparent: true,
      opacity: 0.85,
    }), 13.2, 1.55, -0.83, { collide: false });
    this._box(0.35, 0.15, 0.25, this._matMetal(0x222830), 13.2, 0.95, -1.0, { collide: false });
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

    this._floor(14, 12, -4, wall, 0, -14);
    this._box(14, 4, 0.4, wall, 0, -2, -8);
    this._box(14, 4, 0.4, wall, 0, -2, -20);
    this._box(0.4, 4, 12, wall, -7, -2, -14);
    this._box(0.4, 4, 12, wall, 7, -2, -14);
    this._box(14, 0.3, 12, this._matPlaster(), 0, 0, -14, { collide: false });
    this._lamp(0, -0.5, -14, 0xff8844, 3.5, 0.5);
    this._lamp(-4, -1.2, -17, 0xffaa66, 2.0);

    // warning stripe
    for (let i = 0; i < 8; i++) {
      this._box(1.2, 0.08, 0.25, new THREE.MeshStandardMaterial({
        color: i % 2 ? 0x111111 : 0xe8a010,
        roughness: 0.5,
      }), -5 + i * 1.3, -3.95, -11, { collide: false });
    }

    for (let i = 0; i < 8; i++) {
      this._box(2, 0.25, 0.8, wall, 10 - i * 0.15, -0.2 - i * 0.45, -8.5 - i * 0.4, { collide: false });
    }

    for (let i = 0; i < 5; i++) {
      const pipe = new THREE.Mesh(
        new THREE.CylinderGeometry(0.28, 0.28, 5, 12),
        this._matMetal(0x6a7a88),
      );
      pipe.rotation.z = Math.PI / 2;
      pipe.position.set(0, -1.2, -10 - i * 1.5);
      this.group.add(pipe);
      // pipe flanges
      const flange = new THREE.Mesh(
        new THREE.TorusGeometry(0.32, 0.06, 8, 16),
        this._matMetal(0x8899aa),
      );
      flange.rotation.y = Math.PI / 2;
      flange.position.set(-2.2, -1.2, -10 - i * 1.5);
      this.group.add(flange);
    }

    // valves A B C D — wheel handles, not cubes
    const valves = [
      ['valve_a', 'Otočit ventil A', -3],
      ['valve_b', 'Otočit ventil B', -1],
      ['valve_c_correct', 'Otočit ventil C (správně)', 1],
      ['valve_c_early', 'Otočit ventil C hned (špatně!)', 2.2],
      ['valve_d', 'Zavřít bypass D a odejít', 3.5],
    ];
    for (const [id, label, x] of valves) {
      const stem = this._cyl(0.08, 0.1, 0.55, this._matMetal(0x8899aa), x, -1.55, -12);
      const wheel = new THREE.Mesh(
        new THREE.TorusGeometry(0.28, 0.05, 8, 18),
        this._matMetal(0xc03030),
      );
      wheel.position.set(x, -1.2, -12);
      wheel.rotation.x = Math.PI / 2;
      this.group.add(wheel);
      // hub + spokes
      this._cyl(0.07, 0.07, 0.08, this._matMetal(0xaa2222), x, -1.2, -12);
      for (let s = 0; s < 4; s++) {
        const spoke = this._box(0.42, 0.04, 0.04, this._matMetal(0xaa3333), x, -1.2, -12, { collide: false });
        spoke.rotation.z = (s * Math.PI) / 4;
      }
      this._interact(stem, id, label);
      // also mark wheel as same interact via stem only — attach marker height via stem
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
      // hide markers for spent once-actions / missing requirements roughly
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
