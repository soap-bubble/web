'use client';

import { useEffect } from 'react';
import type { Scene } from '@soapbubble/morpheus-client/morpheus/casts/types';
import { useAppDispatch } from '@/morpheus-app/store/hooks';
import { scenePrefetched } from '@/morpheus-app/store/slices/sceneSlice';

interface ClientProps {
  scene: Scene;
}

export const Client = ({ scene }: ClientProps) => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(scenePrefetched(scene));
  }, [dispatch, scene]);

  return null;
};
