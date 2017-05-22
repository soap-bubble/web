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
  actions as transitionActions,
} from 'morpheus/transition';
import Video from './Video';

function mapStateToProps(state) {
  return {
    playing: videoSelectors.playing(state),
    loaded: videoSelectors.loaded(state),
    loading: videoSelectors.loading(state),
    done: videoSelectors.loading(state),
    width: gameSelectors.width(state),
    height: gameSelectors.height(state),
    volume: gameSelectors.volume(state),
  };
}

function mapDisptachToProps(dispatch) {
  let videoEl;
  return {
    videoCreated(_videoEl) {
      videoEl = _videoEl;
    },
    videoCanPlay(name) {
      dispatch(videoActions.videoLoadComplete(name, videoEl));
    },
    videoPlaying(name) {
      dispatch(videoActions.videoIsPlaying(name));
    },
    videoEnded(name) {
      dispatch(transitionActions.ended());
      dispatch(videoActions.videoPlayDone(name));
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
  width,
  height,
  videoCreated,
  videoCanPlay,
  videoPlaying,
  videoEnded,
}) => {
  const videos = [];
  loading.forEach(v => videos.push(<Video
    key={`fullscreenvideo:${v.url}`}
    videoCreated={videoCreated}
    src={v.url}
    width={width}
    height={height}
    onCanPlayThrough={curry(videoCanPlay, v.url)}
    onPlaying={curry(videoPlaying, v.url)}
    onEnded={curry(videoEnded, v.url)}
    autoPlay
    offscreen
    fullscreen
  />));
  loaded.forEach(v => videos.push(<Video
    key={`fullscreenvideo:${v.url}`}
    videoCreated={videoCreated}
    src={v.url}
    width={width}
    height={height}
    onCanPlayThrough={curry(videoCanPlay, v.url)}
    onPlaying={curry(videoPlaying, v.url)}
    onEnded={curry(videoEnded, v.url)}
    autoPlay
    fullscreen
  />));
  playing.forEach(v => videos.push(<Video
    key={`fullscreenvideo:${v.url}`}
    videoCreated={videoCreated}
    src={v.url}
    width={width}
    height={height}
    onCanPlayThrough={curry(videoCanPlay, v.url)}
    onPlaying={curry(videoPlaying, v.url)}
    onEnded={curry(videoEnded, v.url)}
    autoPlay
    fullscreen
  />));
  done.forEach(v => videos.push(<Video
    key={`fullscreenvideo:${v.url}`}
    videoCreated={videoCreated}
    src={v.url}
    width={width}
    height={height}
    autoPlay
    fullscreen
  />));

  return (
    <div>
      {videos}
    </div>
  );
});
