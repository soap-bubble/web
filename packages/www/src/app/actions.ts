'use server';

import { cache } from 'react';
import { fetch as fetchScene } from '@soapbubble/morpheus-client/service/scene';
import type { Scene } from '@soapbubble/morpheus-client/morpheus/casts/types';

export const getScene = cache(
  async (sceneId: number): Promise<Scene | undefined> => fetchScene(sceneId),
);