import raf from 'raf';
import loggerFactory from 'utils/logger';
import { update as tweenUpdate } from 'tween';

const logger = loggerFactory(__filename);

let onBefores = [];
let onRenders = [];
let onAfters = [];
let onDestroy = [];
let isActive = false;

export function render() {
  if (isActive) {
    tweenUpdate();
    try {
      if (!document.hidden) {
        onBefores.forEach(r => r());
        onRenders.forEach(r => r());
        onAfters.forEach(r => r());
      }
    } catch (err) {
      logger.error(err);
    } finally {
      if (isActive) {
        raf(render);
      }
    }
  }
}

export function reset() {
  onBefores = [];
  onRenders = [];
  onAfters = [];
  isActive = false;
  onDestroy.forEach(r => r());
  onDestroy = [];
}

const renderEvents = {
  onDestroy(handler) {
    onDestroy.push(handler);
  },
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
