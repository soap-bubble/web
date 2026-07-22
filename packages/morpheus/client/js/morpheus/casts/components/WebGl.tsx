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
import usePanoChunk, { PanoAnimationMediaLayer } from '../hooks/panoChunk'
import { getActivePanoAnimations } from '../panoAnimation'
import { Matcher, forMorpheusType } from '../matchers'
import { and } from 'utils/matchers'
import { PANO_OFFSET, PANO_CANVAS_WIDTH } from '../../constants'
import loggerFactory from 'utils/logger'
import type { SceneTransitionRequest } from '../../scene/types'
import { isNavigableSceneTarget } from '../../scene/transitionTarget'
import type { ScenePresentationRequest } from '../presentation'

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
  onSceneAssetsReady?: (sceneId: number) => void
  presentation?: ScenePresentationRequest
  onScenePresented?: (presentation: ScenePresentationRequest) => void
  onTransition?: (transition: SceneTransitionRequest) => void
}

function matchActiveCast<T extends Cast>(gamestates: Gamestates): Matcher<T> {
  return (cast: T) => isCastActive({ cast, gamestates })
}

function findActivePanoScene(
  stageScenes: readonly Scene[],
  gamestates: Gamestates
): Scene | undefined {
  return stageScenes.find((scene) =>
    scene.casts.some(
      (cast) => cast.__t === 'PanoCast' && isCastActive({ cast, gamestates })
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
  onSceneAssetsReady,
  presentation,
  onScenePresented,
  animationLayers,
  readyAnimationCastIds,
  requiredAnimationCastIds,
}: GlStageProps & {
  animationLayers: readonly PanoAnimationMediaLayer[]
  readyAnimationCastIds: ReadonlySet<number>
  requiredAnimationCastIds: ReadonlySet<number>
}) => {
  const onStagePanoScene = useMemo(
    () => findActivePanoScene(stageScenes, gamestates),
    [stageScenes, gamestates]
  )
  const onStagePano: PanoCast | undefined = useMemo(() => {
    return onStagePanoScene?.casts.find(
      (cast): cast is PanoCast =>
        cast.__t === 'PanoCast' && isCastActive({ cast, gamestates })
    )
  }, [onStagePanoScene, gamestates])

  // Find pano casts in pending scenes for preloading
  const pendingPanoCasts = useMemo(() => {
    const matchActive = matchActiveCast(gamestates)
    const matchPanoCast = and<PanoCast>(
      forMorpheusType('PanoCast'),
      matchActive
    )
    return pendingScenes
      .map((scene) => {
        const panoCast = scene.casts.find((cast: Cast) =>
          matchPanoCast(cast as PanoCast)
        ) as PanoCast | undefined
        const panoAnimationCastIds = getActivePanoAnimations(
          scene.casts,
          gamestates
        ).map((cast) => cast.castId)
        return { sceneId: scene.sceneId, panoCast, panoAnimationCastIds }
      })
      .filter((item) => item.panoCast !== undefined) as {
      sceneId: number
      panoCast: PanoCast
      panoAnimationCastIds: number[]
    }[]
  }, [pendingScenes, gamestates])

  const meshRef = useRef<Mesh | null>(null)
  const panoUrl = onStagePano && getAssetUrl(onStagePano.fileName, 'png')
  const textureLoader = useMemo(() => new TextureLoader(), [])
  const [texImage, setTexImage] = useState<HTMLImageElement>()
  const [texSceneId, setTexSceneId] = useState<number>()
  const [texUrl, setTexUrl] = useState<string>()
  const loadingPanoRef = useRef<{ sceneId: number; url: string } | undefined>(
    undefined
  )
  const activePanoSceneIdRef = useRef<number | undefined>(undefined)
  const activePanoUrlRef = useRef<string | undefined>(undefined)
  activePanoSceneIdRef.current = onStagePanoScene?.sceneId
  activePanoUrlRef.current = panoUrl

  // Track which pending scenes have their textures ready
  const pendingSceneReadyRef = useRef<Map<number, string>>(new Map())
  const preloadingSceneUrlsRef = useRef<Map<number, string>>(new Map())
  const [preloadedTextures, setPreloadedTextures] = useState<
    Map<number, { image: HTMLImageElement; url: string }>
  >(new Map())

  // Preload textures for pending scenes
  useEffect(() => {
    if (!pendingPanoCasts.length) return

    for (const { sceneId, panoCast } of pendingPanoCasts) {
      const url = getAssetUrl(panoCast.fileName, 'png')
      if (pendingSceneReadyRef.current.get(sceneId) === url) continue
      if (preloadedTextures.get(sceneId)?.url === url) continue
      if (preloadingSceneUrlsRef.current.get(sceneId) === url) continue
      logger.info({ sceneId, url }, 'Preloading pano texture for pending scene')
      preloadingSceneUrlsRef.current.set(sceneId, url)

      textureLoader.load(
        url,
        (tex) => {
          tex.flipY = false
          if (preloadingSceneUrlsRef.current.get(sceneId) !== url) {
            tex.dispose()
            return
          }
          preloadingSceneUrlsRef.current.delete(sceneId)
          setPreloadedTextures((prev) =>
            new Map(prev).set(sceneId, { image: tex.image, url })
          )
          logger.info({ sceneId }, 'Pending scene pano texture ready')
        },
        undefined,
        (error) => {
          if (preloadingSceneUrlsRef.current.get(sceneId) !== url) {
            return
          }
          preloadingSceneUrlsRef.current.delete(sceneId)
          logger.error({ sceneId, error }, 'Pending pano texture failed')
        }
      )
    }
  }, [pendingPanoCasts, textureLoader, preloadedTextures])

  // Notify when pending scene textures are ready
  useEffect(() => {
    if (!onSceneAssetsReady) return

    for (const {
      sceneId,
      panoCast,
      panoAnimationCastIds,
    } of pendingPanoCasts) {
      const url = getAssetUrl(panoCast.fileName, 'png')
      if (pendingSceneReadyRef.current.get(sceneId) === url) continue
      const animationsReady = panoAnimationCastIds.every((castId) =>
        readyAnimationCastIds.has(castId)
      )
      if (preloadedTextures.get(sceneId)?.url === url && animationsReady) {
        pendingSceneReadyRef.current.set(sceneId, url)
        onSceneAssetsReady(sceneId)
      }
    }
  }, [
    pendingPanoCasts,
    preloadedTextures,
    onSceneAssetsReady,
    readyAnimationCastIds,
  ])

  // Reset ready tracking when pending scenes change
  useEffect(() => {
    const retainedSceneIds = new Set(pendingScenes.map((s) => s.sceneId))
    if (onStagePanoScene) {
      retainedSceneIds.add(onStagePanoScene.sceneId)
    }
    for (const id of pendingSceneReadyRef.current.keys()) {
      if (!retainedSceneIds.has(id)) {
        pendingSceneReadyRef.current.delete(id)
      }
    }
    for (const id of preloadingSceneUrlsRef.current.keys()) {
      if (!retainedSceneIds.has(id)) {
        preloadingSceneUrlsRef.current.delete(id)
      }
    }
    // Clean up preloaded textures for scenes no longer pending
    setPreloadedTextures((prev) => {
      const next = new Map(prev)
      let changed = false
      for (const id of next.keys()) {
        if (!retainedSceneIds.has(id)) {
          next.delete(id)
          changed = true
        }
      }
      return changed ? next : prev
    })
  }, [onStagePanoScene, pendingScenes])

  useEffect(() => {
    if (!panoUrl || !onStagePanoScene) {
      return
    }
    const preloadedTexture = preloadedTextures.get(onStagePanoScene.sceneId)
    if (preloadedTexture?.url === panoUrl) {
      loadingPanoRef.current = undefined
      setTexImage(preloadedTexture.image)
      setTexSceneId(onStagePanoScene.sceneId)
      setTexUrl(panoUrl)
      return
    }
    const loadingPano = loadingPanoRef.current
    if (
      (texSceneId === onStagePanoScene.sceneId && texUrl === panoUrl) ||
      (loadingPano?.sceneId === onStagePanoScene.sceneId &&
        loadingPano.url === panoUrl)
    ) {
      return
    }
    const loadingSceneId = onStagePanoScene.sceneId
    const loadingRequest = { sceneId: loadingSceneId, url: panoUrl }
    loadingPanoRef.current = loadingRequest
    const tex = textureLoader.load(
      panoUrl,
      (t) => {
        if (
          activePanoSceneIdRef.current !== loadingSceneId ||
          activePanoUrlRef.current !== panoUrl
        ) {
          if (loadingPanoRef.current === loadingRequest) {
            loadingPanoRef.current = undefined
          }
          return
        }
        setTexImage(t.image)
        setTexSceneId(loadingSceneId)
        setTexUrl(panoUrl)
        loadingPanoRef.current = undefined
      },
      undefined,
      (error) => {
        if (loadingPanoRef.current === loadingRequest) {
          loadingPanoRef.current = undefined
        }
        logger.error({ sceneId: loadingSceneId, error }, 'Pano texture failed')
      }
    )
    if (tex) {
      tex.flipY = false
    }
  }, [
    onStagePanoScene,
    panoUrl,
    preloadedTextures,
    texSceneId,
    textureLoader,
    texUrl,
  ])
  const { texture, updateAnimationFrames } = usePanoChunk(
    texImage,
    rotation.offsetX,
    animationLayers
  )
  const ref = useRef<ShaderMaterial>(null)
  const { camera } = useThree()
  const presentedTokenRef = useRef<number | undefined>(undefined)
  const requiredAnimationsPresented = useMemo(() => {
    const layeredCastIds = new Set(
      animationLayers.map((layer) => layer.cast.castId)
    )
    return [...requiredAnimationCastIds].every(
      (castId) =>
        readyAnimationCastIds.has(castId) && layeredCastIds.has(castId)
    )
  }, [animationLayers, readyAnimationCastIds, requiredAnimationCastIds])

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
    if (
      presentation &&
      presentation.sceneId === onStagePanoScene?.sceneId &&
      texSceneId === presentation.sceneId &&
      texUrl === panoUrl &&
      presentation.token !== presentedTokenRef.current &&
      ref.current &&
      meshRef.current &&
      requiredAnimationsPresented
    ) {
      presentedTokenRef.current = presentation.token
      onScenePresented?.(presentation)
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
  active: boolean
  onEnded: (cast: PanoAnim) => void
  onMediaRef: (castId: number, media: HTMLVideoElement | null) => void
  onReady: (castId: number) => void
}

const PanoAnimationVideo = ({
  cast,
  active,
  onEnded,
  onMediaRef,
  onReady,
}: PanoAnimationVideoProps) => {
  const mediaRef = useRef<HTMLVideoElement | null>(null)
  const handleMediaRef = useCallback(
    (media: HTMLVideoElement | null) => {
      mediaRef.current = media
      onMediaRef(cast.castId, media)
      if (media && media.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
        onReady(cast.castId)
      }
    },
    [cast.castId, onMediaRef, onReady]
  )

  useEffect(() => {
    const media = mediaRef.current
    if (!media) {
      return
    }
    if (active && (cast.looping || cast.actionAtEnd !== 0)) {
      void media.play().catch(() => undefined)
    } else {
      media.pause()
    }
  }, [active, cast.actionAtEnd, cast.looping])

  return (
    <video
      ref={handleMediaRef}
      style={{ display: 'none' }}
      autoPlay={active && (cast.looping || cast.actionAtEnd !== 0)}
      crossOrigin="anonymous"
      loop={cast.looping}
      muted
      playsInline
      preload="auto"
      onCanPlayThrough={() => onReady(cast.castId)}
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
> = (props) => {
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
  const pendingPanoAnimations = useMemo(
    () =>
      props.pendingScenes?.flatMap((scene) =>
        getActivePanoAnimations(scene.casts, props.gamestates)
      ) ?? [],
    [props.gamestates, props.pendingScenes]
  )
  const panoAnimationsToLoad = useMemo(() => {
    const castsById = new Map<number, PanoAnim>()
    for (const cast of [...activePanoAnimations, ...pendingPanoAnimations]) {
      castsById.set(cast.castId, cast)
    }
    return [...castsById.values()]
  }, [activePanoAnimations, pendingPanoAnimations])
  const activePanoAnimationCastIds = useMemo(
    () => new Set(activePanoAnimations.map((cast) => cast.castId)),
    [activePanoAnimations]
  )
  const [readyAnimationCastIds, setReadyAnimationCastIds] = useState<
    ReadonlySet<number>
  >(new Set())
  useEffect(() => {
    const retainedCastIds = new Set(
      panoAnimationsToLoad.map((cast) => cast.castId)
    )
    setReadyAnimationCastIds((previous) => {
      const next = new Set(
        [...previous].filter((castId) => retainedCastIds.has(castId))
      )
      return next.size === previous.size ? previous : next
    })
  }, [panoAnimationsToLoad])
  const handleAnimationReady = useCallback((castId: number) => {
    setReadyAnimationCastIds((previous) => {
      if (previous.has(castId)) {
        return previous
      }
      return new Set(previous).add(castId)
    })
  }, [])
  const [animationMedia, setAnimationMedia] = useState<
    ReadonlyMap<number, HTMLVideoElement>
  >(new Map())
  const handleMediaRef = useCallback(
    (castId: number, media: HTMLVideoElement | null) => {
      setAnimationMedia((previous) => {
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
      activePanoAnimations.flatMap((cast) => {
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
      if (!isNavigableSceneTarget(cast.nextSceneId, activePanoScene.sceneId)) {
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
        // Scene transitions copy the composed stage into a 2D cover canvas.
        // Keep the last pano frame readable after WebGL presents it.
        gl={{ preserveDrawingBuffer: true }}
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
        <WebGlScene
          {...props}
          animationLayers={animationLayers}
          readyAnimationCastIds={readyAnimationCastIds}
          requiredAnimationCastIds={activePanoAnimationCastIds}
        />
      </Canvas>
      {panoAnimationsToLoad.map((cast) => (
        <PanoAnimationVideo
          key={`${cast.castId}:${cast.fileName}:${cast.frame}`}
          cast={cast}
          active={activePanoAnimationCastIds.has(cast.castId)}
          onEnded={handleAnimationEnded}
          onMediaRef={handleMediaRef}
          onReady={handleAnimationReady}
        />
      ))}
    </Fragment>
  )
}

export default WebGl
