import THREE, {
  BufferAttribute,
  Uint16Attribute,
  Color
} from 'three';
import wagner from 'wagner-core';
import raf from 'raf';
import logger from '../utils/logger';
import { range } from 'lodash';

const log = logger('hotspot');

function pad(value, length) {
    return (value.toString().length < length) ? pad("0"+value, length):value;
}

const SCALE_FACTOR = 1.0;

const HOTSPOT_X_OFFSET = Math.PI/3;
const HOTSPOT_X_COORD_FACTOR = Math.PI / -1800;
const HOTSPOT_Y_COORD_FACTOR = 0.004 * SCALE_FACTOR;
const SIZE = 0.99 * SCALE_FACTOR;

function scaleFromHotspotToRad(h) {
  const v = Math.asin(HOTSPOT_Y_COORD_FACTOR / SIZE);
  return {
    left: HOTSPOT_X_COORD_FACTOR * h.rectLeft + HOTSPOT_X_OFFSET,
    right: HOTSPOT_X_COORD_FACTOR * h.rectRight + HOTSPOT_X_OFFSET,
    top: HOTSPOT_Y_COORD_FACTOR * h.rectTop,
    bottom: HOTSPOT_Y_COORD_FACTOR * h.rectBottom
  };
}

function cylinderMap(y, x) {
  return {
    x: SIZE * Math.sin(x),
    y,
    z: SIZE * Math.cos(x)
  };
}

function hotspotMap(y, x) {
  return {
    x: x / 450 - 4,
    y: -y / 500,
    z: 0
  };
}

export function findHotspots({ casts }) {
  return casts.filter(c => c.castId === 0);
}

export function generateHotspots(hotspots) {
  var positions = new BufferAttribute( new Float32Array( hotspots.length * 12 ), 3 );
  var normals = new BufferAttribute( new Float32Array( hotspots.length * 12 ), 3 );
  var uvs = new BufferAttribute( new Float32Array( hotspots.length * 8 ), 2 );
  var indices = [];

  hotspots.forEach((hotspot, index) => {
    const rect = scaleFromHotspotToRad(hotspot);
    const topLeft = cylinderMap(rect.top, rect.left);
    const bottomLeft = cylinderMap(rect.bottom, rect.left);
    const topRight = cylinderMap(rect.top, rect.right);
    const bottomRight = cylinderMap(rect.bottom, rect.right);
    // const topLeft = hotspotMap(hotspot.rectTop, hotspot.rectLeft);
    // const bottomLeft = hotspotMap(hotspot.rectBottom, hotspot.rectLeft);
    // const topRight = hotspotMap(hotspot.rectTop, hotspot.rectRight);
    // const bottomRight = hotspotMap(hotspot.rectBottom, hotspot.rectRight);

    // log.info({ hotspot, hotspotRadRect: rect, cylinderMap: {
    //   topLeft, bottomLeft, topRight, bottomRight
    // }}, 'hotspot');

    const indexMap = {
      bottomLeft: index * 4,
      bottomRight: index * 4 + 1,
      topRight: index * 4 + 2,
      topLeft: index * 4 + 3
    };

    positions.setXYZ(indexMap.bottomLeft, bottomLeft.x, bottomLeft.y, bottomLeft.z);
    //uvs.setXY(indexMap.bottomLeft, 0.0, 0.0);
    positions.setXYZ(indexMap.bottomRight, bottomRight.x, bottomRight.y, bottomRight.z)
    //uvs.setXY(indexMap.bottomRight, 1.0, 0.0);
    positions.setXYZ(indexMap.topRight, topRight.x, topRight.y, topRight.z);
    //uvs.setXY(indexMap.topRight, 1.0, 1.0);
    positions.setXYZ(indexMap.topLeft, topLeft.x, topLeft.y, topLeft.z);
    //uvs.setXY(indexMap.topLeft, 0.0, 1.0);

    indices.push(
      indexMap.bottomLeft, indexMap.bottomRight, indexMap.topRight,
      indexMap.bottomLeft, indexMap.topRight, indexMap.topLeft
    );
  });
  var geometry = new THREE.BufferGeometry();;
  geometry.setIndex(new Uint16Attribute(indices, 1));
  geometry.addAttribute('position', positions);
  // geometry.addAttribute('uvs', uvs);

  var material = new THREE.MeshBasicMaterial( { transparent: true, opacity: 0.3, color: 0x00ff00, side: THREE.DoubleSide } );
  return new THREE.Mesh(geometry, material);
}

