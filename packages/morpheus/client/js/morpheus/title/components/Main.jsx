import React from 'react';
import cx from 'classnames';
import { Tween, Easing } from 'tween';
import { getAssetUrl } from 'service/gamedb';
import Title from '../containers/Title';
import PlayOverlay from './PlayOverlay';

class Main extends React.Component {
  constructor() {
    super();
    this.state = {
      isLeaving: false,
      target: 1,
      started: false,
    };
    this.onPlayClicked = this.onPlayClicked.bind(this);
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.leaving === false && nextProps.leaving === true) {
      this.fadeOut();
    }
  }

  fadeOut() {
    const { isLeaving } = this.state;
    if (!isLeaving) {
      const v = { target: 1 };
      const tween = new Tween(v)
        .to({
          target: 0,
        })
        .easing(Easing.Sinusoidal.Out)
        .onUpdate(() => {
          this.audio.volume = v.target;
          // this.setState({
          //   target: v.target,
          // });
        });

      tween.start();
      this.setState({ isLeaving: true });
    }
  }

  onPlayClicked() {
    this.setState({
      started: true,
    });
    this.audio.play();
  }

  render() {
    const { style } = this.props;
    const {
      target,
      started,
    } = this.state;

    return (
      <div
        className={cx('main-title', {
          'request-play': started,
        })}
        style={{
          ...style,
        }}
      >
        {started ? <Title opacity={target} /> : null}
        {!started ? <PlayOverlay onClick={this.onPlayClicked} /> : null}
        <audio ref={(e) => { this.audio = e; }} loop>
          <source src={getAssetUrl('GameDB/OAsounds/claireSRMSC', 'aac')} type="audio/aac" />
          <source src={getAssetUrl('GameDB/OAsounds/claireSRMSC', 'mp3')} type="audio/mp3" />
          <source src={getAssetUrl('GameDB/OAsounds/claireSRMSC', 'ogg')} type="audio/ogg" />
        </audio>
      </div>
    );
  }
}

export default Main;
