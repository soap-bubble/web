import { Gamestate } from "morpheus/casts/types";

export type ISaveGameData = {
  gamestates: Gamestate[];
  currentSceneId: String;
  previousSceneId: String;
  saveId: String;
  rotation: number | null;
};
