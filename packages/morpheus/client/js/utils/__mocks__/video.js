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

video.promiseVideoElement = (...args) => Promise.resolve(video.createVideo(...args));

module.exports = video;
