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

function mapStateToProps(state, { scene, fading }) {
  return {
    video: castSelectors.forScene(scene).transition.video(state),
  };
}

function insertVideo(video, fading, divEl) {
  if (divEl) {
    divEl.appendChild(video);
    if (fading !== 'out') {
      // video.play();
    }
  }
}

export default connect(
  mapStateToProps,
)(({
  video,
  fading,
}) => (<div ref={curry(insertVideo)(video, fading)} />));
