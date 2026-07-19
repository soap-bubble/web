export const MORPHEUS_INITIAL_SCENE_ID = 2000;

export function createLivingSaveResumePointId(): string {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }
  return `resume-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
