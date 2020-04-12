import React, { FunctionComponent, useEffect, useState } from 'react'
import { useTransition } from 'react-spring/three.cjs'
import { easeCubicOut } from 'd3-ease'
import Canvas from './Canvas'
import Bounce from './BounceSpring'
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

const Content: FunctionComponent = () => {
  const [count, setCount] = useState(0)
  const [index, setIndex] = useState(0)
  const [items, setItems] = useState<[number, number, number][]>([])
  const [queue, setQueue] = useState<[number, number, number][]>(defaultQueue)
  useEffect(() => {
    const cancel = setTimeout(() => {
      if (count + index < queue.length) {
        let newCount: number = count,
          newIndex: number = index
        if (count < 5) {
          newCount++
          setCount(newCount)
        } else {
          newIndex++
          setIndex(newIndex)
        }
        setItems(queue.slice(newIndex, newIndex + newCount))
      } else if (count > 0) {
        const newIndex = index + 1
        setIndex(newIndex)
        const newCount = count - 1
        setCount(newCount)
        setItems(queue.slice(newIndex, newIndex + newCount))
      } else {
        setIndex(0)
        setCount(0)
        setItems([])
        setQueue(newQueue())
      }
    }, 125)
    return () => clearTimeout(cancel)
  }, [index, count])
  const transitions = useTransition(
    items,
    ([id, x, y]: any) => `${id}:${x}:${y}`,
    {
      from: { opacity: 0, scale: [25, 25, 1] },
      enter: [{ opacity: 1, scale: [150, 150, 1] }],
      leave: [{ opacity: 0, scale: [100, 100, 1] }],
      config: { duration: 750, easing: easeCubicOut },
    }
  )

  const contents = transitions.map(
    ({ item: [id, x, y], key, props: { opacity, scale } }: any) => (
      <Bounce key={key} id={id} x={x} y={y} opacity={opacity} scale={scale} />
    )
  )
  return <Canvas>{contents}</Canvas>
}

export default Content
