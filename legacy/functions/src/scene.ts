import { firestore } from 'firebase-admin'
import logger from './logger'

export default async function(sceneId: number) {
  const db = firestore()
  logger.info(`Loading scene: ${sceneId}`)
  const sceneDoc = await db
    .collection('scenes')
    .where('sceneId', '==', sceneId)
    .get()
  const [sceneRef] = sceneDoc.docs
  if (sceneRef) {
    const scene = sceneRef.data()
    const needToLoadCasts = scene.casts.filter((cast: any) => !!cast.ref)
    if (needToLoadCasts.length) {
      logger.info(`Normalizing scene: ${sceneId}`)
      // Normalize casts
      const loadedCasts = await Promise.all(
        needToLoadCasts.map(async ({ ref }: any) => {
          const castDoc = await db
            .collection('casts')
            .where('castId', '==', Number(ref.castId))
            .get()
          return castDoc.docs[0].data()
        }),
      )
      const casts = scene.casts.map((cast: any) => {
        if (cast.ref) {
          return loadedCasts.find(
            ({ castId }: any) => castId === cast.ref.castId,
          )
        }
        return cast
      })
      await db
        .collection('scenes')
        .doc(sceneRef.id)
        .set(
          {
            casts,
          },
          { merge: true },
        )
      scene.casts = casts
    }
    return scene
  }
  return null
}
