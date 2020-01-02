import React, {
  useMemo,
  useRef,
  useState,
  useEffect,
  FunctionComponent,
} from 'react'
import {
  createPortal
} from 'react-dom'
import { Dispatch } from 'redux'
import { cloneDeep, map } from 'lodash'
import { Canvas, useThree, useFrame } from 'react-three-fiber'
import {
  BufferAttribute,
  CylinderBufferGeometry,
  TextureLoader,
  Mesh,
  ShaderMaterial,
  PerspectiveCamera,
  CanvasTexture,
  ShaderMaterialParameters,
  Texture
} from 'three'
import createCanvas from 'utils/canvas'
import panoShader from '../shader/panoChunk'
import { isCastActive, Gamestates } from 'morpheus/gamestate/isActive'
import { VideoController } from './Videos'
import WebGlCanvas from './WebGlCanvas'
import { getAssetUrl } from 'service/gamedb'
import useCastRefNoticer from '../useCastRefNoticer'
import { Scene, PanoCast, MovieSpecialCast, Cast } from '../types'
import { flatten } from 'lodash'
import usePanoChunk, { updateCanvas } from '../hooks/panoChunk'
import { Matcher, forMorpheusType } from '../matchers'
import { and } from 'utils/matchers'
import {
  DST_WIDTH,
  PANO_CANVAS_WIDTH,
  PANO_SCROLL_OVERFLOW
} from '../../constants'

enum SceneType {
  VIDEO,
  IMAGE,
  PANO,
  PANO_ANIM,
}
export type WEBGL_SCENE_TYPE = keyof typeof SceneType

export interface WebGlSceneElement {
  type: WEBGL_SCENE_TYPE
}
export type WebGlScene = WebGlSceneElement[]

const sliceHeight = 0.56
const sliceOffset = (600 / 3072) * Math.PI * 2
// The length of the panorama is a 1024 wide canvas texture which shows a portion of the
// 3076 pixel wide image. The texture is updated every 128 pixels, so the total length
// of the pano is 1024 / 3076 of a circle - 128 / 3076 of a circle
const PANO_LENGTH = 2 * Math.PI * ((DST_WIDTH - PANO_SCROLL_OVERFLOW) / PANO_CANVAS_WIDTH)

interface GlStageProps {
  dispatch: Dispatch
  stageScenes: Scene[]
  enteringScene?: Scene
  exitingScene?: Scene
  gamestates: Gamestates
  volume: number
  top: number
  left: number
  width: number
  height: number
}

function matchActiveCast<T extends Cast>(gamestates: Gamestates): Matcher<T> {
  return (cast: T) => isCastActive({ cast, gamestates })
}

function Camera(props: any) {
  const ref = useRef<PerspectiveCamera>()
  const { setDefaultCamera } = useThree()
  // Make the camera known to the system
  useEffect(() => {
    if (ref.current) setDefaultCamera(ref.current)
  }, [])
  // Update it every frame
  useFrame(() => {
    if (ref.current) ref.current.updateMatrixWorld()
  })
  return <perspectiveCamera ref={ref} {...props} />
}

const WebGlScene = ({
  dispatch,
  width,
  volume,
  height,
  top,
  left,
  gamestates,
  enteringScene,
  exitingScene,
  stageScenes,
}: GlStageProps) => {
  const onStagePano: PanoCast | undefined = useMemo(() => {
    const matchActive = matchActiveCast(gamestates)
    const matchPanoCast = and<PanoCast>(
      forMorpheusType('PanoCast'),
      matchActive,
    )

    let stageActivePanoCasts: undefined | PanoCast
    for (let scene of stageScenes) {
      stageActivePanoCasts = scene.casts.find((cast: Cast) =>
        matchPanoCast(cast as PanoCast),
      ) as undefined | PanoCast
      if (stageActivePanoCasts) break
    }

    return stageActivePanoCasts
  }, [stageScenes, gamestates])
  const panoUrl = onStagePano && getAssetUrl(onStagePano.fileName, 'png')
  const textureLoader = useMemo(() => new TextureLoader(), [])
  const [rotation, setRotation] = useState(0)
  const [texImage, setTexImage] = useState<HTMLImageElement>()
  // const panoCanvas = useMemo(() => createCanvas({
  //   width: 1024,
  //   height: 512,
  // }), [])
  // const fullPanoCanvas = useMemo(() => {
  //   if (texImage) {
  //     const fullPano = createCanvas({
  //       width: 3072,
  //       height: 512,
  //     })
  //     const ctx = fullPano.getContext('2d')
  //     if (ctx) {
  //       ctx.drawImage(texImage, 0, 0, 2048, 512, 0, 0, 2048, 512)
  //       ctx.drawImage(texImage, 0, 512, 1024, 512, 2048, 0, 1024, 512)
  //       return fullPano
  //     }
  //   }
  //   return undefined
  // }, [texImage])
  useEffect(() => {
    if (panoUrl) {
      const tex = textureLoader.load(panoUrl, t => {
        setTexImage(t.image)
      })
      if (tex) {
        tex.flipY = false
      }
    }
  }, [panoUrl, textureLoader])
  const [texture, offsetX] = usePanoChunk(texImage, rotation)
  useEffect(() => {
    const preview = document.getElementById('preview')
    if (preview && texture && texture.image) {
      preview.appendChild(texture.image)
      texture.image.style.top = '0'
      texture.image.style.left = '0'
      texture.image.style.width = '256px'
      texture.image.style.height = '128px'
      return  () => {
        preview.removeChild(texture.image)
      }
    }
  }, [texture && texture.image])
  const ref = useRef<ShaderMaterial>()
  const { camera } = useThree()
 
  useEffect(() => {
    if (camera) {
      camera.lookAt(0, 0, 0)
    }
  }, [camera])
  
  useFrame(() => {
    setRotation((rotation + 1) % 3072)
    if (ref.current) {
      ref.current.uniforms.offset.value = rotation - offsetX
    }
  })
  const shaderArgs = useMemo<[ShaderMaterialParameters]>(() => [cloneDeep(panoShader)], [])
  return (
    <React.Fragment>
      <mesh>
        <cylinderBufferGeometry
          attach="geometry"
          args={[1, 1, sliceHeight * 2, 128, 1, true, -PANO_LENGTH / 2, PANO_LENGTH]}
        />
        <shaderMaterial
          attach="material"
          ref={ref}
          args={shaderArgs}
          uniforms-texture-value={texture}
        />
      </mesh>
    </React.Fragment>
  )
}

const WebGl: FunctionComponent<GlStageProps> = props => (
  <Canvas
    camera={{
      fov: 51.75,
      aspect: 640 / 420,
      near: 0.01,
      far: 1000,
      position: [0, 0, -0.09],
    }}
    style={{
      cursor: 'none',
      left: `${props.left}px`,
      top: `${props.top}px`,
    }}
  >
    <WebGlScene {...props} />
  </Canvas>
)

export default WebGl
