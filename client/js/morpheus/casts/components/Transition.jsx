import { curry } from 'lodash';
import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import {
  selectors as gameSelectors,
} from 'morpheus/game';
import {
  selectors as castSelectors,
} from 'morpheus/casts';
import Video from 'react/Video';

function mapStateToProps(state, { scene }) {
  return {
    video: castSelectors.forScene(scene).transition.video(state),
  };
}

function insertVideo(video, fading, divEl) {
  if (divEl) {
    divEl.appendChild(video);
  }
}

export default connect(
  mapStateToProps,
)(({
  video,
}) => (<div ref={curry(insertVideo)(video, fading)} />));
