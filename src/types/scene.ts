/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface Euler {
  x: number;
  y: number;
  z: number;
}

export type ObjectType = 'box' | 'sphere' | 'plane' | 'cylinder' | 'fbx' | 'obj' | 'dae' | 'glb';

export interface SceneObject {
  id: string;
  type: ObjectType;
  name?: string;
  position: Vector3;
  rotation: Euler;
  scale: Vector3;
  color?: string;
  texture?: string;
  alpha?: number;
  visible: boolean;
  onClick?: string; // Name of the function to execute
  onClickParams?: any; // Parameters for the function
  modelPath?: string; // For FBX, OBJ, DAE
  isSolid?: boolean; // For collision detection
  collider?: 'box' | 'sphere' | 'mesh' | 'compound';
}

export interface SceneConfig {
  player: {
    startPosition: Vector3;
    height: number;
    moveSpeed: number;
    fastMoveSpeed: number;
  };
  world: {
    size: {
      width: number; // X
      depth: number; // Z
    };
    gravity: number;
    skyColor: string;
    groundColor: string;
    hdri?: string;
  };
  ui?: {
    joystickMode?: 'static' | 'dynamic';
  };
  objects: SceneObject[];
}
