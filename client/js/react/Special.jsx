import { connect } from 'react-redux';
import React from 'react';

import {
  specialImgIsLoaded,
} from '../actions/special';

function mapStateToProps({ special, dimensions }) {
  const {
    url: backgroundUrl,
  } = special;
  const {
    width,
    height,
  } = dimensions;

  return {
    backgroundUrl,
    width,
    height,
  }
}

function mapDispatchToProps(dispatch) {

  return {
    onImgIsLoaded() {
      dispatch(specialImgIsLoaded());
    }
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
