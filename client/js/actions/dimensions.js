import { DIMENSIONS_RESIZE } from './types';

export function resize({ width, height }) {
  return (dispatch, getState) => {
    dispatch({
      type: DIMENSIONS_RESIZE,
      payload: {
        width,
        height,
      },
    });
    const { camera, renderer } = getState().three;
    renderer.setSize(width, height);
		camera.aspect	= width / height;
		camera.updateProjectionMatrix();
  };
}

export function lint() {}
