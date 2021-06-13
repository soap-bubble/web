import menuImg from '../../../image/icon/gear.png'

const SIZE = 256
const OFFSET = 10
const SCALE = 0.15

export default function Menu(casts: any[]) {
  return [
    {
      castId: 0,
      comparators: [],
      cursorShapeWhenActive: 10002,
      defaultPass: false,
      gesture: 2,
      initiallyEnabled: true,
      rectBottom: OFFSET + SIZE * SCALE,
      rectLeft: OFFSET,
      rectRight: OFFSET + SIZE * SCALE,
      rectTop: OFFSET,
      type: 15,
    },
    ...casts,
    {
      castId: 15,
      comparators: [],
      dissolveToNextScene: false,
      url: menuImg,
      initiallyEnabled: true,
      location: {
        x: 10,
        y: 10,
      },
      width: SIZE,
      height: SIZE,
      scale: SCALE,
      image: true,
      __t: 'MovieSpecialCast',
    },
  ]
}
