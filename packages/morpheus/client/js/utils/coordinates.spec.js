import { gameToScreen, screenToGame } from './coordinates'

import { ORIGINAL_ASPECT_RATIO } from 'morpheus/constants'

describe('coordinates test stuite', () => {
  describe('screenToGameFactory', () => {
    it('converts a value', () => {
      expect(
        screenToGame({
          width: 100,
          height: 100,
          left: 50,
          top: 50,
        }),
      ).toEqual({
        left: 320,
        top: 200,
      })
    })
  })

  function check({ width, top, left }) {
    expect(
      gameToScreen({
        width,
        height: width / ORIGINAL_ASPECT_RATIO,
        ...screenToGame({
          width,
          height: width / ORIGINAL_ASPECT_RATIO,
          left,
          top,
        }),
      }),
    ).toEqual({
      left,
      top,
    })
  }

  describe('conversion', () => {
    it('equality', () => {
      check({
        width: 640,
        top: 200,
        left: 320,
      })
    })
    it('middle', () => {
      check({
        width: 100,
        top: 100 / ORIGINAL_ASPECT_RATIO / 2,
        left: 50,
      })
    })

    it('wide', () => {
      check({
        width: 200,
        top: 20,
        left: 155,
      })
    })
  })
})
