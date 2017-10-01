import React from 'react';

const Options = ({
  children,
}) => (<div>
  {children}
</div>);

Options.propTypes = {
  children: React.PropTypes.arrayOf(React.PropTypes.Component),
};

Options.defaultProps = {
  children: [],
};

export default Options;
