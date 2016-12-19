import { createStore } from 'redux'
import morphReducer from '../reducers'

let store = createStore(morphReducer);
