import { connect } from 'react-redux'

import { volume as volumeSelector } from '../selectors'
import { setVolume } from '../actions'
import { Dispatch } from 'redux'

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

export default connect(mapStateToProps, mapDispatchToPros)(() => null)
