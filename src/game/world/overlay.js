import * as THREE from 'three';

/**
 * Lightweight fullscreen pass: chromatic vignette + scanline via shader on a
 * screen quad rendered after the scene (additive overlay in scene camera space).
 */
export function createOverlayPass(camera) {
  const geo = new THREE.PlaneGeometry(2, 2);
  const mat = new THREE.ShaderMaterial({
    transparent: true,
    depthTest: false,
    depthWrite: false,
    uniforms: {
      uTime: { value: 0 },
      uTension: { value: 0 },
      uBattery: { value: 1 },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = vec4(position.xy, 0.0, 1.0);
      }
    `,
    fragmentShader: `
      varying vec2 vUv;
      uniform float uTime;
      uniform float uTension;
      uniform float uBattery;
      void main() {
        vec2 uv = vUv * 2.0 - 1.0;
        float vig = smoothstep(1.35, 0.25, length(uv));
        float scan = sin((vUv.y + uTime * 0.05) * 900.0) * 0.015;
        float flicker = sin(uTime * 40.0) * 0.01 * uTension;
        float dark = (1.0 - vig) * (0.55 + uTension * 0.35);
        float bat = (1.0 - uBattery) * 0.25;
        vec3 tint = mix(vec3(0.02, 0.05, 0.07), vec3(0.12, 0.02, 0.04), uTension);
        gl_FragColor = vec4(tint, dark + bat + scan + flicker);
      }
    `,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.frustumCulled = false;
  mesh.renderOrder = 999;
  camera.add(mesh);
  // put overlay slightly in front of camera near plane
  mesh.position.z = -0.2;
  return mat;
}
