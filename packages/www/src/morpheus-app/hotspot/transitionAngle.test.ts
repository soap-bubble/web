import { describe, expect, it } from 'vitest'

import { transitionAngleToPanoramaYaw } from 'morpheus/scene/transitionAngle'

describe('transitionAngleToPanoramaYaw', () => {
  it('converts a transition movie centerline to the panorama viewport origin', () => {
    expect(transitionAngleToPanoramaYaw(2400)).toBe(2250)
  })

  it('wraps the viewport offset around a full rotation', () => {
    expect(transitionAngleToPanoramaYaw(100)).toBe(3550)
  })

  it('ignores transition angles without a destination heading', () => {
    expect(transitionAngleToPanoramaYaw(-1)).toBeUndefined()
    expect(transitionAngleToPanoramaYaw(Number.NaN)).toBeUndefined()
  })
})
