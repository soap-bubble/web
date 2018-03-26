import React from 'react';
import { Tween, Easing } from 'tween';
import { getAssetUrl } from 'service/gamedb';
import Title from '../containers/Title';
import Background from '../containers/Background';

class Main extends React.Component {
  constructor() {
    super();
    this.state = {
      isLeaving: false,
      target: 1,
    };
    this.mouseClick = this.mouseClick.bind(this);
  }

  mouseClick() {
    const { done } = this.props;
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
          this.setState({
            target: v.target,
          });
        })
        .onComplete(done);

      tween.start();
      this.setState({ isLeaving: true });
    }
  }

  render() {
    const { style } = this.props;
    const { target } = this.state;

    return (
      <div
        className="main-title"
        style={{
          ...style,
        }}
        onClick={this.mouseClick}
      >
        <Background opacity={target} />
        <Title opacity={target} />
        <audio ref={(e) => { this.audio = e; }} autoPlay loop>
          <source src={getAssetUrl('GameDB/OAsounds/claireSRMSC', 'aac')} type="audio/aac" />
          <source src={getAssetUrl('GameDB/OAsounds/claireSRMSC', 'mp3')} type="audio/mp3" />
          <source src={getAssetUrl('GameDB/OAsounds/claireSRMSC', 'ogg')} type="audio/ogg" />
        </audio>
      </div>
    );
  }
}

export default Main;
