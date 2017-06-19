import * as selectors from './selectors';
import reducer from './reducer';
import * as actions from './actions';

import {
  delegate as hotspotDelegate,
} from './hotspot';
import {
  delegate as panoDelegate,
} from './pano';
import {
  delegate as panoAnimDelegate,
} from './panoAnim';
import {
  delegate as transitionDelegate,
} from './transition';

const delegates = {
  hotspot: hotspotDelegate,
  pano: panoDelegate,
  panoAnim: panoAnimDelegate,
  transition: transitionDelegate,
};

export {
  selectors,
  reducer,
  actions,
  delegates,
};

export default {
  selectors,
  reducer,
  actions,
  delegates,
};
