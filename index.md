Recursos usados:

https://sketchfab.com/3d-models/free-lowpoly-city-props-pack-by-maha-c81469186c6f442e88dc8a29fedcd082
https://sketchfab.com/3d-models/labirint-asset-prop-6c197cf7e8bb4ec28df5b1fac709bbab#download

https://sketchfab.com/3d-models/low-poly-scene-forest-waterfall-536a2db7384145c9aff9bfdfe2aeb5ab

Caracteristicas

- Es posible pasar por parámetro el nombre del json de la scena que está en public/assets on el parametro file
https://69d638d01586df0008d2113a--soft-jalebi-d6a77d.netlify.app/?file=scene1.json
- Movimiento con teclas y aceleracion con ctrl
- Se tienen en cuenta colisiones
- Se descargaron modelos complejos de sketchfab, se convirtieron a obj usando blender y se pueden recorrer, incluyendo subida montañas
- Se habilitaron controles para movil tanto de avance (izquierda) como de giro (derecha) usando nipple.js
- Se habilitó el botón de fullscreen para mejor experiencia en movil
- Se creo un botón de ayuda para entender el uso, esto cambia para pc o movil
- En el json es posible usar:
- Se añadió antd para habilitar componenetes como modales (openmodal)


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

onClick recibe un nombre de function
onClickParams recibe un parámetro de la función usado en el registro de la misma


Por Hacer

- Mover Objs
- Cargar otras scenas de forma dinamica para cambair de scenarios
- Conf atributo para no moverse
- Crear método para eliminar obj de scena, por ejemplo una puerta
- Crear métodos de mover objs al dar clic sobre un obj