export const TEST_TYPES = [
  'EqualTo', // 0
  'NotEqualTo', // 1
  'GreaterThan', // 2
  'LessThan', // 3
]

export const GESTURES = [
  'MouseDown', // 0
  'MouseUp', // 1
  'MouseClick', // 2
  'MouseEnter', // 3
  'MouseLeave', // 4
  'MouseNone', // 5
  'Always', // 6
  'SceneEnter', // 7
  'SceneExit', // 8
  'Rotation', // 9
]

enum CastActionTypes {
  ChangeScene,
  DissolveTo,
  IncrementState,
  DecrementState,
  GoBack,
  Rotate,
  HorizSlider,
  VertSlider,
  TwoAxisSlider,
  SetStateTo,
  ExchangeState,
  CopyState,
  ChangeCursor,
  ReturnFromHelp,
  NoAction,
  Menu,
  DoGameAction = 99,
}

type CastActionTypeStrings = keyof typeof CastActionTypes

export const ACTION_TYPES: { [key: number]: CastActionTypeStrings } = {
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
  15: 'Menu',
  99: 'DoGameAction',
}

export const ORIGINAL_HEIGHT = 400
export const ORIGINAL_WIDTH = 640
export const ORIGINAL_ASPECT_RATIO = ORIGINAL_WIDTH / ORIGINAL_HEIGHT
export const PANO_CANVAS_WIDTH = 3072
export const DST_WIDTH = 1024
export const DST_HEIGHT = 512
export const DST_RATIO = 3600 / 3072
export const PANO_CHUNK = 620
export const PANO_DRAW_NUDGE = 240
export const PANO_UV_NUDGE = 300
export const DST_PANO_RATIO = DST_WIDTH / PANO_CHUNK
export const PANO_SCROLL_OVERFLOW = 128
export const PANO_OFFSET = DST_WIDTH - PANO_SCROLL_OVERFLOW
