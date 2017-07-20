const THREE = jest.genMockFromModule('three');

const fakeObjConstructor = () => ({
  rotation: { x: 0, y: 0, z: 0 },
  add: jest.fn(),
});

const fakeLoader = () => ({
  load: jest.fn((asset, success, progress, error) => {
    setTimeout(success);
  }),
});

THREE.TextureLoader = jest.fn(fakeLoader);
THREE.Mesh = jest.fn(fakeObjConstructor);
THREE.Object3D = jest.fn(fakeObjConstructor);

module.exports = THREE;
