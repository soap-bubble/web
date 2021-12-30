import {
  get,
} from 'lodash';
import { Scene, Cast } from '../casts/types'
import { Gamestates, isActive } from 'morpheus/gamestate/isActive';

export const panoCastData =
  (scene: Scene) => get(scene, 'casts', []).find(c => c.__t === 'PanoCast');
export const panoAnimData =
(scene: Scene) => get(scene, 'casts', []).filter(c => c.__t === 'PanoAnim');
export const isEnabledCast = ({
  cast,
  gamestates,
}: { cast: Cast; gamestates: Gamestates}) => isActive({ cast, gamestates });
