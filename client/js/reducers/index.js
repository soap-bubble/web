import game from './game';
import scene from './scene';
import dimensions from './dimensions';
import gameState from './gameState';
import pano from './pano';
import panoAnim from './panoAnim';
import hotspots from './hotspots';
import special from './special';
import transition from './transition';
import ui from './ui';
import video from './video';

export default function (state = initialState, action) {
  return {
    game: game(state, 'game', action),
    scene: scene(state, 'scene', action),
    dimensions: dimensions(state, 'dimensions', action),
    gameState: gameState(state, 'gameState', action),
    pano: pano(state, 'pano', action),
    panoAnim: panoAnim(state, 'panoAnim', action),
    hotspots: hotspots(state, 'hotspots', action),
    special: special(state, 'special', action),
    transition: transition(state, 'transition', action),
    ui: ui(state, 'ui', action),
    video: video(state, 'video', action),
  };
}
