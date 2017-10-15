import { connect } from 'react-redux';
import { VolumeSlider } from '@soapbubble/components';
import {
  volume as volumeSelector,
} from '../selectors';
import {
  setVolume,
} from '../actions';

function mapStateToProps(state) {
  const volume = volumeSelector(state);
  return {
    volume,
  };
}

function mapDispatchToPros(dispatch) {
  return {
    onChange(inputEvent) {
      dispatch(setVolume(parseInt(inputEvent.currentTarget.value, 10)));
    },
  };
}

export default connect(mapStateToProps, mapDispatchToPros)(VolumeSlider);
