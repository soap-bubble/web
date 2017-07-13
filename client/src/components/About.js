import React from 'react';

const About = () => {
  return (
    <div className="container">
      <div className="row">
        <h2>About Soap Bubble Productions</h2>
        <p>Soap Bubble Productions is a small game company that developed the game <i>Morpheus</i> which was released in 1998.</p>
        <p>We are attempting to re-release Morpheus as a web game, playable on all modern desktops.  The game has been completely rewritten from scratch while re-using the existing game assets.  Eventually, we would like to remaster the game assets.</p>
        <h2>Source code</h2>
        <p><a href="https://github.com/CaptEmulation/webgl-pano">https://github.com/CaptEmulation/webgl-pano</a></p>
        <p>The source code is open source!  Original game files and some additional tools are still private.</p>
        <h2>Twitch</h2>
        <p><a href="https://www.twitch.tv/morpheusdev">https://www.twitch.tv/morpheusdev</a></p>
        <p>Want to watch Morpheus being developed?  Follow us on Twitch.tv!</p>
        <h2>Twitter</h2>
        <p><a href="https://twitter.com/dev_morpheus">@dev_morpheus</a></p>
        <p>Want the scoop on all of the Morpheus happenings?  Follow us on Twitter.</p>
      </div>
    </div>
  );
};

export default About;
