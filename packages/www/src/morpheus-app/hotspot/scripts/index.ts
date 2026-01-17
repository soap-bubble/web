import type { Hotspot } from 'morpheus/casts/types';
import type { GamestatesAccessor } from '@/morpheus-app/store/slices/gamestateSlice';

import * as tapestry from './tapestry';
import * as influxor from './influxor';
import * as instruments from './instruments';
import * as musicbox from './musicbox';
import * as pins from './pins';
import * as mapPins from './mapPins';
import * as drums from './drums';

export type ScriptResult = {
  gamestateUpdates: Array<{ stateId: number; value: number }>;
  sceneTransition?: { sceneId: number; dissolve: boolean; startAngle?: number };
  allDone: boolean;
};

export type ScriptExecute = (
  hotspot: Hotspot,
  gamestates: GamestatesAccessor,
) => ScriptResult;

export type ScriptModule = {
  id: number;
  execute: ScriptExecute;
};

const scripts: ScriptModule[] = [
  tapestry,
  influxor,
  instruments,
  musicbox,
  pins,
  mapPins,
  drums,
];

export function getScript(type: number): ScriptModule | null {
  return scripts.find((script) => script.id === type) ?? null;
}
