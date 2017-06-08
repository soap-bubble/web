import { connect } from 'react-redux';
import React from 'react';
import {
  selectors as hotspotSelectors,
} from 'morpheus/hotspot';
import {
  selectors as panoAnimSelectors,
} from 'morpheus/panoAnim';
import Hotspots3D from './Hotspots3D';
import Scene3D from './Scene3D';
import PanoAnim from './PanoAnim';

function mapStateToProps(state) {
  return {
    isPano: hotspotSelectors.isPano(state),
    isPanoAnim: panoAnimSelectors.isPanoAnim(state),
  };
}

const Pano = ({
  children,
  isPano,
  isPanoAnim,
}) => {
  let elements = Array.isArray(children) ? children.slice(0) : [];
  elements.push(<Scene3D key="scene:pano" />);
  if (isPano) elements = [<Hotspots3D key="scene:hotspots" />].concat(elements);
  if (isPanoAnim) elements.push(<PanoAnim key="scene:panoAnim" />);
  return (
    <div>
      { elements }
    </div>
  );
};

export default connect(mapStateToProps)(Pano);
