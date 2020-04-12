import React, { FunctionComponent, useEffect, useState } from 'react'
import { sample } from './store'
import EmojiWall from './EmojiWall'
import { easeCubicOut } from 'd3-ease'
import useTransitionList from '@branes/www/hooks/useTransitionList'
const WIDTH = 1800
const HEIGHT = 900

const Content: FunctionComponent = () => {
  const [items1, push1] = useTransitionList<[number, number, number]>(750)
  const [items2, push2] = useTransitionList<[number, number, number]>(1500)
  const [items3, push3] = useTransitionList<[number, number, number]>(1500)

  useEffect(() => {
    const cancel = setInterval(() => {
      ;[push1, push2, push3][Math.floor(Math.random() * 3)]([
        sample(),
        Math.floor(Math.random() * WIDTH) - 900,
        Math.floor(Math.random() * HEIGHT) - 450,
      ])
    }, 50)
    return () => clearInterval(cancel)
  }, [push1, push2, push3])

  return (
    <>
      <EmojiWall
        items={items1}
        transition={{
          from: { alpha: 0, scale: [25, 25, 1] },
          enter: [{ alpha: 1, scale: [150, 150, 1] }],
          leave: [{ alpha: 0, scale: [100, 100, 1] }],
          config: { duration: 750, easing: easeCubicOut },
        }}
      />
      <EmojiWall
        items={items2}
        transition={{
          from: { alpha: 0, scale: [25, 25, 1], rotation: [0, 0, 0] },
          enter: [
            { alpha: 1, scale: [150, 150, 1], rotation: [0, 0, 2 * Math.PI] },
          ],
          leave: [{ alpha: 0, scale: [5, 5, 1] }],
          config: { duration: 1500, easing: easeCubicOut },
        }}
      />
      <EmojiWall
        items={items3}
        transition={{
          from: { alpha: 0, scale: [25, 25, 1], rotation: [0, 0, 0] },
          enter: [
            { alpha: 1, scale: [150, 150, 1], rotation: [2 * Math.PI, 0, 0] },
          ],
          leave: [{ alpha: 0, scale: [5, 5, 1] }],
          config: { duration: 1500, easing: easeCubicOut },
        }}
      />
    </>
  )
}

export default Content
