import * as THREE from 'three';

const SETS = {
  tiles: { diff: 'tiles_diff.jpg', nor: 'tiles_nor.jpg', arm: 'tiles_arm.jpg' },
  walltile: { diff: 'walltile_diff.jpg', nor: 'walltile_nor.jpg', rough: 'walltile_rough.jpg' },
  mosaic: { diff: 'mosaic_diff.jpg', nor: 'mosaic_nor.jpg', rough: 'mosaic_rough.jpg' },
  plaster: { diff: 'plaster_diff.jpg', nor: 'plaster_nor.jpg', arm: 'plaster_arm.jpg' },
  deck: { diff: 'deck_diff.jpg', nor: 'deck_nor.jpg', arm: 'deck_arm.jpg' },
  concrete: { diff: 'concrete_diff.jpg', nor: 'concrete_nor.jpg', arm: 'concrete_arm.jpg' },
  metal: { diff: 'metal_diff.jpg', nor: 'metal_nor.jpg', arm: 'metal_arm.jpg' },
  wood: { diff: 'wood_diff.jpg', nor: 'wood_nor.jpg', arm: 'wood_arm.jpg' },
  asphalt: { diff: 'asphalt_diff.jpg', nor: 'asphalt_nor.jpg', arm: 'asphalt_arm.jpg' },
  rust: { diff: 'rust_diff.jpg', nor: 'rust_nor.jpg', arm: 'rust_arm.jpg' },
};

function prepColor(tex, aniso) {
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = aniso;
  tex.generateMipmaps = true;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.magFilter = THREE.LinearFilter;
  return tex;
}

function prepLinear(tex, aniso) {
  tex.colorSpace = THREE.NoColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = aniso;
  tex.generateMipmaps = true;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  return tex;
}

function cloneMap(src, repeat) {
  const t = src.clone();
  t.wrapS = src.wrapS;
  t.wrapT = src.wrapT;
  t.anisotropy = src.anisotropy;
  t.colorSpace = src.colorSpace;
  t.repeat.set(repeat[0], repeat[1]);
  t.needsUpdate = true;
  return t;
}

export class Materials {
  constructor(aniso = 8) {
    this.aniso = aniso;
    this.sets = {};
  }

  load() {
    const manager = new THREE.LoadingManager();
    const loader = new THREE.TextureLoader(manager);
    const done = new Promise((resolve, reject) => {
      manager.onLoad = resolve;
      manager.onError = (u) => reject(new Error(`texture failed: ${u}`));
    });

    for (const [name, files] of Object.entries(SETS)) {
      const set = {};
      set.map = prepColor(loader.load(`/textures/${files.diff}`), this.aniso);
      set.normalMap = prepLinear(loader.load(`/textures/${files.nor}`), this.aniso);
      if (files.arm) {
        set.arm = prepLinear(loader.load(`/textures/${files.arm}`), this.aniso);
      }
      if (files.rough) {
        set.roughnessMap = prepLinear(loader.load(`/textures/${files.rough}`), this.aniso);
      }
      this.sets[name] = set;
    }

    return done;
  }

  /**
   * @param {string} name
   * @param {{repeat?: number[], color?: number, roughness?: number, metalness?: number, clearcoat?: number, env?: number, normal?: number}} opts
   */
  make(name, opts = {}) {
    const s = this.sets[name];
    if (!s) throw new Error(`unknown material ${name}`);
    const repeat = opts.repeat || [4, 4];
    const map = cloneMap(s.map, repeat);
    const normalMap = cloneMap(s.normalMap, repeat);
    const mat = new THREE.MeshPhysicalMaterial({
      map,
      normalMap,
      normalScale: new THREE.Vector2(opts.normal ?? 1, opts.normal ?? 1),
      color: opts.color ?? 0xffffff,
      roughness: opts.roughness ?? 1,
      metalness: opts.metalness ?? 0,
      clearcoat: opts.clearcoat ?? 0,
      clearcoatRoughness: opts.clearcoatRoughness ?? 0.2,
      envMapIntensity: opts.env ?? 1.1,
    });
    if (s.arm) {
      const arm = cloneMap(s.arm, repeat);
      mat.roughnessMap = arm;
      mat.metalnessMap = arm;
    }
    if (s.roughnessMap) {
      mat.roughnessMap = cloneMap(s.roughnessMap, repeat);
    }
    return mat;
  }

  wetFloor(repeat = [6, 6], tint = 0xb8c8d0) {
    return this.make('tiles', {
      repeat,
      color: tint,
      roughness: 0.18,
      metalness: 0.08,
      clearcoat: 1,
      clearcoatRoughness: 0.12,
      env: 1.55,
      normal: 1.15,
    });
  }

  wall(repeat = [3, 2], tint = 0xd0d8dc) {
    return this.make('walltile', {
      repeat,
      color: tint,
      roughness: 0.28,
      metalness: 0.04,
      clearcoat: 0.55,
      clearcoatRoughness: 0.22,
      env: 1.15,
      normal: 1.05,
    });
  }

  mosaic(repeat = [8, 8], tint = 0x88b8c4) {
    return this.make('mosaic', {
      repeat,
      color: tint,
      roughness: 0.22,
      metalness: 0.06,
      clearcoat: 0.9,
      clearcoatRoughness: 0.18,
      env: 1.4,
    });
  }
}
