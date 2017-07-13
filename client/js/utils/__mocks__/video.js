const video = jest.genMockFromModule('utils/video');

video.createVideo = jest.fn((name, opts) => {
  const fakeVideo = {
    src: name,
    ...opts,
  };
  if (opts.canplaythrough) {
    setTimeout(opts.canplaythrough());
  }
  return fakeVideo;
});

module.exports = video;
