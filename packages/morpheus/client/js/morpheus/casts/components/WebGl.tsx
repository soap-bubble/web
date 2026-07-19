import {
  Fragment,
  useMemo,
  useRef,
  useState,
  useEffect,
  FunctionComponent,
  useCallback,
} from 'react'
import { Dispatch } from 'redux'
import { cloneDeep, map } from 'lodash'
import { Canvas, useThree, useFrame } from '@react-three/fiber'
import {
  TextureLoader,
  Mesh,
  ShaderMaterial,
  ShaderMaterialParameters,
  Camera,
  Object3D,
  Texture,
} from 'three'
import panoShader from '../shader/panoChunk'
import { isCastActive, Gamestates } from 'morpheus/gamestate/isActive'
import { getAssetUrl } from 'service/gamedb'
import { Scene, PanoCast, PanoAnim, Cast } from '../types'
import usePanoChunk, {
  PanoAnimationMediaLayer,
} from '../hooks/panoChunk'
import { getActivePanoAnimations } from '../panoAnimation'
import { Matcher, forMorpheusType } from '../matchers'
import { and } from 'utils/matchers'
import { PANO_OFFSET, PANO_CANVAS_WIDTH } from '../../constants'
import loggerFactory from 'utils/logger'
import type { SceneTransitionRequest } from '../../scene/types'
import { isNavigableSceneTarget } from '../../scene/transitionTarget'

const logger = loggerFactory('WebGl')

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
  stageScenes: Scene[]
  pendingScenes?: Scene[]
  enteringScene?: Scene
  exitingScene?: Scene
  gamestates: Gamestates
  setCamera: (c: Camera | undefined) => void
  setPanoObject: (o: Object3D | undefined) => void
  rotation: { x: number; y: number; offsetX: number }
  volume: number
  onSceneReady?: (sceneId: number) => void
  onTransition?: (transition: SceneTransitionRequest) => void
}

function matchActiveCast<T extends Cast>(gamestates: Gamestates): Matcher<T> {
  return (cast: T) => isCastActive({ cast, gamestates })
}

function findActivePanoScene(
  stageScenes: readonly Scene[],
  gamestates: Gamestates
): Scene | undefined {
  return stageScenes.find(scene =>
    scene.casts.some(
      cast =>
        cast.__t === 'PanoCast' && isCastActive({ cast, gamestates })
    )
  )
}

