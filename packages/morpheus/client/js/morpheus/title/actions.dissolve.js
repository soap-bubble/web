import {
  CanvasTexture,
  Mesh,
  PlaneGeometry,
  ShaderMaterial,
  Vector2,
} from 'three';
import {
  Tween,
  Easing,
} from 'tween';
import renderEvents from 'utils/render';
import {
  done,
} from './actions';
import {
  basicVertexShader,
  singleRippleFragmentShader,
} from './shaders';

function createGeometry() {
  const geometry = new PlaneGeometry(1, 1, 1, 1);
  return geometry;
}

function createMaterial({ uniforms }) {
  const material = new ShaderMaterial({
    uniforms,
    vertexShader: basicVertexShader,
    fragmentShader: singleRippleFragmentShader,
    transparent: true,
  });
  return material;
}

function createMesh({ material, geometry, position }) {
  const mesh = new Mesh(
    geometry,
    material,
  );
  Object.assign(mesh.position, position);
  return mesh;
}

function createObject({
  uniforms,
  position,
  aspectRatio,
}) {
  const obj = createMesh({
    material: createMaterial({
      uniforms,
    }),
    geometry: createGeometry({
      aspectRatio,
    }),
    position,
  });
  obj.scale.set(2.22, 1.45, 1);
  return obj;
}

export default function factory({ canvas: sourceCanvas }) {
  return (dispatch) => {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const aspectRatio = sourceCanvas.width / sourceCanvas.height;
    const texture = new CanvasTexture(
      canvas,
    );
    const uniforms = {
      time: { type: 'f', value: 1.0 },
      center: { type: 'fv2', value: new Vector2(0.0, 0.0) },
      freq: { type: 'fv1', value: 0.0 },
      opacity: { type: 'f', value: 1.0 },
      texture: { type: 't', value: texture },
    };
    let object3D;

    const selfie = {
      * createObject3D() {
        object3D = createObject({
          uniforms,
          aspectRatio,
          position: {
            x: 0,
            y: 0,
            z: -2,
          },
        });
        yield object3D;
      },
      activate({
        screen,
        camera,
      }) {
        object3D.position.z = 0.5;
        // raycaster.setFromCamera(screen, camera);
        // const intersection = raycaster.intersectObject(object3D, true);
        // if (intersection) {
        //   // uniforms.center.value = intersection.uv;
        // }
        const { x, y } = screen;
        uniforms.center.value = new Vector2((x + 1) / 2, (y + 1) / 2);
        canvas.width = 1024;
        canvas.height = 1024;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(
          sourceCanvas,
          0,
          0,
          sourceCanvas.width,
          sourceCanvas.height,
          0,
          0,
          1024,
          1024,
        );


        texture.needsUpdate = true;
        const v = {
          get opacity() {
            return uniforms.opacity.value;
          },
          set opacity(value) {
            uniforms.opacity.value = value;
          },
          get freq() {
            return uniforms.freq.value;
          },
          set freq(value) {
            uniforms.freq.value = value;
          },
        };
        const rippleTween = new Tween(v)
          .to({
            freq: 3.0,
          }, 5000)
          .easing(Easing.Exponential.Out)
          .onComplete(() => {
            dispatch(done());
          })
          .start();
        const opacityTween = new Tween(v)
          .to({
            opacity: 1.0,
          }, 2000)
          .easing(Easing.Sinusoidal.In);

        rippleTween.start();
        opacityTween.start();

        const startTime = Date.now();
        renderEvents.onRender(() => {
          uniforms.time.value = (Date.now() - startTime) / 1000;
        });
        renderEvents.onDestroy(() => {
          rippleTween.stop();
          opacityTween.stop();
        });
      },
    };
    return selfie;
  };
}
