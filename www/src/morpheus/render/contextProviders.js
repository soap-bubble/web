import createCanvas from 'utils/canvas';
import {
  promiseVideoElement,
} from 'utils/video';
import {
  loadAsImage as promiseImageElement,
} from 'service/image';

function drawToCanvas({
  video,
  canvas,
}) {
  canvas.width = video.width;
  canvas.height = video.height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(video, 0, 0, video.width, video.height);
}

export function loadAsVideo({
  url = '',
  canvasFactory = createCanvas,
  canvasInit = drawToCanvas,
  videoOptions = {},
  renderer = () => {},
  ...rest
}) {
  let videoHasLoaded = false;
  let video;
  let canvas;
  const promiseVideo = promiseVideoElement(url, videoOptions);

  function provideCanvas() {
    if (!canvas) {
      canvas = canvasFactory();
    }
    return canvas;
  }
  const selfie = {
    get context() {
      if (videoHasLoaded) {
        return video;
      }
      return provideCanvas();
    },
    render(dstContext, rotation) {
      return renderer({
        srcContext: selfie.context,
        dstContext,
        rotation,
      });
    },
    promise: promiseVideo
      .then((vid) => {
        canvasInit({
          canvas: provideCanvas(),
          video: vid,
        });
        video = vid;
        videoHasLoaded = true;
        return vid;
      }),
    ...rest,
  };
  return selfie;
}

export function loadAsImage({
  url = '',
  canvasFactory = createCanvas,
  canvasInit = ({
    image,
    canvas,
  }) => {
    canvas.width = image.width;
    canvas.height = image.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(image, 0, 0, image.width, image.height);
  },
  renderer = () => {},
  ...rest
} = {}) {
  let canvas;
  const promiseImage = promiseImageElement(url);

  function provideCanvas() {
    if (!canvas) {
      canvas = canvasFactory();
    }
    return canvas;
  }
  const selfie = {
    get context() {
      return provideCanvas();
    },
    render(dstContext, rotation) {
      return renderer({
        srcContext: selfie.context,
        dstContext,
        rotation,
      });
    },
    promise: promiseImage
      .then((img) => {
        canvasInit({
          canvas: provideCanvas(),
          image: img,
        });
        return img;
      }),
    ...rest,
  };
  return selfie;
}
