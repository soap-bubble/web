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
        canvas.width = image.width * 1.5;
        canvas.height = image.height / 2;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(image,
          0, 0, image.width, canvas.height, 0, 0, image.width, canvas.height);
        ctx.drawImage(image,
          image.width, canvas.height, image.width / 2, 0, canvas.height, image.height);
      },
    }));
  }
  // PanoAnims
  if (videoCastsData && videoCastsData.length) {
    videoCastsData.forEach((videoCastData) => {
      const {
        fileName,
        looping,
        position: {
          x,
          y,
        },
      } = videoCastData;
      assets.push(loadAsVideo({
        url: getPanoAnimUrl(fileName),
        videoOptions: { loop: looping },
        renderer({
          srcContext,
          dstContext,
        }) {
          dstContext.drawImage(srcContext, x, y);
        },
      }));
    });
  }
  return assets;
}
