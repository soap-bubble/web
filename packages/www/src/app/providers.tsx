'use client';
import { createStore } from '@soapbubble/morpheus-client';
import { FC, PropsWithChildren } from 'react';
import { Provider } from 'react-redux';

export const Providers: FC<PropsWithChildren> = ({ children }) => {
  return <Provider store={createStore()}>{children}</Provider>;
};
