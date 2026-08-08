import * as THREE from 'three';

export class Player3D {
  constructor(camera, scene, audio) {
    this.camera = camera;
    this.scene = scene;
    this.audio = audio;

    this.position = new THREE.Vector3(0, 1.65, 18);
    this.velocity = new THREE.Vector3();
    this.euler = new THREE.Euler(0, Math.PI, 0, 'YXZ');

    this.keys = {};
    this.pointerLocked = false;
    this.sensitivity = 0.002;
    this.eyeHeight = 1.65;
    this.baseY = 0;
    this.radius = 0.35;
    this.speed = 4.2;
    this.sprintMul = 1.55;
    this.stamina = 100;
    this.battery = 100;
    this.flashlightOn = true;
    this.bob = 0;
    this.hovered = null;
    this.colliders = [];

    this.flashlight = new THREE.SpotLight(0xfff2d6, 14, 32, Math.PI / 5, 0.35, 1);
    this.flashlight.castShadow = true;
    this.flashlight.shadow.mapSize.set(1024, 1024);
    this.flashTarget = new THREE.Object3D();
    scene.add(this.flashTarget);
    this.flashlight.target = this.flashTarget;
    camera.add(this.flashlight);
    scene.add(camera);

    this.raycaster = new THREE.Raycaster();
    this.raycaster.far = 3.2;

    this._onKeyDown = (e) => {
      this.keys[e.code] = true;
      if (e.code === 'KeyF') this.toggleFlashlight();
    };
    this._onKeyUp = (e) => { this.keys[e.code] = false; };
    this._onMouse = (e) => {
      if (!this.pointerLocked) return;
      this.euler.y -= e.movementX * this.sensitivity;
      this.euler.x -= e.movementY * this.sensitivity;
      this.euler.x = Math.max(-1.4, Math.min(1.4, this.euler.x));
    };

    window.addEventListener('keydown', this._onKeyDown);
    window.addEventListener('keyup', this._onKeyUp);
    window.addEventListener('mousemove', this._onMouse);
  }

  setColliders(list) {
    this.colliders = list;
  }

  toggleFlashlight() {
    if (this.battery <= 0) return;
    this.flashlightOn = !this.flashlightOn;
    this.flashlight.visible = this.flashlightOn;
    this.audio?.blip('ui');
  }

  syncCamera() {
    this.camera.quaternion.setFromEuler(this.euler);
    this.camera.position.copy(this.position);
  }

  update(dt, interactables = []) {
    const sprint = (this.keys.ShiftLeft || this.keys.ShiftRight) && this.stamina > 0;
    if (sprint) this.stamina = Math.max(0, this.stamina - 18 * dt);
    else this.stamina = Math.min(100, this.stamina + 12 * dt);

    const speed = this.speed * (sprint ? this.sprintMul : 1) * (this.keys.KeyC ? 0.45 : 1);
    const forward = new THREE.Vector3();
    const right = new THREE.Vector3();
    this.camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();
    right.crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

    const wish = new THREE.Vector3();
    if (this.keys.KeyW) wish.add(forward);
    if (this.keys.KeyS) wish.sub(forward);
    if (this.keys.KeyD) wish.add(right);
    if (this.keys.KeyA) wish.sub(right);
    if (wish.lengthSq() > 0) {
      wish.normalize().multiplyScalar(speed * dt);
      this._moveWithCollision(wish);
      this.bob += dt * (sprint ? 12 : 8);
      this._stepAcc = (this._stepAcc || 0) + dt * (sprint ? 2.2 : 1.4);
      if (this._stepAcc > 0.42) {
        this._stepAcc = 0;
        this.audio?.blip('step');
      }
    } else {
      this.bob *= 0.9;
      this._stepAcc = 0;
    }

    const bobY = Math.sin(this.bob) * 0.035;
    this.position.y = this.baseY + this.eyeHeight * (this.keys.KeyC ? 0.65 : 1) + bobY;
    this.syncCamera();

    // flashlight aim
    const dir = new THREE.Vector3();
    this.camera.getWorldDirection(dir);
    this.flashTarget.position.copy(this.camera.position).add(dir.multiplyScalar(8));
    if (this.flashlightOn) {
      this.battery = Math.max(0, this.battery - 1.2 * dt);
      if (this.battery <= 0) {
        this.flashlightOn = false;
        this.flashlight.visible = false;
      }
      this.flashlight.intensity = 6 + Math.sin(performance.now() * 0.01) * 0.35;
    }

    this.hovered = null;
    if (interactables.length) {
      this.raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);
      const hits = this.raycaster.intersectObjects(interactables, true);
      if (hits[0]) {
        let obj = hits[0].object;
        while (obj && !obj.userData?.interactId) obj = obj.parent;
        if (obj?.userData?.interactId) this.hovered = obj;
      }
    }
    for (const obj of interactables) {
      if (!obj.material || !('emissiveIntensity' in obj.material)) continue;
      const on = obj === this.hovered;
      obj.material.emissiveIntensity = on ? 0.85 : 0.2;
      if (obj.userData.marker) {
        obj.userData.marker.material.emissiveIntensity = on ? 2.4 : 1.2;
        obj.userData.marker.scale.setScalar(on ? 1.35 : 1);
      }
    }
  }

  _moveWithCollision(delta) {
    const tryMove = (axis) => {
      const next = this.position.clone();
      next[axis] += delta[axis];
      if (!this._collides(next)) this.position[axis] = next[axis];
    };
    tryMove('x');
    tryMove('z');
  }

  _collides(pos) {
    for (const box of this.colliders) {
      if (
        pos.x + this.radius > box.min.x &&
        pos.x - this.radius < box.max.x &&
        pos.z + this.radius > box.min.z &&
        pos.z - this.radius < box.max.z &&
        pos.y < box.max.y &&
        pos.y > box.min.y - 1.5
      ) {
        return true;
      }
    }
    return false;
  }

  addBattery(amount = 40) {
    this.battery = Math.min(100, this.battery + amount);
  }
}
