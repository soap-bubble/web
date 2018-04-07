import React, { Component } from 'react';
import cn from 'classnames';

export default class Title extends Component {
  render() {
    const {
      opacity,
      canvasCreated,
      width,
      height,
    } = this.props;
    return (
      <canvas
        style={{
          opacity,
        }}
        className={cn('title')}
        width={width}
        height={height}
        ref={canvasCreated}
      />
    );
  }
}
