import * as THREE from 'three';
import { makeWaterNormal } from './textures.js';

export function createWater(width, depth, y = 0.35) {
  const normal = makeWaterNormal();
  normal.repeat.set(6, 6);

  const geo = new THREE.PlaneGeometry(width, depth, 64, 64);
  const mat = new THREE.MeshStandardMaterial({
    color: 0x0a4a55,
    metalness: 0.65,
    roughness: 0.18,
    transparent: true,
    opacity: 0.82,
    normalMap: normal,
    normalScale: new THREE.Vector2(0.6, 0.6),
    envMapIntensity: 1.2,
  });

  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = y;
  mesh.receiveShadow = true;
  mesh.userData.isWater = true;

  // subsurface fake plate
  const deep = new THREE.Mesh(
    new THREE.PlaneGeometry(width * 0.98, depth * 0.98),
    new THREE.MeshStandardMaterial({
      color: 0x031820,
      roughness: 0.9,
      metalness: 0.1,
    }),
  );
  deep.rotation.x = -Math.PI / 2;
  deep.position.y = y - 0.55;

  return { mesh, deep, mat, normal };
}

export function updateWater(water, t) {
  if (!water?.normal) return;
  water.normal.offset.x = t * 0.03;
  water.normal.offset.y = t * 0.02;
  if (water.mat) {
    water.mat.opacity = 0.78 + Math.sin(t * 1.3) * 0.04;
  }
}
