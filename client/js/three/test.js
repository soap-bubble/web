import THREE from 'three';
import wagner from 'wagner-core';
import raf from 'raf';
import logger from '../utils/logging';

const log = logger('hotpost');

const HOTSPOT_X_COORD_FACTOR = Math.PI / 1800;
const HOTSPOT_Y_COORD_FACTOR = 0.0015;
const SIZE = 0.50;

function scaleFromHotspotToRad(h) {
  return {
    left: HOTSPOT_X_COORD_FACTOR * h.rectLeft,
    right: HOTSPOT_X_COORD_FACTOR * h.rectRight,
    top: HOTSPOT_Y_COORD_FACTOR * h.rectTop,
    bottom: HOTSPOT_Y_COORD_FACTOR * h.rectBottom
  };
}

function cylinderMap(x, y) {
  return {
    x: SIZE * Math.sin(y) * Math.cos(x),
    y: SIZE * Math.sin(y) * Math.sin(x),
    z: SIZE * Math.cos(y)
  };
}

export function findHotspots({ casts }) {
  return casts && casts.filter(c => c.castId === 0) || [];
}

export function generateHotspots(hotspots) {
  let vertices = [];
  let textureCoords = [];
  let indexes = [];

  cubeVertexPositionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexPositionBuffer);

  return hotspots.map((hotspot, i) => {
    const rect = scaleFromHotspotToRad(hotspot);
    const topLeft = cylinderMap(rect.top, rect.left);
    const bottomLeft = cylinderMap(rect.bottom, rect.left);
    const topRight = cylinderMap(rect.top, rect.right);
    const bottomRight = cylinderMap(rect.bottom, rect.right);

    log.info({ hotspot, hotspotRadRect: rect, cylinderMap: {
      topLeft, bottomLeft, topRight, bottomRight
    }}, 'hotspot');

    vertices = vertices.concat([
      bottomLeft.x, bottomLeft.y, bottomLeft.z,
      bottomRight.x, bottomRight.y, bottomRight.z,
      topRight.x, topRight.y, topRight.z,
      topLeft.x, topLeft.y, topLeft.z
    ]);
    textureCoords = textureCoords.concat([
      1.0, 0.0,
      0.0, 0.0,
      0.0, 1.0,
      1.0, 1.0
    ]);
    indexes = indexes.concat([
      0, 1, 2, 0, 2, 3
    ].map(order => 4 * i + order));
    return {
      vertices: new Float32Array(vertices),
      textureCoords: new Float32Array(textureCoords),
      indexes: new Float32Array(indexes)
    };
  });

}

export default function (canvas, sceneData) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

  const renderer = new THREE.WebGLRenderer({ canvas });
  renderer.setSize(canvas.width, canvas.height);

  generateHotspots(findHotspots(canvas)).forEach({ vertices, cu})
  var geometry = new THREE.BufferGeometry();
  var material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
  var cube = new THREE.Mesh( geometry, material );
  scene.add( cube );

  camera.position.z = 5;

  const selfie = {
    animate() {
      function render() {
      	raf( render );
        cube.rotation.x += 0.1;
        cube.rotation.y += 0.1;
      	renderer.render( scene, camera );
      }
      render();
    }
  };

  return selfie;
}
