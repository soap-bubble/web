import { values } from 'lodash';
import React, { PropTypes } from 'react';
import { connect } from 'react-redux';

import { videoLoadComplete } from '../actions/video'
import {
  ended as transitionEnded
} from '../actions/transition';
import Video from './Video';

function mapStateToProps({ video, dimensions }) {
  const { loading: loadingMap, loaded: loadedMap } = video;
  const { width, height } = dimensions;
  const loading = Object
    .keys(loadingMap)
    .filter(url => loadingMap[url]);
  const loaded = Object
    .keys(loadingMap);
  return {
    loading,
    loaded,
    width,
    height,
  }
}

function mapDisptachToProps(dispatch) {
  let videoEl;
  return {
    videoCreated(_videoEl) {
      videoEl = _videoEl;
    },
    videoCanPlay(name) {
      dispatch(videoLoadComplete(name, videoEl));
    },
    videoEnded(name) {
      dispatch(transitionEnded());
    },
  };
}

export default connect(
  mapStateToProps,
  mapDisptachToProps,
)(({
  loading,
  loaded,
  width,
  height,
  current,
  videoCreated,
  videoCanPlay,
  videoEnded,
}) => {
  const offscreenLoading = loading.map(url => (
    <Video
      key={`fullscreenvideo:${url}`}
      videoCreated={videoCreated}
      src={url}
      width={width}
      height={height}
      onCanPlayThrough={videoCanPlay.bind(null, url)}
      loop={false}
      autoPlay={false}
      offscreen={true}
    />
  ));

  const playing = loaded.map(url => (
    <Video
      key={`fullscreenvideo:${url}`}
      videoCreated={videoCreated}
      src={url}
      width={width}
      height={height}
      onCanPlayThrough={videoCanPlay.bind(null, url)}
      onEnded={videoEnded.bind(null, url)}
      loop={false}
      autoPlay={false}
      offscreen={false}
    />
  ));
  return (
    <div>
      {offscreenLoading}
      {playing}
    </div>
  );
});
