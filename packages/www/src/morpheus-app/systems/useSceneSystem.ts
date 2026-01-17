import { useEffect, useMemo } from 'react';
import type { Scene } from 'morpheus/casts/types';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  activateScene,
  loadScene,
  selectSceneById,
  selectStageScenes,
  scenePrefetched,
} from '../store/slices/sceneSlice';
import {
  clearRotationSeed,
  selectRotationSeeded,
} from '../store/slices/rotationSlice';

type SceneSystemOptions = {
  scene: Scene;
  sceneId: number;
  mcpSessionName: string | null;
};

export const useSceneSystem = ({
  scene,
  sceneId,
  mcpSessionName: _mcpSessionName,
}: SceneSystemOptions) => {
  const dispatch = useAppDispatch();
  const rotationSeeded = useAppSelector(selectRotationSeeded);
  const stageScenes = useAppSelector(selectStageScenes);
  const sceneInStore = useAppSelector((state) =>
    selectSceneById(state, sceneId)
  );

  // Initialize scene in store when page loads
  useEffect(() => {
    dispatch(scenePrefetched(scene));
    dispatch(activateScene(scene.sceneId));
  }, [dispatch, scene]);

  // Load scene if not in store (shouldn't happen in normal flow)
  useEffect(() => {
    if (!sceneInStore) {
      dispatch(loadScene(sceneId));
    }
    dispatch(activateScene(sceneId));
  }, [dispatch, sceneId, sceneInStore]);

  // Clear rotation seed after it's been used
  useEffect(() => {
    if (rotationSeeded) {
      dispatch(clearRotationSeed());
    }
  }, [dispatch, rotationSeeded]);

  return useMemo(
    () => ({
      stageScenes,
    }),
    [stageScenes]
  );
};
