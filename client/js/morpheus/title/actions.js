import {
  Mesh,
  OrthographicCamera,
  PlaneBufferGeometry,
  Scene,
  ShaderMaterial,
  TextureLoader,
} from 'three';
import {
  positionCamera,
  createRenderer,
} from 'utils/three';
import renderEvents from 'utils/render';
import {
  getAssetUrl,
} from 'service/gamedb';
import {
  titleDimensions,
} from './selectors';
import {
  SET_RENDER_ELEMENTS,
} from './actionTypes';

function createGeometry() {
  const geometry = new PlaneBufferGeometry(2, 2);
  return geometry;
}

export const vertexShader = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4( position, 1.0 );
}
`;

export const titleFragmentShader = `
varying vec2 vUv;
uniform sampler2D map;

void main() {
  vec4 mapTexel = texture2D( map, vUv.xy );
  gl_FragColor = mapTexel;
}
`;

function createMaterial({ map, uniforms }) {
  uniforms.map = { type: 't', value: map };
  const material = new ShaderMaterial({
    uniforms,
    vertexShader,
    fragmentShader: titleFragmentShader,
  });
  return material;
}

const textureLoader = new TextureLoader();

function createTexture() {
  const texture = textureLoader.load(getAssetUrl('GameDB/All/morpheus-title', 'png'));
  return texture;
}

function createMesh({ material, geometry }) {
  const mesh = new Mesh(geometry, material);
  return mesh;
}

function createScene({ object }) {
  const scene = new Scene();
  scene.add(object);
  return scene;
}

function startRenderLoop({ scene3D, camera, renderer, uniforms }) {
  const start = Date.now();
  const render = () => {
    uniforms.time.value = (Date.now() - start) / 1000;
    renderer.render(scene3D, camera);
  };
  renderEvents.onRender(render);
  renderEvents.onDestroy(() => {
    renderer.dispose();
  });
}

export function canvasCreated(canvas) {
  return (dispatch, getState) => {
    const { width, height } = titleDimensions(getState());
    const camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const uniforms = {
      time: { type: 'f', value: 1.0 },
    };
    const renderer = createRenderer({ canvas, width, height });
    positionCamera({
      camera,
      vector3: { z: -0.09 },
    });
    const scene3D = createScene({
      object: createMesh({
        material: createMaterial({
          map: createTexture(),
          uniforms,
        }),
        geometry: createGeometry(),
      }),
    });
    startRenderLoop({
      scene3D,
      camera,
      renderer,
      uniforms,
    });
    dispatch({
      type: SET_RENDER_ELEMENTS,
      payload: {
        camera,
        renderer,
      },
    });
  };
}
