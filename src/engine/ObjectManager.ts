/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { FBXLoader, OBJLoader, ColladaLoader, GLTFLoader, MTLLoader } from 'three-stdlib';
import { SceneObject } from '../types/scene';
import { EventManager } from './EventManager';

export class ObjectManager {
  private scene: THREE.Scene;
  private eventManager: EventManager;
  private objects: Map<string, THREE.Object3D> = new Map();
  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2();

  private fbxLoader = new FBXLoader();
  private objLoader = new OBJLoader();
  private mtlLoader = new MTLLoader();
  private colladaLoader = new ColladaLoader();
  private gltfLoader = new GLTFLoader();
  private textureLoader = new THREE.TextureLoader();

  constructor(scene: THREE.Scene, eventManager: EventManager) {
    this.scene = scene;
    this.eventManager = eventManager;
  }

  async createObject(config: SceneObject): Promise<THREE.Object3D> {
    let object: THREE.Object3D;

    switch (config.type) {
      case 'box':
        object = new THREE.Mesh(
          new THREE.BoxGeometry(1, 1, 1),
          this.createMaterial(config)
        );
        break;
      case 'sphere':
        object = new THREE.Mesh(
          new THREE.SphereGeometry(0.5, 32, 32),
          this.createMaterial(config)
        );
        break;
      case 'plane':
        object = new THREE.Mesh(
          new THREE.PlaneGeometry(1, 1),
          this.createMaterial(config)
        );
        break;
      case 'cylinder':
        object = new THREE.Mesh(
          new THREE.CylinderGeometry(0.5, 0.5, 1, 32),
          this.createMaterial(config)
        );
        break;
      case 'fbx':
        object = await this.loadFBX(config.modelPath!);
        break;
      case 'obj':
        object = await this.loadOBJ(config.modelPath!);
        break;
      case 'dae':
        object = await this.loadDAE(config.modelPath!);
        break;
      case 'glb':
        object = await this.loadGLB(config.modelPath!);
        break;
      default:
        object = new THREE.Group();
    }

    object.name = config.name || config.id;
    object.userData.id = config.id;
    object.userData.onClick = config.onClick;

    // Apply texture/color to all meshes in the object (useful for models)
    if (config.texture || config.color) {
      const material = this.createMaterial(config);
      object.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.material = material;
        }
      });
    }

    object.position.set(config.position.x, config.position.y, config.position.z);
    object.rotation.set(config.rotation.x, config.rotation.y, config.rotation.z);
    object.scale.set(config.scale.x, config.scale.y, config.scale.z);
    object.visible = config.visible;

    this.scene.add(object);
    this.objects.set(config.id, object);

    return object;
  }

  private createMaterial(config: SceneObject): THREE.Material {
    const params: THREE.MeshStandardMaterialParameters = {
      color: config.color || '#ffffff',
      transparent: (config.alpha || 1) < 1,
      opacity: config.alpha || 1,
    };

    if (config.texture) {
      const texture = this.textureLoader.load(config.texture);
      texture.colorSpace = THREE.SRGBColorSpace;
      
      // Basic validation/optimization for textures
      texture.anisotropy = 16;
      
      // If it's a large surface like the ground, enable wrapping
      if (config.type === 'plane' && (config.scale.x > 5 || config.scale.y > 5)) {
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        // Adjust repeat based on scale if needed, but keeping it simple for now
        texture.repeat.set(config.scale.x / 2, config.scale.y / 2);
      }
      
      params.map = texture;
    }

    return new THREE.MeshStandardMaterial(params);
  }

  private loadFBX(path: string): Promise<THREE.Object3D> {
    return new Promise((resolve, reject) => {
      this.fbxLoader.load(path, resolve, undefined, reject);
    });
  }

  private loadOBJ(path: string): Promise<THREE.Object3D> {
    return new Promise((resolve, reject) => {
      const lastSlashIndex = path.lastIndexOf('/');
      const basePath = lastSlashIndex !== -1 ? path.substring(0, lastSlashIndex + 1) : '';
      const objFileName = lastSlashIndex !== -1 ? path.substring(lastSlashIndex + 1) : path;
      const mtlFileName = objFileName.replace(/\.obj$/i, '.mtl');
      
      // Set base path for both loaders to resolve relative textures/mtl
      this.mtlLoader.setPath(basePath);
      this.objLoader.setPath(basePath);

      // Try to load MTL first
      this.mtlLoader.load(
        mtlFileName,
        (materials) => {
          materials.preload();
          this.objLoader.setMaterials(materials);
          this.objLoader.load(objFileName, resolve, undefined, reject);
        },
        undefined,
        () => {
          // If MTL fails (e.g., doesn't exist), load OBJ with default materials
          this.objLoader.setMaterials(null as any);
          this.objLoader.load(objFileName, resolve, undefined, reject);
        }
      );
    });
  }

  private loadDAE(path: string): Promise<THREE.Object3D> {
    return new Promise((resolve, reject) => {
      this.colladaLoader.load(path, (collada) => resolve(collada.scene), undefined, reject);
    });
  }

  private loadGLB(path: string): Promise<THREE.Object3D> {
    return new Promise((resolve, reject) => {
      this.gltfLoader.load(path, (gltf) => resolve(gltf.scene), undefined, reject);
    });
  }

  handleInteraction(camera: THREE.Camera, engine: any) {
    this.raycaster.setFromCamera(new THREE.Vector2(0, 0), camera); // Center of screen for pointer lock
    const intersects = this.raycaster.intersectObjects(this.scene.children, true);

    if (intersects.length > 0) {
      const target = intersects[0].object;
      let current: THREE.Object3D | null = target;
      
      // Traverse up to find the object with onClick data
      while (current && !current.userData.onClick) {
        current = current.parent;
      }

      if (current && current.userData.onClick) {
        this.eventManager.execute(current.userData.onClick, current, engine);
      }
    }
  }

  getObject(id: string): THREE.Object3D | undefined {
    return this.objects.get(id);
  }
}
