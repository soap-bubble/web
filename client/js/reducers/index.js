import scene from './scene';

const initialState = {
};

export default function (state = initialState, action) {
  return {
    scene: scene(state.scene, action)
  };
}
