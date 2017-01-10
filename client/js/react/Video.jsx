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
      objectFit: 'cover',
    }}
    ref={videoCreated}
    width={width}
    height={height}
    autoPlay={autoPlay}
    loop={loop}
    controls={false}
    onCanPlayThrough={onCanPlayThrough}
    onEnded={onEnded}
    onPlaying={onPlaying}
  >
    <source
      src={`${src}.webm`}
      type="video/webm" 
    />
    <source
      src={`${src}.mp4`}
      type="video/mp4"
    />
  </video>
)

Video.displayName = 'Video';

export default Video;
