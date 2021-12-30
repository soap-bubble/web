export default function pano({
  contextProvider,
  canvas,
}) {
  const ctx = canvas.getContext('2d');
  contextProvider.forEach(({
    data,
    context: srcContext,
    renderer: render,
  }) => {
    render({
      srcContext,
      dstContext: ctx,
      data,
    });
  });
}
