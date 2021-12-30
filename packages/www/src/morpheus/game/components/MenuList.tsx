import React from "react";
// import { ListGroup } from 'react-bootstrap';

const MenuList = ({
  isOpenSave,
  browserSaveData,
  isLoggedIn,
  doLogout,
  doLogin,
  doCloudSaveNew,
  doCloudSave,
  doCloudLoad,
  doLocalSave,
  doBrowserSave,
  doBrowserLoad,
  doLocalLoad,
  doSettings,
  doReload,
}: any) => {
  return null;
  // TODO: BOOTSTRAP
  // <ListGroup>
  //   {isLoggedIn ?
  //     <React.Fragment>
  //       <ListGroup.Item onClick={doLogout}>Logout</ListGroup.Item>
  //       <ListGroup.Item onClick={doCloudSaveNew}>New cloud save</ListGroup.Item>
  //       {isOpenSave ? <ListGroup.Item onClick={doCloudSave}>Save to cloud</ListGroup.Item> : null}
  //     </React.Fragment>
  //    : <ListGroup.Item onClick={doLogin}>Login</ListGroup.Item>}
  //   <ListGroup.Item onClick={doLocalSave}>Save to local file</ListGroup.Item>
  //   <ListGroup.Item onClick={doBrowserSave}>Save to browser</ListGroup.Item>
  //   {isLoggedIn ? <ListGroup.Item onClick={doCloudLoad}>Load from cloud</ListGroup.Item> : null}
  //   {browserSaveData ? <ListGroup.Item onClick={doBrowserLoad}>Load from browser</ListGroup.Item> : null}
  //   <ListGroup.Item>
  //     Load file local file: <input type="file" onChange={doLocalLoad} />
  //   </ListGroup.Item>
  //   <ListGroup.Item onClick={doSettings}>Settings</ListGroup.Item>
  //   <ListGroup.Item onClick={doReload}>Reload</ListGroup.Item>
  // </ListGroup>
};

export default MenuList;
