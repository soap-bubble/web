export function sceneCreated(state, action) {
  switch(action.type) {
    case CREATE_CANVAS:
      const { canvas } = action.payload;
      return (
        ...state,
        { canvas }
      );
    default:
      return state;
  }
}
