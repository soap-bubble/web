const image = jest.genMockFromModule('../image');

const instances = image.instances = [];

image.loadAsImage = jest.fn((name) => {
  const fakeImage = Promise.resolve({
    src: name,
  });
  instances.push(instances);
  return fakeImage;
});

image.reset = () => {
  instances.forEach(() => instances.shift());
};

module.exports = image;
