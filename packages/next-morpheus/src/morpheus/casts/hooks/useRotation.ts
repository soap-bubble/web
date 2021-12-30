import { useCallback, useMemo, useState } from 'react';

const UP_DOWN_LIMIT = 5.3 * (Math.PI / 180);

const step = (num: number, max: number) => {
  if (num > max) {
    return num - max;
  } else if (num < 0) {
    return num + max;
  }
  return num;
};

const clampNumber = (num: number, a: number, b: number) =>
  Math.max(Math.min(num, Math.max(a, b)), Math.min(a, b));

function clampRotation(
  rotation: { x: number; y: number },
  delta: { x: number; y: number }
) {
  let newRotationX = rotation.x - delta.y;
  const newRotationY = clampNumber(
    rotation.y + (delta.x * Math.PI) / 720,
    -UP_DOWN_LIMIT,
    UP_DOWN_LIMIT
  );
  const chunk = Math.floor((newRotationX % 3072) / 24) * 24;
  return {
    x: step(newRotationX, 3072),
    y: newRotationY,
    offsetX: chunk,
  };
}

export default function useRotation() {
  const [rotation, setRotation] = useState({
    x: 0,
    y: 0,
    offsetX: 0,
  });
  const updateRotation = useCallback(
    (deltaX: number, deltaY: number) => {
      setRotation(clampRotation(rotation, { x: deltaX, y: deltaY }));
    },
    [rotation, setRotation]
  );
  const setRotationWithOffsetX = useCallback(
    (rotationX: number, rotationY: number) => {
      setRotation({
        x: rotationX,
        y: rotationY,
        offsetX: Math.floor((rotationX % 3072) / 24) * 24,
      });
    },
    [setRotation]
  );
  return useMemo(() => {
    return {
      ...rotation,
      setRotation: setRotationWithOffsetX,
      updateRotation,
    };
  }, [rotation, setRotation, updateRotation]);
}
