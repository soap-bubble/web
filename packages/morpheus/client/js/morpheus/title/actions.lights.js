import {
  HemisphereLight,
  SpotLight,
} from 'three';
import renderEvents from 'utils/render';

export default function factory() {
  return (/* dispatch, getState */) => {
    let spotLight;
    const selfie = {
      start() {
        const startTime = Date.now();
        renderEvents.onRender(() => {
          const delta = (Date.now() - startTime) / 4000;
          spotLight.position.set(0.5 * Math.sin(delta), 0.5 * Math.cos(delta), 2);
        });
      },
      * createObject3D() {
        yield new HemisphereLight(0x443333, 0x221111);
        spotLight = new SpotLight(0x886666, 3);
        spotLight.position.set(-0.5, -0.5, 2);
        spotLight.position.multiplyScalar(700);
        spotLight.castShadow = true;
        spotLight.shadow.mapSize.width = 2048;
        spotLight.shadow.mapSize.height = 2048;
        spotLight.shadow.camera.near = 200;
        spotLight.shadow.camera.far = 1500;
        spotLight.shadow.camera.fov = 40;
        spotLight.shadow.bias = -0.005;
        yield spotLight;
      },
    };
    return selfie;
  };
}