const twentyFourthRad = 15 / 180 * Math.PI;
const sliceWidth = 0.1325 * SCALE_FACTOR;
const sliceHeight = 0.55 * SCALE_FACTOR;
const sliceDepth = 1.0 * SCALE_FACTOR;

export function generatePano({ casts }) {
  const panoCast = casts.find(c => c.__t === 'PanoCast');
  const fileNames = range(1, 25)
    .map(digit => `${panoCast.fileName}.${pad(digit, 2)}.png`)
  const group = new THREE.Object3D()
  fileNames.forEach((f, index) => {
      var geometry = new THREE.BufferGeometry();
      // create a simple square shape. We duplicate the top left and bottom right
      // vertices because each vertex needs to appear once per triangle.
      var positions = new BufferAttribute(new Float32Array( [
        -sliceWidth, -sliceHeight,  sliceDepth,
        sliceWidth, -sliceHeight,  sliceDepth,
        sliceWidth,  sliceHeight,  sliceDepth,
        -sliceWidth,  sliceHeight,  sliceDepth
      ]), 3);
      var uvs = new BufferAttribute(new Float32Array([
        0.0, 0.0,
        1.0, 0.0,
        1.0, 1.0,
        0.0, 1.0
      ]), 2);

      var indices = new Uint16Attribute([
        0, 1, 2,      0, 2, 3,    // Front face
      ], 1);

      // itemSize = 3 because there are 3 values (components) per vertex
      geometry.setIndex(indices);
      geometry.addAttribute('uv', uvs);
      geometry.addAttribute('position', positions);
      var material = new THREE.MeshBasicMaterial( { side: THREE.BackSide, map: THREE.ImageUtils.loadTexture(f) } );
      var mesh = new THREE.Mesh( geometry, material );
      mesh.rotation.y = (index - 0.5) * twentyFourthRad;
      group.add(mesh);
    });
    return group;
}

export default function (canvas, sceneData) {
  const { width, height } = canvas;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera( 55, width / height, 0.01, 1000 );

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true });
  renderer.setSize(width, height);
  renderer.setClearColor( 0x000000, 0 );

  const hotspots = generateHotspots(findHotspots(sceneData));
  scene.add( hotspots );

  const pano = generatePano(sceneData);
  scene.add(pano);

  // (function () {
  //   var geometry = new THREE.BufferGeometry();
  //   // create a simple square shape. We duplicate the top left and bottom right
  //   // vertices because each vertex needs to appear once per triangle.
  //   var vertices = new Float32Array( [
  //   	-1.0, -1.0,  1.0,
  //   	 1.0, -1.0,  1.0,
  //   	 1.0,  1.0,  1.0,
  //
  //   	 1.0,  1.0,  1.0,
  //   	-1.0,  1.0,  1.0,
  //   	-1.0, -1.0,  1.0
  //   ] );
  //
  //   // itemSize = 3 because there are 3 values (components) per vertex
  //   geometry.addAttribute( 'position', new THREE.BufferAttribute( vertices, 3 ) );
  //   var material = new THREE.MeshBasicMaterial( { color: 0xff0000 } );
  //   var mesh = new THREE.Mesh( geometry, material );
  //   scene.add(mesh);
  // }())

  camera.position.z = -0.20;

  const selfie = {
    animate() {
      function render() {
      	raf( render );
        hotspots.rotation.y += 0.005;
        pano.rotation.y += 0.005;
      	renderer.render( scene, camera );
      }
      render();
      //renderer.render( scene, camera );
    }
  };

  return selfie;
}
