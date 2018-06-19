import {
  get,
} from 'lodash';
import {
  isActive,
} from 'morpheus/gamestate';

export const panoCastData =
  scene => get(scene, 'casts', []).find(c => c.__t === 'PanoCast');
export const panoAnimData =
  scene => get(scene, 'casts', []).find(c => c.__t === 'PanoAnim');
export const isEnabledCast = ({
  casts,
  gamestates,
}) => casts
  .filter(c => isActive({ cast: c, gamestates }));
