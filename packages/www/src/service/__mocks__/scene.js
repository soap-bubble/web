import * as sceneFixtures from '../__fixtures__/scenes';

const scene = jest.genMockFromModule('service/scene');

function bySceneId(sceneId) {
  const fixture = sceneFixtures[`scene${sceneId}`] || sceneFixtures.scene1010;
  return Promise.resolve({
    data: fixture,
  });
}

scene.bySceneId = bySceneId;

module.exports = scene;
