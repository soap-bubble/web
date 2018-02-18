const OnRender = ({
  render,
  children,
}) => {
  render();
  return children;
};

export default OnRender;
