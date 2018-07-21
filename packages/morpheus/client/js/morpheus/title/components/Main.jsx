import React from 'react';
import cx from 'classnames';
import { Tween, Easing } from 'tween';
import { getAssetUrl } from 'service/gamedb';
import Title from '../containers/Title';
import PlayOverlay from './PlayOverlay';
import WhyAmISeeingThis from './WhyAmISeeingThis';

const WHY_DO_I_NEED_TO_CLICK_PLAY = 'Recent changes to Chrome require user interaction before WebAudio can be played.';

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

  onPlayClicked() {
    this.setState({
      started: true,
    });
    this.audio.play();
    this.props.onFullscreen();
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
        {!started ? <WhyAmISeeingThis
          reason={WHY_DO_I_NEED_TO_CLICK_PLAY}
        /> : null}
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
