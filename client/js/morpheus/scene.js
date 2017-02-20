export const SCENE_TYPE_LIST = {
  [1]: 'panorama',
  [2]: 'closeup',
  [3]: 'special',
  [4]: 'transition', // These are acutally rolled up into `special`, above
  [5]: 'helpMenu',
  [6]: 'credits',
  [7]: 'finalCredits',
};

export function getSceneType(sceneData) {
  if (!sceneData) return 'none';
  
  let sceneType = sceneData.sceneType;
  const { casts } = sceneData;
  // Find cast with scene's root resource
  const rootCast = casts.find(c => c.castId === sceneData.sceneId);
  if (rootCast && rootCast.nextSceneId) {
    // This is actually a transition....
    sceneType = 4;
  }
  return SCENE_TYPE_LIST[sceneType];
}
