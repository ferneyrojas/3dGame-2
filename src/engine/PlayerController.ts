/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { PhysicsSystem } from './PhysicsSystem';

export class PlayerController {
  private camera: THREE.Camera;
  private domElement: HTMLElement;
  private physics: PhysicsSystem;

  private moveForward = false;
  private moveBackward = false;
  private moveLeft = false;
  private moveRight = false;
  private isFast = false;

  private externalMoveX = 0;
  private externalMoveZ = 0;
  private externalLookX = 0;
  private externalLookY = 0;

  private velocity = new THREE.Vector3();
  private direction = new THREE.Vector3();
  private velocityY = 0;

  private moveSpeed = 5.0;
  private fastMoveSpeed = 10.0;

  private pitch = 0;
  private yaw = 0;

  constructor(camera: THREE.Camera, domElement: HTMLElement, physics: PhysicsSystem, config: any) {
    this.camera = camera;
    this.domElement = domElement;
    this.physics = physics;
    this.moveSpeed = config.moveSpeed || 5.0;
    this.fastMoveSpeed = config.fastMoveSpeed || 10.0;

    this.initListeners();
  }

  private initListeners() {
    const onKeyDown = (event: KeyboardEvent) => {
      switch (event.code) {
        case 'ArrowUp':
        case 'KeyW':
          this.moveForward = true;
          break;
        case 'ArrowLeft':
        case 'KeyA':
          this.moveLeft = true;
          break;
        case 'ArrowDown':
        case 'KeyS':
          this.moveBackward = true;
          break;
        case 'ArrowRight':
        case 'KeyD':
          this.moveRight = true;
          break;
        case 'ControlLeft':
        case 'ControlRight':
          this.isFast = true;
          break;
      }
    };

    const onKeyUp = (event: KeyboardEvent) => {
      switch (event.code) {
        case 'ArrowUp':
        case 'KeyW':
          this.moveForward = false;
          break;
        case 'ArrowLeft':
        case 'KeyA':
          this.moveLeft = false;
          break;
        case 'ArrowDown':
        case 'KeyS':
          this.moveBackward = false;
          break;
        case 'ArrowRight':
        case 'KeyD':
          this.moveRight = false;
          break;
        case 'ControlLeft':
        case 'ControlRight':
          this.isFast = false;
          break;
      }
    };

    const onMouseMove = (event: MouseEvent) => {
      if (document.pointerLockElement !== this.domElement) return;

      const movementX = event.movementX || 0;
      const movementY = event.movementY || 0;

      this.yaw -= movementX * 0.002;
      this.pitch -= movementY * 0.002;

      this.pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.pitch));

      this.camera.rotation.order = 'YXZ';
      this.camera.rotation.set(this.pitch, this.yaw, 0);
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('mousemove', onMouseMove);

    this.domElement.addEventListener('click', () => {
      this.domElement.requestPointerLock();
    });
  }

  update(delta: number) {
    const speed = this.isFast ? this.fastMoveSpeed : this.moveSpeed;

    // Combine keyboard and external inputs
    // Keyboard: moveForward is +1 (forward), moveBackward is -1 (backward)
    // External: moveZ is from joystick (-1 to 1)
    const moveZ = (Number(this.moveForward) - Number(this.moveBackward)) + this.externalMoveZ;
    const moveX = (Number(this.moveRight) - Number(this.moveLeft)) + this.externalMoveX;

    // In our engine, forward is -Z, so we negate moveZ for the direction
    this.direction.z = -moveZ;
    this.direction.x = moveX;
    
    // Apply external rotation
    if (this.externalLookX !== 0 || this.externalLookY !== 0) {
      this.yaw -= this.externalLookX * 0.05;
      this.pitch -= this.externalLookY * 0.05;
      this.pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.pitch));
      this.camera.rotation.order = 'YXZ';
      this.camera.rotation.set(this.pitch, this.yaw, 0);
      
      // Reset look delta after applying
      this.externalLookX = 0;
      this.externalLookY = 0;
    }

    if (this.direction.lengthSq() > 0) {
      this.direction.normalize();
    }

    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
    forward.y = 0;
    forward.normalize();

    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(this.camera.quaternion);
    right.y = 0;
    right.normalize();

    const moveVector = new THREE.Vector3()
      .addScaledVector(forward, this.direction.z)
      .addScaledVector(right, this.direction.x)
      .multiplyScalar(speed * delta);

    const nextPosition = this.camera.position.clone().add(moveVector);

    // Collision check
    if (!this.physics.checkCollisions(nextPosition)) {
      this.camera.position.copy(nextPosition);
    }

    // Gravity
    const gravityResult = this.physics.applyGravity(this.camera.position, this.velocityY, delta);
    this.camera.position.y = gravityResult.newY;
    this.velocityY = gravityResult.newVelocityY;
  }

  public setExternalMove(x: number, z: number) {
    this.externalMoveX = x;
    this.externalMoveZ = z;
  }

  public addExternalLook(x: number, y: number) {
    this.externalLookX = x;
    this.externalLookY = y;
  }

  public setFast(isFast: boolean) {
    this.isFast = isFast;
  }
}
