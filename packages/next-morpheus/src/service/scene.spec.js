import { fetch } from './scene'

describe('#fetch', () => {
  it('fetches a scene', async () => {
    const scene = fetch(1050)
    expect(scene.casts.length).toBeGreaterThan(0)
  })
})
