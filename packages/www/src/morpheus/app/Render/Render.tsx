import React, { FC, useCallback, useMemo } from 'react';
import Head from 'next/head';
import OgMetaCanvas from 'morpheus/render/components/OgMetaCanvas';
import useInitialGamestates from '../hooks/useInitialGamestate';

import { Scene } from 'morpheus/casts/types';

type ILocalProps = { scene: Scene };

const Render: FC<ILocalProps> = ({ scene }) => {
  const gamestates = useInitialGamestates();
  const stageScenes = useMemo(() => (scene ? [scene] : []), [scene]);
  const onSettled = useCallback(() => console.log('settled'), []);
  return (
    <>
      <Head>
        {/* <meta
          property="og:title"
          content={`Morpheus ${scene?.sceneId}`}
          key="title"
        />
        <meta
          property="og:description"
          content={`Morpheus ${scene?.sceneId} has ${scene?.casts.length} casts`}
        />
        <meta
          property="og:image"
          content={`https://wise-rat-42.loca.lt/api/ogMeta?scene=${scene?.sceneId}`}
        />
        <meta
          property="og:url"
          content={`https://wise-rat-42.loca.lt/render/${scene?sceneId}`}
        /> */}
      </Head>
      <OgMetaCanvas
        stageScenes={stageScenes}
        gamestates={gamestates}
        settled={onSettled}
      />
    </>
  );
};

export default Render;
