import raf from 'raf';

import loggerFactory from '../utils/logger';
import { throttle } from 'lodash';

const log = loggerFactory('THREE:render');


export default function (renderer) {
  log.info('Starting renderer loop');

  const renderLogError = throttle((...rest) => {
    log.error.apply(log, rest);
  }, 5000);

  function renderDelegate() {
    raf(renderDelegate);
    try {
      renderer();
    } catch (e) {
      renderLogError(e);
    }

  }
  raf(renderDelegate);
}
