import { Scene, UnresolvedScene, Cast } from 'morpheus/casts/types';
import createLogger from 'utils/logger';

const logger = createLogger('service:scene');

export async function fetch(
  sceneId: number,
  db: FirebaseFirestore.Firestore | firebase.default.firestore.Firestore
): Promise<Scene | undefined> {
  const sceneDoc = await db
    .collection('scenes')
    .where('sceneId', '==', sceneId)
    .get();
  const [sceneRef] = sceneDoc.docs;
  const scene = sceneRef.data() as UnresolvedScene;
  if (!scene) {
    return undefined;
  }
  const needToLoadCasts = scene.casts.filter((cast: any) => !!cast.ref) as {
    ref: { castId: string };
  }[];

  if (needToLoadCasts.length) {
    logger.info(`Normalizing scene: ${sceneId}`);
    // Normalize casts
    const loadedCasts = await Promise.all(
      needToLoadCasts.map(async ({ ref }) => {
        const castDoc = await db
          .collection('casts')
          .where('castId', '==', Number(ref.castId))
          .get();
        return castDoc.docs[0].data();
      })
    );
    const casts = scene.casts.map(cast => {
      if ((cast as { ref: { castId: string } }).ref) {
        return loadedCasts.find(
          ({ castId }: any) =>
            castId === (cast as { ref: { castId: string } }).ref.castId
        );
      }
      return cast;
    }) as Cast[];
    scene.casts = casts;
  }
  return scene as Scene;
}
