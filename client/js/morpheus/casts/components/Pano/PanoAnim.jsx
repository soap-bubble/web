import { curry } from 'lodash';
import React, { PropTypes } from 'react';
import { connect } from 'react-redux';

import {
  selectors as gameSelectors,
} from 'morpheus/game';
import {
  actions as castActions,
  selectors as castSelectors,
} from 'morpheus/casts';
import {
  actions as videoActions,
  selectors as videoSelectors,
} from 'morpheus/video';
import {
  actions as panoAnimActions,
} from 'morpheus/panoAnim';
import Video from 'react/Video';

function mapStateToProps(state) {
  return {
    filenames: castSelectors.panoAnim.filenames(state),
    width: gameSelectors.width(state),
    height: gameSelectors.height(state),
  };
}

function mapDisptachToProps(dispatch) {
  return {
    videoCanPlay(name, { currentTarget: videoEl }) {
      dispatch(castActions.panoAnim.videoElRef(name, videoEl));
    },
  };
}

export default connect(
  mapStateToProps,
  mapDisptachToProps,
)(({
  filenames,
  videoCanPlay,
}) => {
  const videos = [];
  filenames.forEach(src => videos.push(
    <video
      key={`fullscreenvideo:${src}`}
      style={{
        visibility: 'hidden',
      }}
      autoPlay
      controls={false}
      onCanPlayThrough={event => videoCanPlay(src, event)}
      crossOrigin="anonymous"
      loop
      muted
      playsInline
    >
      <source
        src={`${src}.webm`}
        type="video/webm"
      />
      <source
        src={`${src}.mp4`}
        type="video/mp4"
      />
    </video>,
  ));

  return (
    <div>
      {videos}
    </div>
  );
});
