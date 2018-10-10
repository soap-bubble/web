import {
  getAssetUrl,
  getPanoAnimUrl,
} from 'service/gamedb';
import {
  matchers as sceneMatchers,
} from 'morpheus/scene';
import {
  loadAsImage,
  loadAsVideo,
} from '../contextProviders';

export default function ({
  scene,
  gamestates,
}) {
  const assets = [];
  const panoCastData = sceneMatchers.panoCastData(scene);
  const videoCastsData = sceneMatchers.panoAnimData(scene).filter(
    cast => sceneMatchers.isEnabledCast({
      cast,
      gamestates,
    }),
  );
  // background
  if (panoCastData) {
    const { fileName } = panoCastData;
    const asset = getAssetUrl(`${fileName}.png`);
    assets.push(loadAsImage({
      url: asset,
      data: panoCastData,
      renderer({
        srcContext,
        dstContext,
      }) {
        dstContext.drawImage(srcContext, 0, 0);
      },
      canvasInit({
        image,
        canvas,
      }) {
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(image, 0, 0);
      },
    }));
  }
  // PanoAnims
  if (videoCastsData && videoCastsData.length) {
    videoCastsData.forEach((videoCastData) => {
      const {
        fileName,
        looping,
        location: {
          x,
          y,
        },
        frame,
      } = videoCastData;
      assets.push(loadAsVideo({
        url: getPanoAnimUrl(fileName),
        data: videoCastData,
        videoOptions: { loop: looping },
        renderer({
          srcContext,
          dstContext,
        }) {
          if (frame < 16) {
            dstContext.drawImage(srcContext, x + (frame * 128), y);
          } else {
            dstContext.drawImage(srcContext, x + ((frame - 16) * 128), y + 512);
          }
        },
      }));
    });
  }
  return assets;
}
