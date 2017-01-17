import { values } from 'lodash';
import React, { PropTypes } from 'react';
import { connect } from 'react-redux';

import {
  videoLoadComplete,
  videoIsPlaying,
  videoPlayDone,
} from '../actions/video'
import {
  ended as transitionEnded
} from '../actions/transition';
import Video from './Video';

function mapStateToProps({ game, video, dimensions }) {
  const { volume } = game;
  const { width, height } = dimensions;

  return {
    video,
    width,
    height,
    volume,
  };
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
    videoPlaying(name) {
      dispatch(videoIsPlaying(name));
    },
    videoEnded(name) {
      dispatch(transitionEnded());
      dispatch(videoPlayDone(name));
    },
  };
}

export default connect(
  mapStateToProps,
  mapDisptachToProps,
)(({
  video,
  width,
  height,
  videoCreated,
  videoCanPlay,
  videoPlaying,
  videoEnded,
}) => {
  const videos = Object.keys(video).map(url => {
    const v = video[url];
    if (v.state === 'loading') {
      return (<Video
        key={`fullscreenvideo:${url}`}
        videoCreated={videoCreated}
        src={url}
        width={width}
        height={height}
        onCanPlayThrough={videoCanPlay.bind(null, url)}
        onPlaying={videoPlaying.bind(null, url)}
        onEnded={videoEnded.bind(null, url)}
        autoPlay
        offscreen
      />);
    } else if (v.state === 'loaded') {
      return (<Video
        key={`fullscreenvideo:${url}`}
        videoCreated={videoCreated}
        src={url}
        width={width}
        height={height}
        onCanPlayThrough={videoCanPlay.bind(null, url)}
        onPlaying={videoPlaying.bind(null, url)}
        onEnded={videoEnded.bind(null, url)}
        autoPlay
      />);
    } else if (v.state === 'playing') {
      return (<Video
        key={`fullscreenvideo:${url}`}
        videoCreated={videoCreated}
        src={url}
        width={width}
        height={height}
        onCanPlayThrough={videoCanPlay.bind(null, url)}
        onPlaying={videoPlaying.bind(null, url)}
        onEnded={videoEnded.bind(null, url)}
        autoPlay
      />);
    } else if (v.state === 'done') {
      return (<Video
        key={`fullscreenvideo:${url}`}
        videoCreated={videoCreated}
        src={url}
        width={width}
        height={height}
        autoPlay
      />);
    }
  });

  return (
    <div>
      {videos}
    </div>
  );
});
