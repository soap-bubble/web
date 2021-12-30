const actions = module.exports = jest.genMockFromModule('../actions');

actions.resize = jest.fn(() => () => {});
