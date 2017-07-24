import { curry } from 'lodash';
import React, { PropTypes } from 'react';
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
  return {
    assetsUrl: castSelectors.forScene(scene).sound.assetsUrl(state),
  };
}

export default connect(
  mapStateToProps,
)(({
  assetsUrl,
}) => (
  <div>
    {assetsUrl.map(asset => (
      <audio key={asset} loop autoPlay>
        <source src={getAssetUrl(asset, 'mp3')} type="audio/mp3" />
        <source src={getAssetUrl(asset, 'ogg')} type="audio/ogg" />
      </audio>
    ))}
  </div>
));
