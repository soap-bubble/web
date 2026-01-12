'use client';
import { Game } from '@soapbubble/morpheus-client';
import type { Scene } from '@soapbubble/morpheus-client/morpheus/casts/types';

export const Client = ({ scene }: { scene: Scene }) => {
  return <Game id="root" className="game" />;
};
