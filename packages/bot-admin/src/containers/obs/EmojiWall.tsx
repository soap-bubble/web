import React, {
  FunctionComponent,
  useEffect,
  useState,
  useMemo,
  useImperativeHandle,
  useRef,
} from 'react'
import { useTransition } from 'react-spring/three.cjs'

import Canvas from './Canvas'
import TwitchEmoji from './TwitchEmoji'
import { sample } from './store'
const WIDTH = 1800
const HEIGHT = 900
const newQueue = () => {
  const q: [number, number, number][] = []
  for (let i = 0; i <= 15; i++) {
    q.push([
      sample(),
      Math.floor(Math.random() * WIDTH) - 900,
      Math.floor(Math.random() * HEIGHT) - 450,
    ])
  }
  return q
}
let defaultQueue = newQueue()

const EmojiWall: FunctionComponent<{
  // done(items: [number, number, number][]): void
  items: [number, number, number][]
  transition: any
}> = ({ items, transition }) => {
  const transitions = useTransition(
    items,
    ([id, x, y]: any) => `${id}:${x}:${y}`,
    transition
  )

  const contents = transitions.map(({ item: [id, x, y], key, props }: any) => (
    <TwitchEmoji key={key} id={id} pos={[x, y, -200]} {...props} />
  ))
  return <Canvas>{contents}</Canvas>
}

export default EmojiWall
