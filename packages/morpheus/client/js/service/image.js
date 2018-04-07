export function loadAsImage(url = '') {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossorigin = 'anonymous';
    img.src = url;
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image ${url}`));
  });
}

export function lint() {}
