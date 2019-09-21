import axios from 'axios'

export async function bySceneId(sceneId) {
  const db = firebase.firestore()
  const sceneDoc = await db
    .collection('scenes')
    .where('sceneId', '==', Number(sceneId))
    .get()
  const [sceneRef] = sceneDoc.docs
  if (sceneRef) {
    const scene = sceneRef.data()
    const needToLoadCasts = scene.casts.filter(cast => !!cast.ref)
    if (needToLoadCasts.length) {
      logger.info(`Normalizing scene: ${sceneId}`)
      // Normalize casts
      const loadedCasts = await Promise.all(
        needToLoadCasts.map(async ({ ref }) => {
          const castDoc = await db
            .collection('casts')
            .where('castId', '==', Number(ref.castId))
            .get()
          return castDoc.docs[0].data()
        }),
      )
      const casts = scene.casts.map(cast => {
        if (cast.ref) {
          return loadedCasts.find(({ castId }) => castId === cast.ref.castId)
        }
        return cast
      })
      scene.casts = casts
    }
    return scene
  }
  return null
}

export default {
  bySceneId,
}
