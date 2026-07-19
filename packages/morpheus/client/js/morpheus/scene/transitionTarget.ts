export const TRANSITION_SCENE_SENTINEL = 0x3fffffff

export function isNavigableSceneTarget(
  sceneId: number | null | undefined,
  currentSceneId?: number
): sceneId is number {
  return (
    typeof sceneId === 'number' &&
    Number.isInteger(sceneId) &&
    sceneId > 0 &&
    sceneId !== TRANSITION_SCENE_SENTINEL &&
    sceneId !== currentSceneId
  )
}
