import * as THREE from 'three';

/** Distant figure near the suction grate — horror beat */
export function createWatcher() {
  const group = new THREE.Group();
  group.visible = false;

  const mat = new THREE.MeshStandardMaterial({
    color: 0x05080c,
    roughness: 0.95,
    metalness: 0.05,
    transparent: true,
    opacity: 0.85,
  });

  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 0.7, 4, 8), mat);
  torso.position.y = 0.85;
  group.add(torso);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 12), mat);
  head.position.y = 1.45;
  group.add(head);

  // pale face glow
  const face = new THREE.Mesh(
    new THREE.SphereGeometry(0.12, 10, 10),
    new THREE.MeshStandardMaterial({
      color: 0x9ad0d0,
      emissive: 0x224444,
      emissiveIntensity: 0.6,
      transparent: true,
      opacity: 0.35,
    }),
  );
  face.position.set(0, 1.45, 0.08);
  group.add(face);

  group.position.set(-4, 0.35, -16.8);
  group.userData.isWatcher = true;
  return group;
}

export function updateWatcher(watcher, tension, elapsed, playerPos) {
  if (!watcher) return;
  const show = tension > 0.28;
  watcher.visible = show;
  if (!show) return;

  const pulse = 0.7 + Math.sin(elapsed * 2.2) * 0.3;
  watcher.traverse((c) => {
    if (c.isMesh && c.material?.opacity != null && c !== watcher.children[2]) {
      c.material.opacity = 0.55 + pulse * 0.3;
    }
  });

  // face player softly
  if (playerPos) {
    const dx = playerPos.x - watcher.position.x;
    const dz = playerPos.z - watcher.position.z;
    watcher.rotation.y = Math.atan2(dx, dz);
  }

  // flicker out when too close
  const dist = playerPos.distanceTo(watcher.position);
  if (dist < 4.5) watcher.visible = Math.sin(elapsed * 20) > 0;
}
