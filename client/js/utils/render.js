import raf from 'raf';
import loggerFactory from 'utils/logger';

const logger = loggerFactory(__filename);

let onBefores = [];
let onRenders = [];
let onAfters = [];
let isActive = false;

export function render() {
  try {
    onBefores.forEach(r => r());
    onRenders.forEach(r => r());
    onAfters.forEach(r => r());
  } catch(err) {
    logger.error(err);
  } finally {
    if (isActive) {
      raf(render);
    }
  }
}

export function reset() {
  onBefores = [];
  onRenders = [];
  onAfters = [];
  isActive = false;
}

const renderEvents = {
  onBefore(handler) {
    onBefores.push(handler);
  },
  onAfter(handler) {
    onAfters.push(handler);
  },
  onRender(handler) {
    onRenders.push(handler);
    if (!isActive) {
      isActive = true;
      raf(render);
    }
  },
  reset,
};

export default renderEvents;
