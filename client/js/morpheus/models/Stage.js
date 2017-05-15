
export default class Stage {
  constructor({ casts }) {
    this.casts = casts;
  }

  updateStage() {
    this.casts.forEach((cast) => {
      if (cast.isEntering()) {
        cast.doEntering();
      }
      if ((cast.isEntering()
        || cast.isOnStage())
        && cast.isEnabled()) {
          // draw cast?
        }
    });
  }

  doAction() {

  }
}
