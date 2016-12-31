import React, { PropTypes } from 'react';

const Video = ({
  src,
  offscreen,
  width,
  height,
  videoCreated,
  autoPlay = false,
  loop = false,
  onCanPlayThrough,
  onEnded,
  onPlaying,
}) => (
  <video
    style={{
      visibility: offscreen ? 'hidden' : 'visible',
      'object-fit': 'cover',
    }}
    ref={videoCreated}
    src={src}
    width={width}
    height={height}
    autoPlay={autoPlay}
    loop={loop}
    controls={false}
    onCanPlayThrough={onCanPlayThrough}
    onEnded={onEnded}
    onPlaying={onPlaying}
  />
)

Video.displayName = 'Video';

export default Video;
