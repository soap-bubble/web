import React, { PropTypes } from 'react';
import {
  GUI,
  Folder,
  Number as DGNumber,
} from 'dis-gui';

const Tools = ({
  camera,
  sensitivity,
  setCameraPositionZ,
  setSensitivity,
}) => {
  const cameraTools = [];
  if (camera) {
    cameraTools.push(<DGNumber label="Translate Z" key="camera:z" value={camera.position.z} min={-5} max={5} step={0.001} onChange={setCameraPositionZ}/>);
  }
  return (
    <GUI>
      <Folder label='Camera'>
        {cameraTools}
      </Folder>
      <Folder label='Scene'>
        <DGNumber label="Sensitivity" key="scene:sensitivity" value={sensitivity} min={20} max={200} step={1} onChange={setSensitivity}/>
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

export default Tools;
