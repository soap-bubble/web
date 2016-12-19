import scene from './scene';

const initialState = {
  scene: null
};

export default function (state = initialState, action) {
  return {
    scene: scene(state.scene, action)
  };
}
