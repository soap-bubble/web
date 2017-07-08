import { connect } from 'react-redux';
import React from 'react';
import flatspot from 'morpheus/flatspot';
import {
  selectors as castSelectors,
} from 'morpheus/casts';

function mapStateToProps(state) {
  return {
    canvas: castSelectors.special.canvas(state),
    videos: castSelectors.special.videos(state),
  };
}

function mapDispatchToProps(dispatch) {
  return {
    dispatch,
  };
}

const Special = connect(
  mapStateToProps,
)(({
  canvas,
  videos,
  dispatch,
}) => (
  <div ref={(el) => {
    if (el) {
      el.appendChild(canvas);
      videos.forEach(video => el.appendChild(video));
      flatspot(dispatch);
    }
  }} style={{
    width: '100%',
    height: '100%',
  }}/>
));

export default Special;
