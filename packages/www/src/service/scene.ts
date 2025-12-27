import { Scene, UnresolvedScene, Cast } from 'morpheus/casts/types';
import createLogger from 'utils/logger';
import { firebaseClient, isFirebaseLoaded } from 'service/firebase';
import morpheusMapUnknown from './morpheus.map.json';

type FirestoreQuerySnapshot = {
  docs: Array<{ data(): Record<string, unknown> }>;
};
type FirestoreCollection = {
  where: (...args: unknown[]) => {
    get(): Promise<FirestoreQuerySnapshot>;
  };
};
type FirestoreLike = {
  collection: (...args: unknown[]) => FirestoreCollection;
};

const morpheusMap = morpheusMapUnknown as unknown as Array<{
  type: string;
  data: Record<string, unknown>;
}>;
type SceneCastWithRef = Cast & { ref?: { castId: number } };
const logger = createLogger('service:scene');

async function fetchSceneFromFirestore(
  sceneId: number,
  db: FirestoreLike,
): Promise<Scene | undefined> {
  const sceneDoc = await db
    .collection('scenes')
    .where('sceneId', '==', sceneId)
    .get();
  const [sceneRef] = sceneDoc.docs;
  if (!sceneRef) {
    return undefined;
  }
  const rawScene = sceneRef.data();
  const scene = rawScene as unknown as UnresolvedScene;
  if (!scene) {
    return undefined;
  }
  const needToLoadCasts = scene.casts.filter((cast): cast is SceneCastWithRef =>
    Boolean((cast as SceneCastWithRef).ref),
  );

  if (needToLoadCasts.length) {
    logger.info(`Normalizing scene: ${sceneId}`);
    const loadedCasts = await Promise.all<Cast | undefined>(
      needToLoadCasts.map(async ({ ref }) => {
        if (!ref) {
          return undefined;
        }
        const castDoc = await db
          .collection('casts')
          .where('castId', '==', Number(ref.castId))
          .get();
        const castData = castDoc.docs[0]?.data();
        return castData ? (castData as unknown as Cast) : undefined;
      }),
    );
    const castsWithRefs = scene.casts as SceneCastWithRef[];
    const casts = castsWithRefs.map((cast) => {
      if (cast.ref) {
        return loadedCasts.find(
          (loadedCast) => loadedCast?.castId === Number(cast.ref?.castId),
        );
      }
      return cast;
    }) as Cast[];
    scene.casts = casts;
  }
  return scene as Scene;
}

export async function fetch(
  sceneId: number,
  dbOverride?: FirestoreLike,
): Promise<Scene | undefined> {
  if (dbOverride) {
    return fetchSceneFromFirestore(sceneId, dbOverride);
  }
  if (isFirebaseLoaded && firebaseClient.apps.length) {
    return fetchSceneFromFirestore(
      sceneId,
      firebaseClient.firestore() as FirestoreLike,
    );
  }

  const foundScene = morpheusMap.find(
    (m) => m.type === 'Scene' && m.data.sceneId === sceneId,
  );

  if (!foundScene) {
    return undefined;
  }

  const scene = {
    ...(foundScene.data as unknown as Scene),
    __t: foundScene.type,
  };
  const resolveCastIds = scene.casts
    .filter((c: SceneCastWithRef) => c.ref?.castId)
    .map((r: SceneCastWithRef) => Number(r.ref?.castId));
  const resolvedCasts: Record<number, Cast> = {};
  let found = 0;
  for (const gameObject of morpheusMap) {
    const castId = Number(
      (gameObject.data as Record<string, unknown> | undefined)?.castId,
    );
    if (Number.isNaN(castId) || !resolveCastIds.includes(castId)) {
      continue;
    }
    if (!resolvedCasts[castId]) {
      found++;
    }
    resolvedCasts[castId] = {
      ...(gameObject.data as Record<string, unknown>),
      __t: gameObject.type,
    } as Cast;
    if (resolveCastIds.length === found) {
      break;
    }
  }
  const sceneCastsWithRefs = scene.casts as SceneCastWithRef[];
  scene.casts = sceneCastsWithRefs.map((c) => {
    if (c.ref) {
      return resolvedCasts[Number(c.ref.castId)];
    }
    return c;
  });
  return scene;
}
