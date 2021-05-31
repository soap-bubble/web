import { getAssetUrl, getPanoAnimUrl } from 'service/gamedb'
import raf from 'raf'
import { matchers as sceneMatchers } from 'morpheus/scene'
import {
  PANO_CHUNK,
  DST_RATIO,
  DST_WIDTH,
  DST_HEIGHT,
  PANO_CANVAS_WIDTH,
  DST_PANO_RATIO,
} from 'morpheus/constants'
import createCanvas from 'utils/canvas'
import { loadAsImage, loadAsVideo } from '../contextProviders'

const twentyFourthRad = Math.PI / 24
const PI2 = Math.PI * 2

export default ({ scene, canvasTexture, onVideoEndFactory }) => {
  const assets = []

  function existsInAssets(cast) {
    return assets.find(a => a.data === cast)
  }

  return {
    play() {
      assets
        .filter(a => a.video)
        .forEach(({ promise }) =>
          promise.then(el => {
            el.play()
          }),
        )
    },
    load(gamestates, volume) {
      const panoCastData = sceneMatchers.panoCastData(scene)
      const videoCastsData = sceneMatchers.panoAnimData(scene).filter(
        cast =>
          !existsInAssets(cast) &&
          sceneMatchers.isEnabledCast({
            cast,
            gamestates,
          }),
      )

      if (panoCastData && !existsInAssets(panoCastData)) {
        const { fileName } = panoCastData
        const asset = getAssetUrl(`${fileName}.png`)
        assets.push(
          loadAsImage({
            url: asset,
            data: panoCastData,
            video: false,
            renderer({ srcContext, dstContext, rotation: { morpheusX: x } }) {
              if (x > PANO_CANVAS_WIDTH - PANO_CHUNK) {
                const firstChunkWidth = PANO_CANVAS_WIDTH - x
                const firstChunkWidthMorpheus = PANO_CHUNK - firstChunkWidth
                const secondChunkWidth =
                  firstChunkWidthMorpheus * DST_PANO_RATIO
                const secondChunkOffset = DST_WIDTH - secondChunkWidth
                dstContext.drawImage(
                  srcContext,
                  x,
                  0,
                  PANO_CHUNK,
                  DST_HEIGHT,
                  0,
                  0,
                  DST_WIDTH,
                  DST_HEIGHT,
                )
                dstContext.drawImage(
                  srcContext,
                  0,
                  0,
                  firstChunkWidthMorpheus,
                  DST_HEIGHT,
                  secondChunkOffset,
                  0,
                  secondChunkWidth,
                  DST_HEIGHT,
                )
              } else {
                dstContext.drawImage(
                  srcContext,
                  x,
                  0,
                  PANO_CHUNK,
                  DST_HEIGHT,
                  0,
                  0,
                  DST_WIDTH,
                  DST_HEIGHT,
                )
              }
            },
            canvasInit({ image, canvas }) {
              canvas.width = 3072
              canvas.height = 512

              const ctx = canvas.getContext('2d')
              ctx.drawImage(image, 0, 0, 2048, 512, 0, 0, 2048, 512)
              ctx.drawImage(image, 0, 512, 1024, 512, 2048, 0, 1024, 512)
              canvasTexture.needsUpdate = true
            },
          }),
        )
      }

      // PanoAnims
      if (videoCastsData && videoCastsData.length) {
        videoCastsData.forEach(videoCastData => {
          const {
            fileName,
            looping,
            location: { x, y },
            width,
            height,
            frame,
          } = videoCastData
          const onended = onVideoEndFactory(videoCastData)
          let lastCurrentTime
          const videoAsset = loadAsVideo({
            url: getPanoAnimUrl(fileName),
            data: videoCastData,
            video: true,
            videoOptions: {
              loop: looping,
              volume,
              onended,
            },
            renderer({ srcContext, dstContext, rotation }) {
              const frameX = frame * 128 + x
              const offsetX = (frameX - rotation.morpheusX) * DST_PANO_RATIO
              dstContext.drawImage(
                srcContext,
                0,
                0,
                width,
                height,
                offsetX,
                y,
                width * DST_PANO_RATIO,
                height,
              )
            },
          })
          videoAsset.promise.then(video => {
            const needsUpdate = () => {
              if (video.currentTime !== lastCurrentTime) {
                canvasTexture.needsUpdate = true
              }
              if (!videoAsset.disposed) {
                raf(needsUpdate)
              }
            }
            raf(needsUpdate)
          })
          assets.push(videoAsset)
        })
      }
      return assets
    },
    dispose() {
      assets
        .filter(a => a.video)
        .forEach(asset => {
          const { context: video } = asset
          video.src = null
          video.onended = null
          asset.disposed = true
        })
    },
  }
}
