import {
  stubFalse as providesFalse,
  mapValues,
} from 'lodash';

import {
  ENTERING,
  EXITING,
  ON_STAGE,
  OFF_STAGE,
} from './types';

export default class Cast {
  constructor({
    comparators,
  }) {
    this.comparators = comparators;
    this.mouseDownOnCast = false;
    this.mouseWithin = false;
    this.state = OFF_STAGE;
    this.cursor = '';
    this.__state = {};
  }

  load() {}

  unload() {
    this.state = OFF_STAGE;
  }

  isLoaded() {
    return this.state !== OFF_STAGE;
  }

  isEntering() {
    return this.state === ENTERING;
  }

  isExiting() {
    return this.state === EXITING;
  }

  isOnStage() {
    return this.state === ON_STAGE;
  }

  doAction() {}

  doEnter() {
    this.mouseWithin = false;
    this.mouseDownOnCast = false;
    this.state = ENTERING;
    this.load();
  }

  doEntering() {
    this.state = ON_STAGE;
    return true;
  }

  doExit() {
    this.mouseDownOnCast = false;
    this.state = EXITING;
  }

  doExiting() {
    this.state = OFF_STAGE;
    return true;
  }

  doMouseDown({ top, left }) {
    this.mouseDownOnCast = true;
    this.whereMouseDown = {
      top,
      left,
    };
    return false;
  }

  doMouseStillDown() {
    return false;
  }

  doMouseUp() {
    return false;
  }

  doMouseClick() {
    return false;
  }

  doMouseEnter() {
    this.mouseWithin = true;
    return false;
  }

  doMouseLeave() {
    this.mouseWithin = false;
    return false;
  }

  doAlways() {
    return false;
  }

  pointOverCast() {
    return false;
  }

  isEnabled() {

  }
}

Object.assign(Cast, {
  ENTERING,
  EXITING,
  ON_STAGE,
  OFF_STAGE,
});
