import { DIMENSIONS_RESIZE } from './types';

export function resize({ width, height }) {
  function setSize({ camera, renderer}) {
    if (camera && renderer) {
      renderer.setSize(width, height);
      camera.aspect	= width / height;
      camera.updateProjectionMatrix();
    }
  }
  return (dispatch, getState) => {
    dispatch({
      type: DIMENSIONS_RESIZE,
      payload: {
        width,
        height,
      },
    });
    setSize(getState().pano);
    setSize(getState().hotspots);
  };
}

export function lint() {}
