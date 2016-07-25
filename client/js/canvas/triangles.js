
import wagner from 'wagner-core';

export function tessellation([width, height], [xSteps, ySteps], [xAnchor, yAnchor]) {
  const coords = [];
  const indexes = [];

  function findCoords() {
    if (coords.length === 0) {
      const xDelta = width / xSteps;
      const yDelta = height / ySteps;
      for (let y = -height / 2; y <= height / 2; y += yDelta) {
        for (let x = -width / 2; x <= width / 2; x += xDelta) {
          coords.push(x - xAnchor);
          coords.push(y - yAnchor);
        }
      }
    }
  }

  const selfie = {
    get vertexCoords() {
      findCoords();
      return coords;
    },
    vertexCoordSize: 2,
    get vertexCoordLength() {
      return this.vertexCoords.length / this.vertexCoordSize;
    },
    get vertexIndex() {
      if (indexes.length === 0) {
        findCoords();
        for (let y = 0; y < ySteps; y++) {
          const row = y * ySteps * 2;
          const row1 = y * ySteps * 2 + 1;
          for (let x = 0; x < xSteps; x++) {
            indexes.push(row + x);
            indexes.push(row + x + 2);
            indexes.push(row1 + x);
            indexes.push(row + x + 2);
            indexes.push(row1 + x + 2);
            indexes.push(row1 + x);
          }
        }
      }
      return indexes;
    },
    vertexIndexSize: 1,
    get vertexIndexLength() {
      return this.vertexIndex.length;
    },
  };
  return selfie;
}

wagner.constant('tessellation', tessellation);