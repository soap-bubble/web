export default function linkPreload(url) {
  return new Promise((resolve, reject) => {
    const res = document.createElement('link');
    res.rel = 'preload';
    res.as = 'video';
    res.crossOrigin = 'anonymous';
    res.href = url;
    res.onload = () => resolve(res);
    res.onerror = reject;
    document.head.appendChild(res);
  });
}
