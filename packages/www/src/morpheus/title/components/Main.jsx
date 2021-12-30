import React from 'react';
import cx from 'classnames';
import {Tween, Easing} from '@tweenjs/tween.js';
import { getAssetUrl } from 'service/gamedb';
import Title from '../containers/Title';
import PlayOverlay from './PlayOverlay';
import WhyAmISeeingThis from './WhyAmISeeingThis';

import styles from './Main.module.css'

const WHY_DO_I_NEED_TO_CLICK_PLAY = 'Recent changes to Chrome require user interaction before WebAudio can be played.';

class Main extends React.Component {
  constructor() {
    super();
    this.state = {
      isLeaving: false,
      target: 1,
      started: process.env.AUTOSTART,
    };
    this.onPlayClicked = this.onPlayClicked.bind(this);
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    if (this.props.volume !== nextProps.volume && this.audio && !this.state.isLeaving) {
      this.audio.volume = nextProps.volume;
    }
    if (this.props.leaving === false && (nextProps.leaving === true || nextProps.done === true)) {
      this.fadeOut();
    }
  }

  componentDidMount() {
    if (process.env.AUTOSTART && this.audio) {
      this.audio.play();
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
      const v = { target: this.audio.volume };
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
    const { style, volume } = this.props;
    const {
      target,
      started,
    } = this.state;

    return (
      <div
        className={cx(styles.mainTitle)}
        style={{
          ...style,
        }}
      >
        {started ? <Title opacity={target} /> : null}
        {!started ? <PlayOverlay onClick={this.onPlayClicked} /> : null}
        {!started ? <WhyAmISeeingThis
          reason={WHY_DO_I_NEED_TO_CLICK_PLAY}
        /> : null}
        <audio ref={(e) => { this.audio = e; if (e && !this.state.isLeaving) this.audio.volume = volume }} loop>
          <source src={getAssetUrl('GameDB/OAsounds/claireSRMSC', 'aac')} type="audio/aac" />
          <source src={getAssetUrl('GameDB/OAsounds/claireSRMSC', 'mp3')} type="audio/mp3" />
          <source src={getAssetUrl('GameDB/OAsounds/claireSRMSC', 'ogg')} type="audio/ogg" />
        </audio>
      </div>
    );
  }
}

export default Main;
