import React, { Component } from 'react';
import cn from 'classnames';
import styles from './Title.module.css'

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
        className={cn(styles.title)}
        width={width}
        height={height}
        ref={canvasCreated}
      />
    );
  }
}
