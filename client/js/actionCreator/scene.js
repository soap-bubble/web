import { bySceneId } from '../service/scene';

export function forScene(id = 1050) {
  const selfie = {
    request() {
      return bySceneId(id)
    }
  }
}
