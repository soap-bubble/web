import { connect, ConnectedProps } from 'react-redux';
import { ThunkDispatch } from 'redux-thunk'
import {
  closeSettings,
  fullscreen,
} from '../commands';
import Settings from '../components/Settings';
import { ComponentType } from 'react';

function mapStateToProps(state: any) {
  return state;
}

function mapDispatchToPros(dispatch: ThunkDispatch<any, any, any>) {
  return {
    onClose() {
      dispatch(closeSettings());
    },
    onFullscreen() {
      dispatch(fullscreen());
    },
  };
}

const connector = connect(mapStateToProps, mapDispatchToPros)

export type SettingsProps = ConnectedProps<typeof connector>

type ConnectedSettingsComponent = ComponentType<SettingsProps>
const ConnectedSettings = connector(Settings) as ConnectedSettingsComponent

export default ConnectedSettings
