import React, {
  useMemo,
  useRef,
  useState,
  useEffect,
  FunctionComponent,
  useCallback,
} from 'react'
import { Dispatch } from 'redux'
import { cloneDeep, map } from 'lodash'
import { Canvas, PointerEvent, useThree, useFrame } from '@react-three/fiber'
import {
  BufferAttribute,
  CylinderBufferGeometry,
  TextureLoader,
  Mesh,
  ShaderMaterial,
  PerspectiveCamera,
  CanvasTexture,
  ShaderMaterialParameters,
  Texture,
  Camera,
  Object3D,
} from 'three'
import createCanvas from 'utils/canvas'
import panoShader from '../shader/panoChunk'
import { isCastActive, Gamestates } from 'morpheus/gamestate/isActive'
import { VideoController } from './Videos'
import { getAssetUrl } from 'service/gamedb'
import useCastRefNoticer from '../hooks/useCastRefNoticer'
import { Scene, PanoCast, MovieSpecialCast, Cast } from '../types'
import { flatten } from 'lodash'
import usePanoChunk from '../hooks/panoChunk'
import usePanoMomentum from '../hooks/panoMomentum'
import { usePointerEvents } from 'morpheus/hotspot/eventInterface'
import { Matcher, forMorpheusType } from '../matchers'
import { and } from 'utils/matchers'
import { PANO_OFFSET, PANO_CANVAS_WIDTH } from '../../constants'

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
const PANO_LENGTH = 2 * Math.PI * PANO_OFFSET

const clampNumber = (num: number, a: number, b: number) =>
  Math.max(Math.min(num, Math.max(a, b)), Math.min(a, b))

const step = (num: number, max: number) => {
  if (num > max) {
    return num - max
  } else if (num < 0) {
    return num + max
  }
  return num
}
interface GlStageProps {
  dispatch: Dispatch
  stageScenes: Scene[]
  enteringScene?: Scene
  exitingScene?: Scene
  gamestates: Gamestates
  setCamera: (c: Camera | undefined) => void
  setPanoObject: (o: Object3D | undefined) => void
  rotation: { x: number; y: number; offsetX: number }
  volume: number
  top: number
  left: number
  width: number
  height: number
}

function matchActiveCast<T extends Cast>(gamestates: Gamestates): Matcher<T> {
  return (cast: T) => isCastActive({ cast, gamestates })
}

const WebGlScene = ({
  dispatch,
  width,
  volume,
  height,
  top,
  left,
  rotation,
  gamestates,
  setCamera,
  setPanoObject,
  enteringScene,
  exitingScene,
  stageScenes,
}: GlStageProps) => {
  const onStagePano: PanoCast | undefined = useMemo(() => {
    const matchActive = matchActiveCast(gamestates)
    const matchPanoCast = and<PanoCast>(
      forMorpheusType('PanoCast'),
      matchActive
    )

    let stageActivePanoCasts: undefined | PanoCast
    for (let scene of stageScenes) {
      stageActivePanoCasts = scene.casts.find((cast: Cast) =>
        matchPanoCast(cast as PanoCast)
      ) as undefined | PanoCast
      if (stageActivePanoCasts) break
    }

    return stageActivePanoCasts
  }, [stageScenes, gamestates])
  const meshRef = useRef<Mesh>()
  const panoUrl = onStagePano && getAssetUrl(onStagePano.fileName, 'png')
  const textureLoader = useMemo(() => new TextureLoader(), [])
  const [texImage, setTexImage] = useState<HTMLImageElement>()
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
  const texture = usePanoChunk(texImage, rotation.offsetX)
  const ref = useRef<ShaderMaterial>()
  const { camera } = useThree()

  useEffect(() => {
    if (camera) {
      camera.lookAt(0, 0, 1)
    }
    setCamera(camera)
  }, [camera])
  useEffect(() => {
    setPanoObject(meshRef.current)
  }, [meshRef.current])

  // const panoInput = usePanoInput(
  //   dispatch,
  //   meshRef.current,
  //   camera,
  //   (stageScenes.length && stageScenes[stageScenes.length - 1]) || undefined,
  //   top,
  //   left,
  //   width,
  //   height,
  //   offsetX,
  //   rotation.x
  // )
  // const momentumInput = usePanoMomentum(5, 100)
  // const pointerEvents = usePointerEvents(
  //   {
  //     onPointerDown: panoInput.onPointerDown,
  //     onPointerMove: panoInput.onPointerMove,
  //     onPointerUp: panoInput.onPointerUp,
  //   },
  //   {
  //     onPointerDown: momentumInput.onPointerDown,
  //     onPointerMove: momentumInput.onPointerMove,
  //     onPointerUp: momentumInput.onPointerUp,
  //     onPointerOut: momentumInput.onPointerOut,
  //     onPointerLeave: momentumInput.onPointerLeave,
  //   }
  // )
  // const {
  //   onPointerDown,
  //   onPointerMove,
  //   onPointerUp,
  //   onPointerLeave,
  // } = pointerEvents
  // const { delta } = momentumInput
  useFrame(() => {
    if (ref.current) {
      const offset = rotation.x - rotation.offsetX
      ref.current.uniforms.offset.value = offset
    }
    if (meshRef.current) {
      meshRef.current.rotation.x = rotation.y
    }
  })
  const shaderArgs = useMemo<[ShaderMaterialParameters]>(
    () => [cloneDeep(panoShader)],
    []
  )
  return (
    <React.Fragment>
      <mesh ref={meshRef}>
        <cylinderBufferGeometry
          attach="geometry"
          args={[
            1,
            1,
            sliceHeight * 2,
            128,
            1,
            true,
            -PANO_LENGTH / PANO_CANVAS_WIDTH / 2,
            PANO_LENGTH / PANO_CANVAS_WIDTH,
          ]}
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
      position: [0, 0, 0.09],
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
