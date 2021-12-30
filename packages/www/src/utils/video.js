import uasParser from 'ua-parser-js';

const userAgentString = (global.navigator && global.navigator.userAgent) || '';
const uas = uasParser(userAgentString);

export function addSourceToVideo(element, src, type) {
  const source = document.createElement('source');

  source.src = src;
  source.type = type;

  element.appendChild(source);
}

export function createVideo(url, options) {
  const video = document.createElement('video');
  video.crossOrigin = 'anonymous';
  video.setAttribute('webkit-playsinline', 'webkit-playsinline');
  Object.assign(video, options);
  if (uas.browser.name.indexOf('Safari') !== -1) {
    addSourceToVideo(video, `${url}.mp4`, 'video/mp4');
  } else {
    addSourceToVideo(video, `${url}.webm`, 'video/webm');
  }
  return video;
}

export function promiseVideoElement(name, options) {
  return new Promise((resolve, reject) => {
    const video = createVideo(name, {
      ...options,
      defaultMuted: true,
      autoplay: true,
      oncanplaythrough() {
        resolve(video);
      },
      onerror: reject,
    });
  });
}
