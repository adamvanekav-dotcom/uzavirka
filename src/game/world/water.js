import * as THREE from 'three';
import { makeWaterNormal } from './textures.js';

const waterVert = /* glsl */ `
  uniform float uTime;
  varying vec2 vUv;
  varying vec3 vWorldPos;
  void main() {
    vUv = uv;
    vec3 p = position;
    float w1 = sin(p.x * 0.35 + uTime * 1.2) * 0.04;
    float w2 = cos(p.y * 0.4 + uTime * 0.9) * 0.03;
    p.z += w1 + w2;
    vec4 world = modelMatrix * vec4(p, 1.0);
    vWorldPos = world.xyz;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

const waterFrag = /* glsl */ `
  uniform float uTime;
  uniform vec3 uDeep;
  uniform vec3 uShallow;
  uniform sampler2D uNormal;
  varying vec2 vUv;
  varying vec3 vWorldPos;

  void main() {
    vec2 uv1 = vUv * 4.0 + vec2(uTime * 0.03, uTime * 0.02);
    vec2 uv2 = vUv * 3.2 + vec2(-uTime * 0.025, uTime * 0.035);
    vec3 n1 = texture2D(uNormal, uv1).xyz * 2.0 - 1.0;
    vec3 n2 = texture2D(uNormal, uv2).xyz * 2.0 - 1.0;
    vec3 n = normalize(n1 + n2);
    float fres = pow(1.0 - abs(n.z), 2.2);
    float caustic = sin((vWorldPos.x + n.x) * 3.0 + uTime) * sin((vWorldPos.z + n.y) * 2.5 + uTime * 1.3);
    caustic = caustic * 0.5 + 0.5;
    vec3 col = mix(uDeep, uShallow, fres * 0.65 + caustic * 0.2);
    col += vec3(0.15, 0.35, 0.4) * caustic * 0.25;
    float alpha = 0.72 + fres * 0.22;
    gl_FragColor = vec4(col, alpha);
  }
`;

export function createWater(width, depth, y = 0.32) {
  const normal = makeWaterNormal(256);
  normal.wrapS = normal.wrapT = THREE.RepeatWrapping;

  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uDeep: { value: new THREE.Color(0x032028) },
      uShallow: { value: new THREE.Color(0x1a8a96) },
      uNormal: { value: normal },
    },
    vertexShader: waterVert,
    fragmentShader: waterFrag,
    transparent: true,
    side: THREE.DoubleSide,
  });

  const geo = new THREE.PlaneGeometry(width, depth, 96, 96);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = y;
  mesh.userData.isWater = true;

  const deep = new THREE.Mesh(
    new THREE.PlaneGeometry(width * 0.98, depth * 0.98),
    new THREE.MeshStandardMaterial({
      color: 0x021016,
      roughness: 0.95,
      metalness: 0.05,
    }),
  );
  deep.rotation.x = -Math.PI / 2;
  deep.position.y = y - 0.7;

  // caustic light projector fake
  const glow = new THREE.PointLight(0x3ec8d0, 2.8, 22, 1.5);
  glow.position.set(0, y + 0.8, 0);

  return { mesh, deep, mat, normal, glow };
}

export function updateWater(water, t) {
  if (!water?.mat) return;
  water.mat.uniforms.uTime.value = t;
  if (water.glow) {
    water.glow.intensity = 2.4 + Math.sin(t * 1.7) * 0.5;
  }
}
