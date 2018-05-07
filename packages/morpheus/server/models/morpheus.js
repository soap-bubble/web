import { Schema } from 'mongoose';

export class Morpheus extends Schema {}

export class Cast extends Morpheus {
  constructor(opts) {
    super(opts);
    this.add({
      castId: Number,
      initiallyEnabled: Boolean,
      comparators: [{
        gameStateId: Number,
        testType: Number,
        value: Number,
      }],
    });
  }
}

export class GameState extends Morpheus {
  constructor(opts) {
    super(opts);
    this.add({
      stateId: Number,
      initialValue: Number,
      minValue: Number,
      maxValue: Number,
      stateWraps: Number,
      value: Number,
    });
  }
}

export class HotSpot extends Cast {
  constructor(opts) {
    super(opts);
    this.add({
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
      defaultPass: Boolean,
    });
  }
}

export class MovieCast extends Cast {
  constructor(opts) {
    super(opts);
    this.add({
      fileName: String,
      width: Number,
      height: Number,
    });
  }
}

export class ControlledMovieCast extends MovieCast {
  constructor(opts) {
    super(opts);
    this.add({
      controlledLocation: {
        x: Number,
        y: Number,
      },
      companionMovieCastId: Number,
      scale: Number,
      audioOnly: Boolean,
      controlledMovieCallbacks: [{
        frames: Number,
        direction: Number,
        callbackWhen: Number,
        gameState: Number,
      }],
    });
  }
}

export class PanoAnim extends MovieCast {
  constructor(opts) {
    super(opts);
    this.add({
      location: {
        x: Number,
        y: Number,
      },
      frame: Number,
      looping: Boolean,
    });
  }
}

export class MovieSpecialCast extends MovieCast {
  constructor(opts) {
    super(opts);
    this.add({
      location: {
        x: Number,
        y: Number,
      },
      startFrame: Number,
      endFrame: Number,
      scale: Number,
      looping: Boolean,
      dissolveToNextScene: Boolean,
      nextSceneId: Number,
      angleAtEnd: Number,
      audioOnly: Boolean,
      image: Boolean,
      actionAtEnd: Number,
    });
  }
}

export class PanoCast extends MovieCast {}
export class PreloadCast extends MovieCast {}
export class SoundCast extends MovieCast {}

export class Scene extends Morpheus {
  constructor(opts) {
    super(opts);
    this.add({
      sceneId: Number,
      cdFlags: Number,
      sceneType: Number,
      palette: Number,
      casts: [Schema.Types.Mixed],
    });
  }
}
