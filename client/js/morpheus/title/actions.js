import {
  Mesh,
  OrthographicCamera,
  PlaneGeometry,
  Scene,
  ShaderMaterial,
  TextureLoader,
} from 'three';
import {
  Tween,
  Easing,
} from 'tween';
import {
  createCamera,
  positionCamera,
  createRenderer,
} from 'utils/three';
import renderEvents from 'utils/render';
import {
  getAssetUrl,
} from 'service/gamedb';
import {
  actions as sceneActions,
} from 'morpheus/scene';
import {
  actions as gamestateActions,
} from 'morpheus/gamestate';
import {
  titleDimensions,
} from './selectors';
import {
  DONE,
  MOUSE_CLICK,
  SET_RENDER_ELEMENTS,
  START,
} from './actionTypes';

export const vertexShader = `
uniform float time;
varying vec2 vUv;
void main()
{
  vUv = uv;
  vec3 coord = position;
  coord.z = coord.z + (sin(coord.y * 30.0 + coord.x * 30.0 + time) * 0.025);
  vec4 mvPosition = modelViewMatrix * vec4( coord, 1.0 );

  gl_Position = projectionMatrix * mvPosition;
}
`;

export const titleFragmentShader = `
varying vec2 vUv;
uniform float time;
uniform float amplitude;
uniform float intensity;
uniform float opacity;
uniform sampler2D texture;

void main() {
  float scale = 1.8;
  vec2 coord = (vUv.xy - 0.5) * scale + 0.5;
  coord.x = coord.x + (sin(coord.y * intensity + time) * amplitude);
  // coord.y = coord.y + (sin(coord.x * intensity / 25.0 + time) * amplitude);
  vec4 mapTexel = texture2D( texture, coord.xy );
  if (coord.x > 1.0
    || coord.x < 0.0
    || coord.y > 1.0
    || coord.y < 0.0) {
      gl_FragColor = vec4(0.0);
    } else {
      mapTexel.a *= opacity;
      gl_FragColor = mapTexel;
    }
}
`;

function createGeometry() {
  const geometry = new PlaneGeometry(1, 0.5, 64, 64);
  return geometry;
}

function createMaterial({ uniforms }) {
  const material = new ShaderMaterial({
    uniforms,
    vertexShader,
    fragmentShader: titleFragmentShader,
    transparent: true,
  });
  return material;
}

const textureLoader = new TextureLoader();

function createTexture() {
  const texture = textureLoader.load(getAssetUrl('GameDB/All/morpheus-title', 'png'));
  return texture;
}

function createMesh({ material, geometry }) {
  const mesh = new Mesh(
    geometry,
    material,
  );
  mesh.scale.set(3, 2, 1);
  mesh.position.y = 0.5;
  window.titleMesh = mesh;
  return mesh;
}

function createScene({ object }) {
  const scene = new Scene();
  scene.add(object);
  return scene;
}

function startRenderLoop({ scene3D, camera, renderer, uniforms }) {
  const v = {
    get amplitude() {
      return uniforms.amplitude.value;
    },
    set amplitude(value) {
      uniforms.amplitude.value = value;
    },
    get intensity() {
      return uniforms.intensity.value;
    },
    set intensity(value) {
      uniforms.intensity.value = value;
    },
    get opacity() {
      return uniforms.opacity.value;
    },
    set opacity(value) {
      uniforms.opacity.value = value;
    },
  };
  const opacityTween = new Tween(v)
    .to({
      opacity: 1,
    }, 10000)
    .easing(Easing.Sinusoidal.In)
    .start();

  // const intensityTween = new Tween(v)
  //   .to({
  //     intensity: 0,
  //   }, 10000)
  //   .easing(Easing.Exponential.In)
  //   .start();

  const amplitudeTween = new Tween(v)
    .to({
      amplitude: 0,
    }, 10000)
    .easing(Easing.Quintic.In)
    .start();

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
    if (canvas) {
      const { width, height } = titleDimensions(getState());
      // const camera = new OrthographicCamera(-1, 1, 1, -1, 1, 2);
      const camera = createCamera({ width, height });
      window.titleCamera = camera;
      const uniforms = {
        time: { type: 'f', value: 1.0 },
        amplitude: { type: 'f', value: 0.25 },
        intensity: { type: 'f', value: 15 },
        opacity: { type: 'f', value: 0 },
        texture: { type: 't', value: createTexture() },
      };
      const renderer = createRenderer({ canvas, width, height });
      positionCamera({
        camera,
        vector3: { z: 2 },
      });
      const scene3D = createScene({
        object: createMesh({
          material: createMaterial({
            uniforms,
          }),
          geometry: createGeometry(),
        }),
      });
      window.titleScene = scene3D;
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
    }
  };
}

export function mouseClick() {
  return {
    type: MOUSE_CLICK,
  };
}

export function start() {
  return {
    type: START,
  };
}

export function done() {
  return (dispatch) => {
    dispatch(gamestateActions.fetchInitial())
      .then(() => dispatch(sceneActions.startAtScene(100000)))
      .then(() => {
        dispatch({
          type: DONE,
        });
      });
  };
}
