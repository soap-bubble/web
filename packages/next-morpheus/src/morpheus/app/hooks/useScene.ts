import { Scene } from 'morpheus/casts/types';
import { useEffect, useState } from 'react';
import { fetch } from 'service/scene';

export default function useScene(usingSceneId: number | string) {
  const sceneId = Number(usingSceneId);
  const [scene, setScene] = useState<Scene | undefined>();
  const [err, setError] = useState<Error | undefined>();

  async function fetchScene(cancellable: { cancel: boolean }) {
    function doIfNotCancelled(doer: () => void) {
      if (!cancellable.cancel) {
        doer();
      }
    }
    try {
      const scene = await fetch(sceneId);
      if (scene) {
        doIfNotCancelled(() => setScene(scene));
      } else {
        doIfNotCancelled(() =>
          setError(new Error(`Unable to fetch scene ${sceneId}`))
        );
      }
    } catch (err) {
      doIfNotCancelled(() => {
        setError(err);
        setScene(undefined);
      });
    }
  }

  useEffect(() => {
    if (!(scene || err)) {
      const cancellable = { cancel: false };
      fetchScene(cancellable);
      return () => {
        cancellable.cancel = true;
      };
    }
  }, [sceneId]);

  return scene;
}
