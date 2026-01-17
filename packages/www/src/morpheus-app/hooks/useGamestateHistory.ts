import { useEffect } from 'react';
import { fetchInitial } from '@soapbubble/morpheus-client/service/gameState';
import { useAppDispatch } from '@/morpheus-app/store/hooks';
import { popHistory, restoreGamestate } from '@/morpheus-app/store/slices/gamestateSlice';
import type { GamestateValues } from '@/morpheus-app/storage/gamestateStorage';
import { getMeta, resolveValues } from '@/morpheus-app/storage/gamestateStorage';

const genesisValues = (): GamestateValues => {
  const initialGamestates = fetchInitial();
  return Object.fromEntries(initialGamestates.map((state) => [state.stateId, state.value]));
};

export function useGamestateHistory(): void {
  const dispatch = useAppDispatch();

  useEffect(() => {
    let isMounted = true;

    const hydrateFromStorage = async () => {
      const meta = await getMeta();
      if (!meta?.stackHead || !isMounted) {
        return;
      }
      const values = await resolveValues(meta.stackHead, genesisValues());
      if (!isMounted) {
        return;
      }
      dispatch(restoreGamestate({ values, entryId: meta.stackHead }));
    };

    hydrateFromStorage();

    return () => {
      isMounted = false;
    };
  }, [dispatch]);

  useEffect(() => {
    const handlePopState = () => {
      dispatch(popHistory());
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [dispatch]);
}
