'use client';

import {
  createContext,
  useContext,
  type PropsWithChildren,
} from 'react';

import type { LivingSaveCoordinator } from './livingSaveCoordinator';

const LivingSaveCoordinatorContext = createContext<LivingSaveCoordinator | null>(
  null,
);

type LivingSaveCoordinatorProviderProps = PropsWithChildren<{
  coordinator: LivingSaveCoordinator;
}>;

export const LivingSaveCoordinatorProvider = ({
  coordinator,
  children,
}: LivingSaveCoordinatorProviderProps) => (
  <LivingSaveCoordinatorContext.Provider value={coordinator}>
    {children}
  </LivingSaveCoordinatorContext.Provider>
);

export function useLivingSaveCoordinator(): LivingSaveCoordinator {
  const coordinator = useContext(LivingSaveCoordinatorContext);
  if (coordinator === null) {
    throw new Error(
      'useLivingSaveCoordinator must be used inside LivingSaveCoordinatorProvider',
    );
  }
  return coordinator;
}
