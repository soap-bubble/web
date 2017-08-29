module.exports = ['hotspot', 'sound', 'special', 'panoAnim', 'pano'].reduce((memo, curr) => {
  const mod = memo[curr] = jest.genMockFromModule(`../${curr}`);
  mod.delegate = jest.fn(() => ({
    applies: jest.fn(() => false),
  }));
  return memo;
}, {});
