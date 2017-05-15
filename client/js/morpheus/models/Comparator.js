class TestRelation {
  constructor(testType) {

  }
}

export default class Comparator  {
  constructor({
    stateId,
    testType,
    value,
  }) {
    this.stateId = stateId;
    this.testType = testType;
    this.value = value;
  }
}
