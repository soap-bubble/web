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
    volume: gameSelectors.htmlVolume(state),
  };
}

class Sound extends Component {
  render() {
    const {
      assetsUrl,
      volume,
    } = this.props;

    return (
      <div>
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
