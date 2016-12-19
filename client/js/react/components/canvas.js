export default function scene({
  width,
  height,
  id,
  createAction
}) {
  return (
    <canvas
      ref={createAction}
      { id, width, height } />
  );
}
