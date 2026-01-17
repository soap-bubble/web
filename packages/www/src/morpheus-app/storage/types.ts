export type GamestateDelta = Record<number, number>;

export type GamestateEntry = {
  id: string;
  parentId: string | null;
  sceneId: number;
  delta: GamestateDelta;
  timestamp: number;
};

export type GamestateStorageMeta = {
  stackHead: string | null;
  version: number;
};
