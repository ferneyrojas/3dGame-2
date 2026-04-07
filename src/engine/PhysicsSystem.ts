/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { computeBoundsTree, disposeBoundsTree, acceleratedRaycast, MeshBVH } from 'three-mesh-bvh';

// Initialize three-mesh-bvh
// @ts-ignore
THREE.BufferGeometry.prototype.computeBoundsTree = computeBoundsTree;
// @ts-ignore
THREE.BufferGeometry.prototype.disposeBoundsTree = disposeBoundsTree;
THREE.Mesh.prototype.raycast = acceleratedRaycast;

export interface ColliderInfo {
  type: 'box' | 'sphere' | 'mesh' | 'compound';
  object: THREE.Object3D;
  bvh?: MeshBVH;
}

export class PhysicsSystem {
  private collidables: ColliderInfo[] = [];
  private gravity: number = 9.8;
  private worldSize: { width: number; depth: number } = { width: 100, depth: 100 };

  constructor(gravity: number, worldSize: { width: number; depth: number }) {
    this.gravity = gravity;
    this.worldSize = worldSize;
  }

  addCollidable(object: THREE.Object3D, type: 'box' | 'sphere' | 'mesh' | 'compound' = 'box') {
    const info: ColliderInfo = { type, object };

    if (type === 'mesh') {
      object.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.computeBoundsTree();
        }
      });
    }

    this.collidables.push(info);
  }

  checkCollisions(position: THREE.Vector3, radius: number = 0.5): boolean {
    // World boundary check
    const halfWidth = this.worldSize.width / 2;
    const halfDepth = this.worldSize.depth / 2;

    if (
      position.x < -halfWidth || position.x > halfWidth ||
      position.z < -halfDepth || position.z > halfDepth
    ) {
      return true;
    }

    // Player collision volume (Capsule or Box)
    const playerBox = new THREE.Box3().setFromCenterAndSize(
      position,
      new THREE.Vector3(radius * 2, 2, radius * 2)
    );

    const playerSphere = new THREE.Sphere(position.clone(), radius);

    for (const info of this.collidables) {
      const obj = info.object;
      if (!obj.visible) continue;

      if (info.type === 'mesh') {
        let collided = false;
        obj.traverse((child) => {
          if (collided) return;
          if (child instanceof THREE.Mesh && child.geometry.boundsTree) {
            // Transform player sphere to local space
            const inverseMatrix = new THREE.Matrix4().copy(child.matrixWorld).invert();
            const localSphere = playerSphere.clone().applyMatrix4(inverseMatrix);
            
            // Check intersection with BVH
            if (child.geometry.boundsTree.intersectsSphere(localSphere)) {
              collided = true;
            }
          }
        });
        if (collided) return true;
      } else if (info.type === 'sphere') {
        const objSphere = new THREE.Sphere();
        new THREE.Box3().setFromObject(obj).getBoundingSphere(objSphere);
        if (playerSphere.intersectsSphere(objSphere)) return true;
      } else {
        // Default to Box (AABB) for 'box' and 'compound' (unless compound is expanded)
        const objBox = new THREE.Box3().setFromObject(obj);
        if (playerBox.intersectsBox(objBox)) {
          return true;
        }
      }
    }

    return false;
  }

  applyGravity(position: THREE.Vector3, velocityY: number, delta: number): { newY: number; newVelocityY: number } {
    let nextVelocityY = velocityY - this.gravity * delta;
    let nextY = position.y + nextVelocityY * delta;

    // Raycast down to find ground height at current (x, z)
    // Start ray slightly above current position to detect ground we might be standing on
    const rayOrigin = new THREE.Vector3(position.x, position.y + 0.5, position.z);
    const rayDirection = new THREE.Vector3(0, -1, 0);
    const raycaster = new THREE.Raycaster(rayOrigin, rayDirection, 0, 10);
    
    const meshes: THREE.Mesh[] = [];
    for (const info of this.collidables) {
      if (!info.object.visible) continue;
      info.object.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          meshes.push(child);
        }
      });
    }

    const intersects = raycaster.intersectObjects(meshes, true);
    
    let groundY = 0; // Default world floor
    if (intersects.length > 0) {
      // Find the highest point below us
      groundY = intersects[0].point.y;
    }

    const playerHeight = 1.7; // Eye level height
    if (nextY < groundY + playerHeight) {
      nextY = groundY + playerHeight;
      nextVelocityY = 0;
    }

    return { newY: nextY, newVelocityY: nextVelocityY };
  }
}
