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
  componentDidMount() {
    const {
      assets,
    } = this.props;

    if (assets) {
      assets.forEach(sound => this.el.appendChild(sound.el));
    }
  }

  componentWillUnmount() {
    const {
      assets,
    } = this.props;

    if (assets) {
      assets.forEach(sound => sound.el.remove());
    }
  }
  render() {
    const {
      assetsUrl,
      volume,
      scene,
    } = this.props;

    return (
      <div id={`sounds${scene && scene.sceneId || ''}`}>
        {assetsUrl.map((asset) => {
          const assetKey = `${asset}El`;
          if (this[assetKey]) {
            this[assetKey].volume = volume;
          }
          return (<audio
            key={asset}
            ref={(el) => {
              this[assetKey] = el;
            }}
            loop
            autoPlay
          >
            <source src={getAssetUrl(asset, 'mp3')} type="audio/mp3" />
            <source src={getAssetUrl(asset, 'ogg')} type="audio/ogg" />
          </audio>);
        })}
      </div>
    );
  }
}

export default connect(
  mapStateToProps,
)(Sound);
