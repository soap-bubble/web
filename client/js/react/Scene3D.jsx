import { connect } from 'react-redux';
import React from 'react';
import {
  selectors as hotspotSelectors,
} from 'morpheus/hotspot';
import {
  selectors as panoAnimSelectors,
} from 'morpheus/panoAnim';
import Hotspots3D from './Hotspots3D';
import Pano from './Pano';
import PanoAnim from './PanoAnim';

function mapStateToProps(state) {
  return {
    isPano: hotspotSelectors.isPano(state),
    isPanoAnim: panoAnimSelectors.isPanoAnim(state),
  };
}

const Scene3D = ({
  children,
  isPano,
  isPanoAnim,
}) => {
  let elements = Array.isArray(children) ? children.slice(0) : [];
  elements.push(<Pano key="scene:pano" />);
  if (isPano) elements = [<Hotspots3D key="scene:hotspots" />].concat(elements);
  if (isPanoAnim) elements.push(<PanoAnim key="scene:panoAnim" />);
  return (
    <div>
      { elements }
    </div>
  );
};

export default connect(mapStateToProps)(Scene3D);
