'use client';
import { FC, PropsWithChildren, useEffect, useMemo } from 'react';
import { Provider } from 'react-redux';
import { usePathname, useRouter } from 'next/navigation';
import { fetch as fetchScene } from '@soapbubble/morpheus-client/service/scene';

import { store } from '@/morpheus-app/store/store';
import { useAppSelector } from '@/morpheus-app/store/hooks';
import { createBrowserLivingSaveCoordinator } from '@/morpheus-app/store/livingSaveCoordinator';
import { selectLivingSaves } from '@/morpheus-app/store/slices/livingSavesSlice';

function routeSceneId(pathname: string): number | null {
  const match = /^\/scene\/(\d+)$/.exec(pathname);
  if (!match) return null;
  const value = Number(match[1]);
  return Number.isSafeInteger(value) && value > 0 ? value : null;
}

const LivingSaveBootstrap = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { bootstrapPhase } = useAppSelector(selectLivingSaves);
  const coordinator = useMemo(
    () =>
      createBrowserLivingSaveCoordinator({
        dispatch: store.dispatch,
        getState: store.getState,
        fetchScene: async (sceneId) => {
          try {
            return (await fetchScene(sceneId)) ?? null;
          } catch {
            return null;
          }
        },
        replaceRoute: (sceneId) => {
          const sessionName =
            typeof window === 'undefined'
              ? null
              : new URLSearchParams(window.location.search).get('mcp');
          router.replace(
            sessionName
              ? `/scene/${sceneId}?mcp=${encodeURIComponent(sessionName)}`
              : `/scene/${sceneId}`,
          );
        },
        goToTitle: () => router.replace('/'),
      }),
    [router],
  );

  useEffect(() => {
    if (bootstrapPhase !== 'idle') return;
    const search =
      typeof window === 'undefined'
        ? null
        : new URLSearchParams(window.location.search);
    void coordinator.bootstrap({
      routeSceneId: routeSceneId(pathname),
      mcpSessionName: search?.get('mcp') ?? null,
    });
  }, [bootstrapPhase, coordinator, pathname]);

  return null;
};

export const Providers: FC<PropsWithChildren> = ({ children }) => {
  return (
    <Provider store={store}>
      <LivingSaveBootstrap />
      {children}
    </Provider>
  );
};
