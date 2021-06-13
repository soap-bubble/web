export function addSourceToSound(element, src, type) {
  const source = document.createElement('source');

  source.src = src;
  source.type = type;

  element.appendChild(source);
}

export function createSound(url, options) {
  const video = document.createElement('audio');
  video.crossOrigin = 'anonymous';
  Object.assign(video, options);
  addSourceToSound(video, `${url}.aac`, 'audio/aac');
  addSourceToSound(video, `${url}.mp3`, 'audio/mp3');
  return video;
}
