import { useDispatch } from 'react-redux'
import { ThunkDispatch } from 'redux-thunk'
import { AnyAction } from 'redux'

export default () => useDispatch<ThunkDispatch<any, any, AnyAction>>()
