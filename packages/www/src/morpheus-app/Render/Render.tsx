'use client';

import '../runtime';

import React, { FC, useCallback, useMemo } from 'react';
import OgMetaCanvas from 'morpheus-app/components/OgMetaCanvas';
import useInitialGamestates from '../hooks/useInitialGamestate';

import { Scene } from 'morpheus/casts/types';

type ILocalProps = { scene: Scene };

const Render: FC<ILocalProps> = ({ scene }) => {
  const gamestates = useInitialGamestates();
  const stageScenes = useMemo(() => (scene ? [scene] : []), [scene]);
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
