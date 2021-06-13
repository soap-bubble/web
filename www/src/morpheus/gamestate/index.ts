import reducer from './reducer'
import * as selectors from './selectors'
import * as actions from './actions'
export { isCastActive, isActive, isHotspotActive } from './isActive'
export { selectors, reducer, actions }

export default {
  selectors,
  reducer,
  actions,
}
