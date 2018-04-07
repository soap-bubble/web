import {
  ACTION_TYPES,
  GESTURES,
} from 'morpheus/constants';

export const gesture = GESTURES.reduce((memo, curr, index) => {
  memo[`is${curr}`] = function isGestureType(hotspot) {
    return index === hotspot.gesture;
  };
  return memo;
}, {});

export const actionType = Object.keys(ACTION_TYPES).reduce((memo, curr) => {
  const type = ACTION_TYPES[curr];
  memo[`is${type}`] = function isActionType(hotspot) {
    return Number(curr) === hotspot.type;
  };
  return memo;
}, {});

export function hotspotRectMatchesPosition({ top, left }) {
  return ({
    rectTop,
    rectBottom,
    rectLeft,
    rectRight,
  }) => ((rectLeft > rectRight ?
    (left > rectLeft
     || left < rectRight)
  : (left > rectLeft
    && left < rectRight))
    && top > rectTop
    && top < rectBottom)
  || (rectTop === 0
    && rectLeft === 0
    && rectRight === 0
    && rectBottom === 0
  );
}

export function matchesHotspotRect({ rectTop: top, rectLeft: left }) {
  return hotspotRectMatchesPosition({ top, left });
}

export function hotspotRectMatchesStrict({ rectTop: top, rectLeft: left }) {
  return ({
    rectTop,
    rectBottom,
    rectLeft,
    rectRight,
  }) => ((rectLeft > rectRight ?
    (left > rectLeft
     || left < rectRight)
  : (left > rectLeft
    && left < rectRight))
    && top > rectTop
    && top < rectBottom);
}
