import { values } from 'lodash';
import React, { PropTypes } from 'react';
import { connect } from 'react-redux';

import store from '../store';
import {
  videoLoadComplete,
  videoIsPlaying,
  videoPlayDone,
} from '../actions/video';
import {
  fetchScene,
} from '../actions/scene';
import {
  load as loadPano,
} from '../actions/pano';
import {
  ended as transitionEnded,
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
      const { scene } = store.getState();
      const { current, cache } = scene;
      const sceneData = cache[current];
      const { casts } = sceneData;
      const transitionCast = casts.find(c => c.castId === sceneData.sceneId);
      const { nextSceneId } = transitionCast;
      if (nextSceneId) {
        // dispatch(fetchScene(nextSceneId))
        //   .then(() => dispatch(loadPano()));
      }
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
