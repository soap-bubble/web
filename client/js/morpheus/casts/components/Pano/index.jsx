import { connect } from 'react-redux';
import React from 'react';
import {
  selectors as castSelectors,
} from 'morpheus/casts';
import {
  selectors as sceneSelectors,
} from 'morpheus/scene';
import Hotspots3D from './Hotspots3D';
import Scene3D from './Scene3D';

function mapStateToProps(state) {
  return {
    isLive: sceneSelectors.isLive(state),
    isPano: castSelectors.hotspot.isPano(state),
  };
}

const Visibility = ({
  children,
  visible,
}) => (
  <div
    style={{
      visibility: visible ? null : 'hidden',
    }}
  >
    { children }
  </div>
);

const Pano = ({
  children,
  isPano,
  isLive,
}) => {
  let elements = Array.isArray(children) ? children.slice(0) : [];
  elements.push(<Scene3D />);
  if (isPano) elements = [<Hotspots3D />].concat(elements);
  return (
    <Visibility visible={isLive}>
      { elements }
    </Visibility>
  );
};

export default connect(mapStateToProps)(Pano);
