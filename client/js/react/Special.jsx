import { connect } from 'react-redux';
import React from 'react';

import flatspot from '../morpheus/flatspot';
import {
  specialImgIsLoaded,
} from '../actions/special';

function mapStateToProps({ special, dimensions }) {
  const {
    url: backgroundUrl,
    hotspotData,
  } = special;
  const {
    width,
    height,
  } = dimensions;

  return {
    backgroundUrl,
    hotspotData,
    width,
    height,
  }
}

function mapDispatchToProps(dispatch, { hotspotData }) {

  return {
    onImgIsLoaded() {
      dispatch(specialImgIsLoaded());
      flatspot(dispatch, hotspotData);
    },
  }
}

const Special = connect(
  mapStateToProps,
  mapDispatchToProps,
)(({
  backgroundUrl,
  onImgIsLoaded,
  width,
  height,
}) => (
  <div>
    <img
      style={{
        objectFit: 'cover',
      }}
      onLoad={onImgIsLoaded}
      src={backgroundUrl}
      width={width}
      height={height}
    />
  </div>
));

export default Special;
