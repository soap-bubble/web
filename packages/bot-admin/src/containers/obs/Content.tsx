import React, {
  FunctionComponent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
import EmojiWall from './EmojiWall'
import io from 'socket.io-client'
import { easeCubicOut } from 'd3-ease'
import useTransitionList from 'bot-admin/hooks/useTransitionList'
import { useRouter } from 'next/router'
import queue from './queue'
const WIDTH = 1800
const HEIGHT = 900

const Content: FunctionComponent = () => {
  const [items1, push1] = useTransitionList<[number, number, number]>(750)
  const [items2, push2] = useTransitionList<[number, number, number]>(1500)
  const [items3, push3] = useTransitionList<[number, number, number]>(1500)
  const { query } = useRouter()
  const push = useCallback((id: number) => {
    const { innerWidth: width, innerHeight: height } = window
    ;[push1, push2, push3][Math.floor(Math.random() * 3)]([
      id,
      Math.floor(Math.random() * width) - width / 2,
      Math.floor(Math.random() * height) - height / 2,
    ])
  }, [])
  const queuer = useMemo(() => queue(push, 60), [push])

  useEffect(() => {
    if (query.profileId) {
      const socket = io()
      socket.on('emoji', ({ id }: { id: number }) => {
        queuer(id)
      })

      socket.on('connect', () => {
        console.log('conntected')
        console.log(io)
        // const response = io.join(`/${query.profileId}`)
        // console.log(response)
        socket.emit('init', { profileId: query.profileId })
      })
      return () => {
        socket.disconnect()
      }
    }
  }, [query.profileId, queuer])

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
