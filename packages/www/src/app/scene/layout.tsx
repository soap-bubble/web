import type { ReactNode } from 'react';
import { SceneStageShell } from './stage-shell';

const SceneLayout = ({ children }: { children: ReactNode }) => {
  return (
    <>
      <SceneStageShell />
      {children}
    </>
  );
};

export default SceneLayout;

