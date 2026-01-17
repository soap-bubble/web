'use client';
import { FC, PropsWithChildren } from 'react';
import { Provider } from 'react-redux';
import { store } from '@/morpheus-app/store/store';

export const Providers: FC<PropsWithChildren> = ({ children }) => {
  return <Provider store={store}>{children}</Provider>;
};
