import scene from './scene';
import dimensions from './dimensions';
import pano from './pano';
import hotspots from './hotspots';
import ui from './ui';
import video from './video';

const initialState = {
};

export default function (state = initialState, action) {
  return {
    scene: scene(state, 'scene', action),
    dimensions: dimensions(state, 'dimensions', action),
    pano: pano(state, 'pano', action),
    hotspots: hotspots(state, 'hotspots', action),
    ui: ui(state, 'ui', action),
    video: video(state, 'video', action),
  };
}
