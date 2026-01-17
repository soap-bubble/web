import { ACTION_TYPES, GESTURES } from 'morpheus/constants';
import type { Hotspot } from 'morpheus/casts/types';
import type { Matcher } from '@/utils/matchers';

export const gesture = GESTURES.reduce<Record<string, Matcher<Hotspot>>>(
  (memo, curr, index) => {
    memo[`is${curr}`] = function isGestureType(hotspot: Hotspot) {
      return index === hotspot.gesture;
    };
    return memo;
  },
  {},
);

export const actionType = Object.keys(ACTION_TYPES).reduce<
  Record<string, Matcher<Hotspot>>
>((memo, curr) => {
  const type = ACTION_TYPES[Number(curr)];
  memo[`is${type}`] = function isActionType(hotspot: Hotspot) {
    return Number(curr) === hotspot.type;
  };
  return memo;
}, {});

export function hotspotRectMatchesPosition({
  top,
  left,
}: {
  top: number;
  left: number;
}): Matcher<Hotspot> {
  return ({ rectTop, rectBottom, rectLeft, rectRight }: Hotspot) =>
    ((rectLeft > rectRight
      ? left > rectLeft || left < rectRight
      : left > rectLeft && left < rectRight) &&
      top > rectTop &&
      top < rectBottom) ||
    (rectTop === 0 &&
      rectLeft === 0 &&
      rectRight === 0 &&
      rectBottom === 0);
}

export function matchesHotspotRect({ rectTop: top, rectLeft: left }: Hotspot) {
  return hotspotRectMatchesPosition({ top, left });
}

export function hotspotRectMatchesStrict({
  rectTop: top,
  rectLeft: left,
}: Hotspot) {
  return ({ rectTop, rectBottom, rectLeft, rectRight }: Hotspot) =>
    (rectLeft > rectRight
      ? left > rectLeft || left < rectRight
      : left > rectLeft && left < rectRight) &&
    top > rectTop &&
    top < rectBottom;
}
