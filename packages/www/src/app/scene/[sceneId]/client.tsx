'use client';

import type { Scene } from '@soapbubble/morpheus-client/morpheus/casts/types';
import InteractiveStage from '@/morpheus-app/components/InteractiveStage';
import useInitialGamestates from '@/morpheus-app/hooks/useInitialGamestate';
import useResponsiveSize from '@/morpheus-app/hooks/useResponsiveSize';

import '@/morpheus-app/runtime';

interface ClientProps {
  scene: Scene;
}

export const Client = ({ scene }: ClientProps) => {
  const gamestates = useInitialGamestates();
  const { width, height, left, top } = useResponsiveSize();

  if (!gamestates) {
    return (
      <div
        style={{
          width: '100vw',
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#000',
          color: '#fff',
        }}
      >
        Loading...
      </div>
    );
  }

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        backgroundColor: '#000',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <InteractiveStage
        scene={scene}
        gamestates={gamestates}
        width={width}
        height={height}
        left={left}
        top={top}
      />
    </div>
  );
};
