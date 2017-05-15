export default class GameState {
  constructor({
    initialValue,
    maxValue,
    minValue,
    stateId,
    stateWraps,
    value,
  }) {
    this.initialValue = initialValue;
    this.maxValue = maxValue;
    this.minValue = minValue;
    this.stateId = stateId;
    this.stateWraps = stateWraps;
    this.value = value;
    this.callbacks = [];
  }
}
