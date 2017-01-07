import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import {
  GUI,
  Folder,
  Number as DGNumber,
  Checkbox,
} from 'dis-gui';

import { setVolume } from '../actions/game';
import { setSensitivity, positionCamera } from '../actions/pano';
import { setHotspotsTheta, setHotspotsVisibility } from '../actions/hotspots';
import store from '../store';

function mapStateToProps({ game, scene, pano, hotspots }) {
  const {
    volume,
  } = game;

  const {
    camera,
  } = pano;

  const {
    sensitivity,
  } = pano;

  const {
    theta: hotspotsTheta,
    visible: hotspotsVisible,
  } = hotspots;

  return {
    volume: volume * 100,
    camera,
    sensitivity,
    hotspotsTheta,
    hotspotsVisible,
  };
}

function mapDisptachToProps(dispatch) {
  return {
    setCameraPositionZ(z) {
      dispatch(positionCamera({ z }));
    },
    setSensitivity(sensitivity) {
      dispatch(setSensitivity(sensitivity));
    },
    setHotspotsTheta(theta) {
      dispatch(setHotspotsTheta(theta));
    },
    setHotspotsVisibility(value) {
      dispatch(setHotspotsVisibility(value));
    },
    setVolume(volume) {
      dispatch(setVolume(volume / 100));
    }
  };
}

const Tools = ({
  camera,
  sensitivity,
  hotspotsTheta,
  hotspotsVisible,
  setHotspotsTheta,
  setCameraPositionZ,
  setSensitivity,
  setHotspotsVisibility,
  volume,
  setVolume,
}) => {
  const cameraTools = [];
  if (camera) {
    cameraTools.push(<DGNumber label="Translate Z" key="camera:z" value={camera.position.z} min={-5} max={5} step={0.001} onChange={setCameraPositionZ}/>);
  }
  return (
    <GUI expanded={false} style={{ controlWidth: 500 }}>
      {cameraTools.length ? <Folder label='Camera'>
        {cameraTools}
      </Folder> : null}
      <Folder label='Game'>
        <DGNumber label='Volume' value={volume} min={0} max={100} step={1} onChange={setVolume} />
      </Folder>
      <Folder label='Scene'>
        <DGNumber label='Sensitivity' value={sensitivity} min={20} max={200} step={1} onChange={setSensitivity}/>
      </Folder>
      <Folder label='Hotspots'>
        <DGNumber label='Theta' value={hotspotsTheta} min={-Math.PI} max={Math.PI} step={0.0001} onChange={setHotspotsTheta}/>
        <Checkbox label='Visible' checked={hotspotsVisible} onChange={setHotspotsVisibility}/>
      </Folder>
    </GUI>
  );
};

Tools.propTypes = {
  camera: PropTypes.object,
  sensitivity: PropTypes.number,
  setCameraPositionZ: PropTypes.func.isRequired,
  setSensitivity: PropTypes.func.isRequired,
};


export default connect(
  mapStateToProps,
  mapDisptachToProps,
)(Tools);
