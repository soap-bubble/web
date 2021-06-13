import raf from "raf";
import loggerFactory from "utils/logger";
import { update as tweenUpdate } from "@tweenjs/tween.js";

const logger = loggerFactory(__filename);

let onBefores: (() => any)[] = [];
let onRenders: (() => any)[] = [];
let onAfters: (() => any)[] = [];
let onDestroy: (() => any)[] = [];
let isActive = false;

export function render() {
  if (isActive) {
    tweenUpdate();
    try {
      if (!document.hidden) {
        onBefores.forEach((r) => r());
        onRenders.forEach((r) => r());
        onAfters.forEach((r) => r());
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
  onDestroy.forEach((r) => r());
  onDestroy = [];
}

const renderEvents = {
  onDestroy(handler: () => any) {
    onDestroy.push(handler);
  },
  onBefore(handler: () => any) {
    onBefores.push(handler);
  },
  onAfter(handler: () => any) {
    onAfters.push(handler);
  },
  onRender(handler: () => any) {
    onRenders.push(handler);
    if (!isActive) {
      isActive = true;
      raf(render);
    }
  },
  reset,
};

export default renderEvents;
