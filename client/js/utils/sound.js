export default function createSound(url, options) {
  const sound = document.createElement('sound');
  sound.crossOrigin = 'anonymous';
  sound.src = url;
  Object.assign(sound, options);
  return sound;
}
