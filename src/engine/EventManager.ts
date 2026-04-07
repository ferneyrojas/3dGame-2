/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';

export type GameEvent = (object: THREE.Object3D, engine: any) => void;

export class EventManager {
  private events: Map<string, GameEvent> = new Map();

  constructor() {
    this.registerDefaultEvents();
  }

  private registerDefaultEvents() {
    this.register('toggleVisibility', (obj) => {
      obj.visible = !obj.visible;
      console.log(`Object ${obj.name} visibility toggled to ${obj.visible}`);
    });

    this.register('rotateSelf', (obj) => {
      obj.rotation.y += Math.PI / 4;
      console.log(`Object ${obj.name} rotated`);
    });

    this.register('scaleUp', (obj) => {
      obj.scale.multiplyScalar(1.2);
    });

    this.register('scaleDown', (obj) => {
      obj.scale.multiplyScalar(0.8);
    });
  }

  register(name: string, callback: GameEvent) {
    this.events.set(name, callback);
  }

  execute(name: string, object: THREE.Object3D, engine: any) {
    const event = this.events.get(name);
    if (event) {
      event(object, engine);
    } else {
      console.warn(`Event "${name}" not found`);
    }
  }
}
