import { curry } from 'lodash';
import React, { PropTypes } from 'react';
import { connect } from 'react-redux';

import {
  selectors as gameSelectors,
} from 'morpheus/game';
import {
  actions as videoActions,
  selectors as videoSelectors,
} from 'morpheus/video';
import {
  actions as panoAnimActions,
} from 'morpheus/panoAnim';
import Video from './Video';

function mapStateToProps(state) {
  return {
    playing: videoSelectors.playing(state),
    loaded: videoSelectors.loaded(state),
    loading: videoSelectors.loading(state),
    done: videoSelectors.loading(state),
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
      dispatch(videoActions.videoLoadComplete(name, videoEl));
      dispatch(panoAnimActions.panoAnimLoaded(name, videoEl));
    },
    videoPlaying() {
    },
    videoEnded(name, { currentTarget: videoEl }) {
      dispatch(videoActions.videoPlayDone(name, videoEl));
    },
  };
}

export default connect(
  mapStateToProps,
  mapDisptachToProps,
)(({
  loading,
  loaded,
  playing,
  done,
  videoCreated,
  videoCanPlay,
  videoPlaying,
  videoEnded,
}) => {
  const videos = [];
  loading.forEach(v => videos.push(
    <Video
      key={`fullscreenvideo:${v.url}`}
      videoCreated={curry(videoCreated, v.url)}
      src={v.url}
      onLoadedMetadata={curry(videoCanPlay, v.url)}
      onPlaying={curry(videoPlaying, v.url)}
      onEnded={curry(videoEnded, v.url)}
      loop={v.looping}
      offscreen
      muted
      playsInline
    />
  ));

  loaded.forEach(v => videos.push(
    <Video
      key={`fullscreenvideo:${v.url}`}
      videoCreated={(videoEl) => {
        if (videoEl) videoEl.play();
        videoCreated(v.url);
      }}
      src={v.url}
      onLoadedMetadata={curry(videoCanPlay, v.url)}
      onPlaying={curry(videoPlaying, v.url)}
      onEnded={curry(videoEnded, v.url)}
      loop={v.looping}
      offscreen
      muted
      playsInline
    />,
  ));

  playing.forEach(v => videos.push(
    <Video
      key={`fullscreenvideo:${v.url}`}
      videoCreated={curry(videoCreated, v.url)}
      src={v.url}
      onLoadedMetadata={curry(videoCanPlay, v.url)}
      onPlaying={curry(videoPlaying, v.url)}
      onEnded={curry(videoEnded, v.url)}
      loop={v.looping}
      offscreen
      muted
      playsInline
    />,
  ));

  done.forEach(v => videos.push(
    <Video
      key={`fullscreenvideo:${v.url}`}
      videoCreated={curry(videoCreated, v.url)}
      src={v.url}
      loop={v.looping}
      autoPlay
      offscreen
      muted
      playsInline
    />,
  ));

  return (
    <div>
      {videos}
    </div>
  );
});
