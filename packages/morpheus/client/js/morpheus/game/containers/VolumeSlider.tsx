import { connect, ConnectedProps } from 'react-redux'

import { volume as volumeSelector } from '../selectors'
import { setVolume } from '../actions'
import { Dispatch } from 'redux'
import { ComponentType } from 'react'

function mapStateToProps(state: any) {
  const volume = volumeSelector(state)
  return {
    volume,
  }
}

function mapDispatchToPros(dispatch: Dispatch) {
  return {
    onChange(inputEvent: any) {
      dispatch(setVolume(parseInt(inputEvent.currentTarget.value, 10)))
    },
  }
}

const connector = connect(mapStateToProps, mapDispatchToPros)

export type VolumeSliderProps = ConnectedProps<typeof connector>

type ConnectedVolumeSliderComponent = ComponentType<VolumeSliderProps>
// Probably delete this file?
const VolumeSlider = connector(() => null) as ConnectedVolumeSliderComponent

export default VolumeSlider
