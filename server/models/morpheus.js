import _ from 'lodash';
import { Schema } from 'mongoose';
var util = require('util');

class Morhpeus extends Schema {
  constructor(opts) {
    super(opts)
  }
}

class Cast extends Morhpeus {
  constructor(opts) {
    super(opts);
    this.add({
      castId: Number
    });
  }
}

class ControlledMovieCast extends Cast {
  constructor(opts) {
    super(opts);
    this.add({
      controlledLocation: {
        "x": Number,
        "y": Number
      },
      companionMovieCastId: Number,
      scale: Number,
      controlledMovieCallbacks: [ {
        frames: Number,
        direction: Number,
        callbackWhen: Number,
        gameState: Number
      } ]
    });
  }
}

class GameState extends Morhpeus {
  constructor(opts) {
    super(opts);
    this.add({
      stateId: Number,
      initialValue: Number,
      minValue: Number,
      maxValue: Number,
      stateWraps: Number,
      value: Number
    });
  }
}

class HotSpot extends Cast {
  constructor(opts) {
    super(opts);
    this.add({
      comparators: [ {
        gameStateId: Number,
        testType: Number,
        value: Number
      }],
      castId: Number,
      rectTop: Number,
      rectBottom: Number,
      rectLeft: Number,
      rectRight: Number,
      cursorShapeWhenActive: Number,
      param1: Number,
      param2: Number,
      param3: Number,
      type: Number,
      gesture: Number,
      defaultPass: Boolean
    });
  }
}

class MovieCast extends Cast {
  constructor(opts) {
    super(opts);
    this.add({
      fileName: String
    });
  }
}

class PanoAnim extends MovieCast {
  constructor(opts) {
    super(opts);
    this.add({
      location: {
        "x": Number,
        "y": Number
      },
      "frame": Number,
      "looping": Boolean
    });
  }
}

class MovieSpecialCast extends MovieCast {
  constructor(opts) {
    super(opts);
    this.add({
      location: {
        "x": Number,
        "y": Number
      },
      "startFrame": Number,
      "endFrame": Number,
      "actionEnd": Number,
      "scale": Number,
      "looping": Boolean,
      "dissolveToNextScene": Boolean,
      "nextSceneId": Number,
      "angleAtEnd": Number,
    });
  }
}

class PanoCast extends MovieCast {}
class PreloadCast extends MovieCast {}
class SoundCast extends MovieCast {}

class Scene extends Morhpeus {
  constructor(opts) {
    super(opts);
    this.add({
      sceneId: Number,
      cdFlags: Number,
      sceneType: Number,
      palette: Number,
      casts: [ Schema.Types.Mixed ]
    });
  }
}

exports.classes = {};

exports.install = function (db) {
  var apply = function (name, Class) {
    return (exports.classes[name] = db.model(name, new Class()));
  }
  var discriminate = function (Parent, name, Class) {
    return (exports.classes[name] = Parent.discriminator(name, new Class()));
  }

  var cast = apply('Cast', Cast);
  discriminate(cast, 'ControlledMovieCast', ControlledMovieCast);
  discriminate(cast, 'HotSpot', HotSpot);
  discriminate(cast, 'MovieCast', MovieCast);
  discriminate(cast, 'MovieSpecialCast', MovieSpecialCast);
  discriminate(cast, 'PanoAnim', PanoAnim);
  discriminate(cast, 'PanoCast', PanoCast);
  discriminate(cast, 'PreloadCast', PreloadCast);
  discriminate(cast, 'SoundCast', SoundCast);

  apply('GameState', GameState);
  apply('Scene', Scene);
};

exports.get = function (className) {
  if (typeof className === 'undefined') {
    return _(exports.classes).values();
  }

  return exports.classes[className];
}
