import { values } from 'lodash';
import React, { PropTypes } from 'react';
import { connect } from 'react-redux';

import store from '../store';
import {
  videoLoad,
  videoLoadComplete,
  videoPlayDone,
} from '../actions/video';
import {
  panoAnimLoaded,
} from '../actions/panoAnim';
import Video from './Video';

function mapStateToProps({ video, dimensions }) {
  const { width, height } = dimensions;

  return {
    video,
    width,
    height,
  };
}

function mapDisptachToProps(dispatch, props) {
  return {
    videoCreated(name, videoEl) {
      //dispatch(videoLoad(name, videoEl));
    },
    videoCanPlay(name, { currentTarget: videoEl }) {
      dispatch(videoLoadComplete(name, videoEl));
      dispatch(panoAnimLoaded(name, videoEl));
    },
    videoPlaying(name, { currentTarget: videoEl }) {
    },
    videoEnded(name, { currentTarget: videoEl }) {
      dispatch(videoPlayDone(name, videoEl));
    },
  };
}

export default connect(
  mapStateToProps,
  mapDisptachToProps,
)(({
  looping,
  video,
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
        videoCreated={videoCreated.bind(null, url)}
        src={url}
        onLoadedMetadata={videoCanPlay.bind(null, url)}
        onPlaying={videoPlaying.bind(null, url)}
        onEnded={videoEnded.bind(null, url)}
        loop={v.looping}
        autoPlay
        offscreen
      />);
    } else if (v.state === 'loaded') {
      return (<Video
        key={`fullscreenvideo:${url}`}
        videoCreated={videoCreated.bind(null, url)}
        src={url}
        onLoadedMetadata={videoCanPlay.bind(null, url)}
        onPlaying={videoPlaying.bind(null, url)}
        onEnded={videoEnded.bind(null, url)}
        autoPlay
        loop={v.looping}
        offscreen
      />);
    } else if (v.state === 'playing') {
      return (<Video
        key={`fullscreenvideo:${url}`}
        videoCreated={videoCreated.bind(null, url)}
        src={url}
        onLoadedMetadata={videoCanPlay.bind(null, url)}
        onPlaying={videoPlaying.bind(null, url)}
        onEnded={videoEnded.bind(null, url)}
        loop={v.looping}
        offscreen
        autoPlay
      />);
    } else if (v.state === 'done') {
      return (<Video
        key={`fullscreenvideo:${url}`}
        videoCreated={videoCreated.bind(null, url)}
        src={url}
        loop={v.looping}
        autoPlay
        offscreen
      />);
    }
  });

  return (
    <div>
      {videos}
    </div>
  );
});
