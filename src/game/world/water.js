import * as THREE from 'three';
import { makeWaterNormal } from './textures.js';

export function createWater(width, depth, y = 0.32) {
  const normal = makeWaterNormal(1024);

  const mat = new THREE.MeshPhysicalMaterial({
    color: 0x0c5a68,
    roughness: 0.08,
    metalness: 0.12,
    transparent: true,
    opacity: 0.78,
    clearcoat: 1,
    clearcoatRoughness: 0.06,
    envMapIntensity: 2.1,
    normalMap: normal,
    normalScale: new THREE.Vector2(0.85, 0.85),
    reflectivity: 0.9,
  });

  const geo = new THREE.PlaneGeometry(width, depth, 64, 64);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = y;
  mesh.userData.isWater = true;

  const deep = new THREE.Mesh(
    new THREE.PlaneGeometry(width * 0.98, depth * 0.98),
    new THREE.MeshStandardMaterial({
      color: 0x031018,
      roughness: 0.9,
      metalness: 0.05,
    }),
  );
  deep.rotation.x = -Math.PI / 2;
  deep.position.y = y - 1.05;

  const glow = new THREE.PointLight(0x3ec8d8, 3.4, 26, 1.35);
  glow.position.set(0, y + 0.9, 0);
  glow.userData.baseIntensity = 3.4;

  return { mesh, deep, mat, normal, glow };
}

export function updateWater(water, t) {
  if (!water?.mat) return;
  if (water.normal) {
    water.normal.offset.set(t * 0.012, t * 0.008);
  }
  if (water.glow) {
    water.glow.intensity = (water.glow.userData.baseIntensity || 3) * (0.88 + Math.sin(t * 1.6) * 0.14);
  }
}
