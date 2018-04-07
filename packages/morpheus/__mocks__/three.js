const THREE = jest.genMockFromModule('three');

const fakeLoader = () => ({
  load: jest.fn((asset, success) => {
    setTimeout(success);
  }),
});

THREE.TextureLoader = jest.fn(fakeLoader);
const _Mesh = THREE.Mesh;
THREE.Mesh = jest.fn(() => {
  const mesh = new _Mesh();
  mesh.rotation = { x: 0, y: 0, z: 0 };
  return mesh;
});
const _Object3D = THREE.Object3D;
THREE.Object3D = jest.fn(() => {
  const object3D = new _Object3D();
  object3D.rotation = { x: 0, y: 0, z: 0 };
  return object3D;
});
const _Scene = THREE.Scene;
THREE.Scene = jest.fn(() => {
  const scene = new _Scene();
  scene.rotation = { x: 0, y: 0, z: 0 };
  return scene;
});
const _Geometry = THREE.Geometry;
THREE.Geometry = jest.fn(() => {
  const geometry = new _Geometry();
  geometry.vertices = [];
  geometry.faces = [];
  return geometry;
});
module.exports = THREE;
