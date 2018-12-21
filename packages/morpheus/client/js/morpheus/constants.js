export const TEST_TYPES = [
  'EqualTo',    // 0
  'NotEqualTo', // 1
  'GreaterThan', // 2
  'LessThan',   // 3
];

export const GESTURES = [
  'MouseDown',  // 0
  'MouseUp',    // 1
  'MouseClick', // 2
  'MouseEnter', // 3
  'MouseLeave', // 4
  'MouseNone',  // 5
  'Always',     // 6
  'SceneEnter', // 7
  'SceneExit',  // 8
  'Rotation',   // 9
];

export const ACTION_TYPES = {
  0: 'ChangeScene',
  1: 'DissolveTo',
  2: 'IncrementState',
  3: 'DecrementState',
  4: 'GoBack',
  5: 'Rotate',
  6: 'HorizSlider',
  7: 'VertSlider',
  8: 'TwoAxisSlider',
  9: 'SetStateTo',
  10: 'ExchangeState',
  11: 'CopyState',
  12: 'ChangeCursor',
  13: 'ReturnFromHelp',
  14: 'NoAction',
  99: 'DoGameAction',
};

export const ORIGINAL_HEIGHT = 400;
export const ORIGINAL_WIDTH = 640;
export const ORIGINAL_ASPECT_RATIO = ORIGINAL_WIDTH / ORIGINAL_HEIGHT;
