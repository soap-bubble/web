import game from './game';
import scene from './scene';
import dimensions from './dimensions';
import pano from './pano';
import panoAnim from './panoAnim';
import hotspots from './hotspots';
import transition from './transition';
import ui from './ui';
import video from './video';

const initialState = {
};

export default function (state = initialState, action) {
  return {
    game: game(state, 'game', action),
    scene: scene(state, 'scene', action),
    dimensions: dimensions(state, 'dimensions', action),
    pano: pano(state, 'pano', action),
    panoAnim: panoAnim(state, 'panoAnim', action),
    hotspots: hotspots(state, 'hotspots', action),
    transition: transition(state, 'transition', action),
    ui: ui(state, 'ui', action),
    video: video(state, 'video', action),
  };
}
