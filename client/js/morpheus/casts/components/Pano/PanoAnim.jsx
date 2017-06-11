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
    videoCreated() {
      // dispatch(videoActions.videoLoad(name, videoEl));
    },
    videoCanPlay(name, { currentTarget: videoEl }) {
      dispatch(castActions.panoAnim.videoElRef(name, videoEl));
    },
    videoPlaying() {
    },
    videoEnded(name, { currentTarget: videoEl }) {
      // dispatch(videoActions.videoPlayDone(name, videoEl));
    },
  };
}

export default connect(
  mapStateToProps,
  mapDisptachToProps,
)(({
  filenames,
  videoCreated,
  videoCanPlay,
  videoPlaying,
  videoEnded,
}) => {
  const videos = [];
  filenames.forEach(v => videos.push(
    <Video
      key={`fullscreenvideo:${v}`}
      videoCreated={curry(videoCreated, v)}
      src={v}
      onLoadedMetadata={e => videoCanPlay(v, e)}
      onPlaying={e => videoCanPlay(v, e)}
      onEnded={curry(videoEnded, v)}
      loop
      offscreen
      muted
      playsInline
      autoPlay
    />,
  ));

  return (
    <div>
      {videos}
    </div>
  );
});
