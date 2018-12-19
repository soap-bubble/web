

let numOfBeats = 0;
let lastHotSpot;
let lastDrum;

function reset() {
  numOfBeats = 0;
  lastHotSpot = null;
  lastDrum = -1;
}

export function execute(hotspot, gamestates, isMouseDown = false) {
  if (!isMouseDown) {
    return reset();
  }
  if (hotspot === lastHotSpot) {
    return null;
  }
  if
}
