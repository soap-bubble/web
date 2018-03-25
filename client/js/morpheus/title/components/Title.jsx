import React, { Component } from 'react';
import cn from 'classnames';

export default class Title extends Component {
  render() {
    const {
      canvasCreated,
      width,
      height,
      style,
    } = this.props;
    return (
      <div
        style={{
          ...style,
        }}
        className={cn('title')}
      >
        <canvas width={width} height={height} ref={canvasCreated} />
      </div>
    );
  }
}
