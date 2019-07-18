import { curry } from 'lodash';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import {
  getAssetUrl,
} from 'service/gamedb';
import {
  selectors as gameSelectors,
} from 'morpheus/game';
import {
  selectors as castSelectors,
} from 'morpheus/casts';

function mapStateToProps(state, { scene }) {
  const sound = castSelectors.forScene(scene).cache().sound;
  return {
    assetsUrl: (sound && sound.assetsUrl) || [],
    assets: (sound && sound.assets) || [],
    volume: gameSelectors.htmlVolume(state),
  };
}

class Sound extends Component {
  constructor() {
    super();
    this.onPause = this.onPause.bind(this);
    this.onResume = this.onResume.bind(this);
  }

  onPause() {
    const { assetsUrl } = this.props;

    assetsUrl.map(asset => this[`${asset}El`]).forEach(el => {
      el.pause();
    });
  }

  onResume() {
    const { assetsUrl } = this.props;

    assetsUrl.map(asset => this[`${asset}El`]).forEach(el => {
      el.play();
    });
  }

  componentDidMount() {
    const {
      assets,
    } = this.props;

    if (assets) {
      assets.forEach(sound => this.el.appendChild(sound.el));
    }
    if (window.hasOwnProperty('cordova')) {
      if (window.hasOwnProperty('cordova')) {
        document.addEventListener('pause', this.onPause);
        document.addEventListener('resume', this.onResume);
      }
    }
  }

  componentWillUnmount() {
    const {
      assets,
    } = this.props;

    if (assets) {
      assets.forEach(sound => sound.el.remove());
    }
    if (window.hasOwnProperty('cordova')) {
      document.removeEventListener('pause', this.onPause);
      document.removeEventListener('resume', this.onResume);
    }
  }
  render() {
    const {
      assetsUrl,
      volume,
      scene,
    } = this.props;

    return (
      <React.Fragment>
        <div id={`sounds${scene && scene.sceneId || ''}`} />
        {assetsUrl.map((asset) => {
          const assetKey = `${asset}El`;
          if (this[assetKey]) {
            this[assetKey].volume = volume;
          }
          return (<audio
            key={asset}
            ref={(el) => {
              this[assetKey] = el;
              if (el) {
                this[assetKey].volume = volume;
              }
            }}
            loop
            autoPlay
          >
            <source src={getAssetUrl(asset, 'mp3')} type="audio/mp3" />
            <source src={getAssetUrl(asset, 'ogg')} type="audio/ogg" />
          </audio>);
        })}
      </React.Fragment>
    );
  }
}

export default connect(
  mapStateToProps,
)(Sound);
