import {
  Mesh,
  PlaneGeometry,
  ShaderMaterial,
  TextureLoader,
  Raycaster,
  Vector2,
} from 'three';
import {
  selectors as gameSelectors,
} from 'morpheus/game';
import {
  Tween,
  Easing,
} from 'tween';
import { getAssetUrl } from 'service/gamedb';
import renderEvents from 'utils/render';

import {
  leaving,
  done,
} from './actions';
import {
  titleDimensions,
} from './selectors';
import {
  basicVertexShader,
  rippleFragmentShader,
} from './shaders';

function createBackground({
  map,
  position,
  uniforms,
}) {
  function createGeometry() {
    const size = 1.12;
    const geometry = new PlaneGeometry(size * 4, size * 3, 1, 1);
    return geometry;
  }

  function createMaterial() {
    const material = new ShaderMaterial({
      uniforms,
      vertexShader: basicVertexShader,
      fragmentShader: rippleFragmentShader,
    });
    return material;
  }

  function createMesh({ material, geometry }) {
    const mesh = new Mesh(
      geometry,
      material,
    );
    // mesh.scale.set(1, 0.85 * 0.66, 1);
    Object.assign(mesh.position, position);
    return mesh;
  }

  return createMesh({
    material: createMaterial(),
    geometry: createGeometry(),
  });
}

export default function factory() {
  return (dispatch, getState) => {
    const raycaster = new Raycaster();
    let uniforms;
    let backgroundPlane;
    const ripples = [];

    const selfie = {
      start() {
        for (let i = 0; i < 5; i++) {
          ripples[i].tween = new Tween(ripples[i])
            .to({
              freq: 0.05,
            }, 10000)
            .easing(Easing.Back.Out)
            .start();
        }
        const startTime = Date.now();
        renderEvents.onRender(() => {
          const freq = [];
          const center = [];
          ripples.forEach((v, i) => {
            freq[i] = v.freq;
            center[i] = v.pos;
          });
          uniforms.center.value = center;
          uniforms.freq.value = freq;
          uniforms.time.value = (Date.now() - startTime) / 1000;
        });
      },
      * createObject3D() {
        const textureLoader = new TextureLoader();

        function createTexture() {
          const texture = textureLoader.load(getAssetUrl('GameDB/All/morpheus-background', 'jpg'));
          return texture;
        }
        uniforms = {
          time: { type: 'f', value: 1.0 },
          center: { type: 'fv2', value: [] },
          freq: { type: 'fv1', value: [] },
          texture: { type: 't', value: createTexture() },
        };
        for (let i = 0; i < 5; i++) {
          ripples[i] = {
            pos: new Vector2(Math.random() * 5, Math.random() * 5),
            freq: 8 + (Math.random() * 8),
          };
        }
        const freq = [];
        const center = [];
        ripples.forEach((v, i) => {
          freq[i] = v.freq;
          center[i] = v.pos;
        });
        uniforms.center.value = center;
        uniforms.freq.value = freq;
        backgroundPlane = createBackground({
          uniforms,
          position: {
            x: 0,
            y: 0,
            z: -1,
          },
        });
        yield backgroundPlane;
      },
    };
    return selfie;
  };
}
