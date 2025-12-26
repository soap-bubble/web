import axios from 'axios';
import { Scene, UnresolvedScene, Cast } from 'morpheus/casts/types';
import createLogger from 'utils/logger';
import { firebaseClient, isFirebaseLoaded } from 'service/firebase';
import morpheusMapUnknown from './morpheusMap';

const morpheusMap = morpheusMapUnknown as unknown as any[];
type SceneCastWithRef = Cast & { ref?: { castId: number } };
const logger = createLogger('service:scene');

export async function fetch(sceneId: number): Promise<Scene | undefined> {
  if (isFirebaseLoaded) {
    const db = firebaseClient.firestore();
    const sceneDoc = await db
      .collection('scenes')
      .where('sceneId', '==', sceneId)
      .get();
    const [sceneRef] = sceneDoc.docs;
    const scene = sceneRef.data() as UnresolvedScene;
    if (!scene) {
      return undefined;
    }
    const needToLoadCasts = scene.casts.filter(
      (cast): cast is SceneCastWithRef => Boolean((cast as SceneCastWithRef).ref)
    );

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
      const casts = scene.casts.map((cast: SceneCastWithRef) => {
        if (cast.ref) {
          return loadedCasts.find(
            ({ castId }: any) => castId === Number(cast.ref?.castId)
          );
        }
        return cast;
      }) as Cast[];
      scene.casts = casts;
    }
    return scene as Scene;
  } else {
    const foundScene = morpheusMap.find(
      (m) => m.type === 'Scene' && m.data.sceneId === sceneId
    );
    if (foundScene) {
      const scene = {
        ...foundScene.data,
        __t: foundScene.type,
      };
      const resolveCastIds = scene.casts
        .filter((c: SceneCastWithRef) => c.ref?.castId)
        .map((r: SceneCastWithRef) => Number(r.ref?.castId));
      const resolvedCasts: Record<number, Cast> = {};
      let found = 0;
      for (let gameObject of morpheusMap) {
        if (resolveCastIds.includes(gameObject.data?.castId)) {
          if (!resolvedCasts[gameObject.data.castId]) {
            found++;
          }
          resolvedCasts[gameObject.data.castId] = {
            ...gameObject.data,
            __t: gameObject.type,
          };
        }
        if (resolveCastIds.length === found) {
          break;
        }
      }
      scene.casts = scene.casts.map((c: SceneCastWithRef) => {
        if (c.ref) {
          return resolvedCasts[Number(c.ref.castId)];
        }
        return c;
      });
      return scene;
    }
  }
}