const WebGlScene = ({
  rotation,
  gamestates,
  setCamera,
  setPanoObject,
  enteringScene,
  exitingScene,
  stageScenes,
  pendingScenes = [],
  onSceneReady,
  animationLayers,
}: GlStageProps & {
  animationLayers: readonly PanoAnimationMediaLayer[]
}) => {
  const onStagePano: PanoCast | undefined = useMemo(() => {
    const panoScene = findActivePanoScene(stageScenes, gamestates)
    return panoScene?.casts.find(
      (cast): cast is PanoCast =>
        cast.__t === 'PanoCast' && isCastActive({ cast, gamestates })
    )
  }, [stageScenes, gamestates])

  // Find pano casts in pending scenes for preloading
  const pendingPanoCasts = useMemo(() => {
    const matchActive = matchActiveCast(gamestates)
    const matchPanoCast = and<PanoCast>(
      forMorpheusType('PanoCast'),
      matchActive
    )
    return pendingScenes.map(scene => {
      const panoCast = scene.casts.find((cast: Cast) =>
        matchPanoCast(cast as PanoCast)
      ) as PanoCast | undefined
      return { sceneId: scene.sceneId, panoCast }
    }).filter(item => item.panoCast !== undefined) as { sceneId: number; panoCast: PanoCast }[]
  }, [pendingScenes, gamestates])

  const meshRef = useRef<Mesh | null>(null)
  const panoUrl = onStagePano && getAssetUrl(onStagePano.fileName, 'png')
  const textureLoader = useMemo(() => new TextureLoader(), [])
  const [texImage, setTexImage] = useState<HTMLImageElement>()

  // Track which pending scenes have their textures ready
  const pendingSceneReadyRef = useRef<Set<number>>(new Set())
  const [preloadedTextures, setPreloadedTextures] = useState<Map<number, HTMLImageElement>>(new Map())

  // Preload textures for pending scenes
  useEffect(() => {
    if (!pendingPanoCasts.length) return

    for (const { sceneId, panoCast } of pendingPanoCasts) {
      if (pendingSceneReadyRef.current.has(sceneId)) continue
      if (preloadedTextures.has(sceneId)) continue

      const url = getAssetUrl(panoCast.fileName, 'png')
      logger.info({ sceneId, url }, 'Preloading pano texture for pending scene')
      
      textureLoader.load(url, (tex) => {
        tex.flipY = false
        setPreloadedTextures(prev => new Map(prev).set(sceneId, tex.image))
        logger.info({ sceneId }, 'Pending scene pano texture ready')
      })
    }
  }, [pendingPanoCasts, textureLoader, preloadedTextures])

  // Notify when pending scene textures are ready
  useEffect(() => {
    if (!onSceneReady) return

    for (const { sceneId } of pendingPanoCasts) {
      if (pendingSceneReadyRef.current.has(sceneId)) continue
      if (preloadedTextures.has(sceneId)) {
        pendingSceneReadyRef.current.add(sceneId)
        onSceneReady(sceneId)
      }
    }
  }, [pendingPanoCasts, preloadedTextures, onSceneReady])

  // Reset ready tracking when pending scenes change
  useEffect(() => {
    const currentPendingIds = new Set(pendingScenes.map(s => s.sceneId))
    for (const id of pendingSceneReadyRef.current) {
      if (!currentPendingIds.has(id)) {
        pendingSceneReadyRef.current.delete(id)
      }
    }
    // Clean up preloaded textures for scenes no longer pending
    setPreloadedTextures(prev => {
      const next = new Map(prev)
      for (const id of next.keys()) {
        if (!currentPendingIds.has(id)) {
          next.delete(id)
        }
      }
      return next
    })
  }, [pendingScenes])

  useEffect(() => {
    if (panoUrl) {
      const tex = textureLoader.load(panoUrl, (t) => {
        setTexImage(t.image)
      })
      if (tex) {
        tex.flipY = false
      }
    }
  }, [panoUrl, textureLoader])
  const { texture, updateAnimationFrames } = usePanoChunk(
    texImage,
    rotation.offsetX,
    animationLayers
  )
  const ref = useRef<ShaderMaterial>(null)
  const { camera } = useThree()

  useEffect(() => {
    if (camera) {
      camera.lookAt(0, 0, 1)
    }
    setCamera(camera)
  }, [camera])

  useFrame(() => {
    updateAnimationFrames()
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

  // IMPORTANT: this ref callback must be stable. If it's recreated every render,
  // React will call the previous ref with `null` and the new ref with the object,
  // which would repeatedly trigger `setPanoObject` and cause an update loop.
  const handleMeshRef = useCallback(
    (object: Mesh | null) => {
      if (meshRef.current === object) {
        return
      }
      meshRef.current = object
      setPanoObject(object ?? undefined)
    },
    [setPanoObject]
  )
  return (
    <Fragment>
      <mesh ref={handleMeshRef}>
        <cylinderGeometry
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
          uniforms-panoTexture-value={texture}
        />
      </mesh>
    </Fragment>
  )
}

interface PanoAnimationVideoProps {
  cast: PanoAnim
  onEnded: (cast: PanoAnim) => void
  onMediaRef: (castId: number, media: HTMLVideoElement | null) => void
}

const PanoAnimationVideo = ({
  cast,
  onEnded,
  onMediaRef,
}: PanoAnimationVideoProps) => {
  const mediaRef = useRef<HTMLVideoElement | null>(null)
  const handleMediaRef = useCallback(
    (media: HTMLVideoElement | null) => {
      mediaRef.current = media
      onMediaRef(cast.castId, media)
    },
    [cast.castId, onMediaRef]
  )

  useEffect(() => {
    const media = mediaRef.current
    if (!media) {
      return
    }
    if (cast.looping || cast.actionAtEnd !== 0) {
      void media.play().catch(() => undefined)
    } else {
      media.pause()
    }
  }, [cast.actionAtEnd, cast.looping])

  return (
    <video
      ref={handleMediaRef}
      style={{ display: 'none' }}
      autoPlay={cast.looping || cast.actionAtEnd !== 0}
      crossOrigin="anonymous"
      loop={cast.looping}
      muted
      playsInline
      preload="auto"
      onEnded={() => onEnded(cast)}
    >
      <source src={getAssetUrl(`${cast.fileName}.webm`)} type="video/webm" />
      <source src={getAssetUrl(`${cast.fileName}.mp4`)} type="video/mp4" />
    </video>
  )
}

const WebGl: FunctionComponent<
  GlStageProps & {
    width: number
    height: number
    left: number
    top: number
  }
> = props => {
  const activePanoScene = useMemo(
    () => findActivePanoScene(props.stageScenes, props.gamestates),
    [props.gamestates, props.stageScenes]
  )
  const activePanoAnimations = useMemo(
    () =>
      activePanoScene
        ? getActivePanoAnimations(activePanoScene.casts, props.gamestates)
        : [],
    [activePanoScene, props.gamestates]
  )
  const [animationMedia, setAnimationMedia] = useState<
    ReadonlyMap<number, HTMLVideoElement>
  >(new Map())
  const handleMediaRef = useCallback(
    (castId: number, media: HTMLVideoElement | null) => {
      setAnimationMedia(previous => {
        if (media && previous.get(castId) === media) {
          return previous
        }
        if (!media && !previous.has(castId)) {
          return previous
        }
        const next = new Map(previous)
        if (media) {
          next.set(castId, media)
        } else {
          next.delete(castId)
        }
        return next
      })
    },
    []
  )
  const animationLayers = useMemo(
    () =>
      activePanoAnimations.flatMap(cast => {
        const media = animationMedia.get(cast.castId)
        return media ? [{ cast, media }] : []
      }),
    [activePanoAnimations, animationMedia]
  )
  const handleAnimationEnded = useCallback(
    (cast: PanoAnim) => {
      if (!activePanoScene || !props.onTransition) {
        return
      }
      if (
        !isNavigableSceneTarget(cast.nextSceneId, activePanoScene.sceneId)
      ) {
        return
      }
      props.onTransition({
        sceneId: cast.nextSceneId,
        dissolve: cast.dissolveToNextScene,
        sourceCastId: cast.castId,
      })
    },
    [activePanoScene, props.onTransition]
  )

  return (
    <Fragment>
      <Canvas
        camera={{
          fov: 51.75,
          aspect: 640 / 420,
          near: 0.01,
          far: 1000,
          position: [0, 0, 0.09] as const,
        }}
        style={{
          position: 'absolute',
          cursor: 'none',
          left: `${props.left}px`,
          top: `${props.top}px`,
          width: `${props.width}px`,
          height: `${props.height}px`,
          zIndex: 0,
        }}
      >
        <WebGlScene {...props} animationLayers={animationLayers} />
      </Canvas>
      {activePanoAnimations.map(cast => (
        <PanoAnimationVideo
          key={`${cast.castId}:${cast.fileName}:${cast.frame}`}
          cast={cast}
          onEnded={handleAnimationEnded}
          onMediaRef={handleMediaRef}
        />
      ))}
    </Fragment>
  )
}

export default WebGl
