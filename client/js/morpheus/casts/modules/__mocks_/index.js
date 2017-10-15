let _testMods = {};

module.exports = ['hotspot', 'sound', 'special', 'panoAnim', 'pano'].reduce((memo, curr) => {
  const mockMod = jest.genMockFromModule(`../${curr}`);
  function aMod() {
    return _testMods[curr] ? _testMods[curr] : mockMod;
  }
  memo[curr] = {
    get delegate() {
      return scene => aMod().delegate(scene);
    },
    get actions() {
      return scene => aMod().actions(scene);
    },
    get selectors() {
      return scene => aMod().selectors(scene);
    },
  };
  mockMod.delegate = jest.fn(() => ({
    applies: jest.fn(() => false),
  }));
  return memo;
}, {});

module.exports.default = {
  inject(name, testModule) {
    _testMods[name] = testModule;
  },
  enable(name) {
    // eslint-disable-next-line import/no-dynamic-require, global-require
    _testMods[name] = require.requireActual(`./${name}`);
  },
  reset() {
    _testMods = {};
  },
};
