import React, { Component } from 'react';
import cn from 'classnames';
import { getAssetUrl } from 'service/gamedb';

export default class extends Component {
  constructor() {
    super();
    this.state = {
      step: 'start',
    };
  }

  render() {
    const {
      opacity,
    } = this.props;
    const { step } = this.state;
    let contents = null;

    if (step === 'start') {
      contents = (<img
        role="presentation"
        src={getAssetUrl('GameDB/All/morpheus-background', 'jpg')}
      />);
    }

    return (<div
      style={{
        opacity,
      }}
      className={cn('background')}
    >
      {contents}
    </div>);
  }
}
