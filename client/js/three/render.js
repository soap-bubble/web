import raf from 'raf';
import { throttle } from 'lodash';

import loggerFactory from '../utils/logger';

const log = loggerFactory('THREE:render');


export default function (renderer) {
  log.info('Starting renderer loop');

  const renderLogError = throttle((...rest) => {
    log.error(...rest);
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
