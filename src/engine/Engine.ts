/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { KTX2Loader, RGBELoader } from 'three-stdlib';
import { SceneConfig } from '../types/scene';
import { EventManager } from './EventManager';
import { PhysicsSystem } from './PhysicsSystem';
import { PlayerController } from './PlayerController';
import { ObjectManager } from './ObjectManager';

export class Engine {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private clock: THREE.Clock;

  private eventManager: EventManager;
  private physicsSystem: PhysicsSystem;
  public playerController: PlayerController;
  private objectManager: ObjectManager;

  private config: SceneConfig;
  private container: HTMLElement;

  constructor(container: HTMLElement, config: SceneConfig) {
    this.container = container;
    this.config = config;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(config.world.skyColor);

    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.camera.position.set(
      config.player.startPosition.x,
      config.player.startPosition.y,
      config.player.startPosition.z
    );

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    
    // HDR and Color Management
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    
    this.container.appendChild(this.renderer.domElement);

    this.clock = new THREE.Clock();

    this.eventManager = new EventManager();
    this.physicsSystem = new PhysicsSystem(config.world.gravity, config.world.size);
    this.playerController = new PlayerController(this.camera, this.renderer.domElement, this.physicsSystem, config.player);
    this.objectManager = new ObjectManager(this.scene, this.eventManager);

    this.initLights();
    this.initHDRI();
    this.loadScene();
    this.initInteraction();

    window.addEventListener('resize', this.onWindowResize.bind(this));
    this.animate();
  }

  private initLights() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 7);
    this.scene.add(directionalLight);
  }

  private initHDRI() {
    const hdriPath = this.config.world.hdri;
    if (!hdriPath) return;

    const isKTX2 = hdriPath.toLowerCase().endsWith('.ktx2');
    const loader = isKTX2 ? new KTX2Loader() : new RGBELoader();

    if (isKTX2) {
      (loader as KTX2Loader).setTranscoderPath('https://cdn.jsdelivr.net/gh/mrdoob/three.js@r160/examples/jsm/libs/basis/');
      (loader as KTX2Loader).detectSupport(this.renderer);
    }

    loader.load(hdriPath, (texture) => {
      texture.mapping = THREE.EquirectangularReflectionMapping;
      this.scene.background = texture;
      this.scene.environment = texture;
      
      // If it's an HDR texture, we might want to adjust exposure
      if (!isKTX2) {
        this.renderer.toneMappingExposure = 1.0;
      }
    }, undefined, (error) => {
      console.error('Error loading HDRI:', error);
    });
  }

  private async loadScene() {
    for (const objConfig of this.config.objects) {
      const obj = await this.objectManager.createObject(objConfig);
      if (objConfig.isSolid) {
        this.physicsSystem.addCollidable(obj, objConfig.collider);
      }
    }
  }

  private initInteraction() {
    window.addEventListener('mousedown', (event) => {
      if (event.button === 0 && document.pointerLockElement === this.renderer.domElement) {
        this.objectManager.handleInteraction(this.camera, this);
      }
    });
  }

  private onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  private animate() {
    requestAnimationFrame(this.animate.bind(this));

    const delta = this.clock.getDelta();
    this.playerController.update(delta);

    this.renderer.render(this.scene, this.camera);
  }

  // Exposed methods for EventManager
  showObject(id: string) {
    const obj = this.objectManager.getObject(id);
    if (obj) obj.visible = true;
  }

  hideObject(id: string) {
    const obj = this.objectManager.getObject(id);
    if (obj) obj.visible = false;
  }

  moveObject(id: string, x: number, y: number, z: number) {
    const obj = this.objectManager.getObject(id);
    if (obj) obj.position.set(x, y, z);
  }

  rotateObject(id: string, x: number, y: number, z: number) {
    const obj = this.objectManager.getObject(id);
    if (obj) obj.rotation.set(x, y, z);
  }

  scaleObject(id: string, x: number, y: number, z: number) {
    const obj = this.objectManager.getObject(id);
    if (obj) obj.scale.set(x, y, z);
  }
}
