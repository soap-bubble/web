const mockCanvasUtils = jest.genMockFromModule('../canvas');

Object.assign(exports, mockCanvasUtils);

const instances = exports.instances = [];
exports.reset = () => {
  instances.forEach(instances.shift.bind(instances));
};

exports.default = jest.fn().mockImplementation(() => {
  const mockContext = {
    drawImage: jest.fn(),
  };

  const mockCanvas = {
    getContext: jest.fn().mockReturnValue(mockContext),
    style: {},
    mockContext,
  };

  instances.push(mockCanvas);
  return mockCanvas;
});
