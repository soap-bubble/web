import { describe, expect, it } from 'vitest';

import {
  TRANSITION_SCENE_SENTINEL,
  isNavigableSceneTarget,
} from 'morpheus/scene/transitionTarget';

describe('scene transition targets', () => {
  it('treats authored zero and sentinel targets as no transition', () => {
    expect(isNavigableSceneTarget(null, 400050)).toBe(false);
    expect(isNavigableSceneTarget(0, 400050)).toBe(false);
    expect(isNavigableSceneTarget(TRANSITION_SCENE_SENTINEL, 400050)).toBe(
      false,
    );
  });

  it('rejects the current scene and accepts another playable scene', () => {
    expect(isNavigableSceneTarget(400050, 400050)).toBe(false);
    expect(isNavigableSceneTarget(4000, 400050)).toBe(true);
  });
});
