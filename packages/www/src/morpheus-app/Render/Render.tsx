'use client';

import '../runtime';

import React, { FC, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import OgMetaCanvas from '@/morpheus-app/components/OgMetaCanvas';
import { useSceneSystem } from '@/morpheus-app/systems/useSceneSystem';
import { useAppSelector } from '@/morpheus-app/store/hooks';
import { selectGamestatesAccessor } from '@/morpheus-app/store/slices/gamestateSlice';

import { Scene } from 'morpheus/casts/types';

type ILocalProps = { scene: Scene };

const Render: FC<ILocalProps> = ({ scene }) => {
  const gamestates = useAppSelector(selectGamestatesAccessor);
  const searchParams = useSearchParams();
  const mcpSessionName = searchParams.get('mcp');
  const { stageScenes } = useSceneSystem({
    scene,
    sceneId: scene.sceneId,
    mcpSessionName,
  });
  const onSettled = useCallback(() => console.log('settled'), []);
  return (
    <OgMetaCanvas
      stageScenes={stageScenes}
      gamestates={gamestates}
      settled={onSettled}
    />
  );
};

export default Render;
