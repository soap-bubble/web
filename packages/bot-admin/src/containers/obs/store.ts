import emojiDataRow from '@branes/www/emojis/core.json'

interface Emoji {
  id: number
  regex: string
  images: {
    emoticon_set: number
    height: number
    width: number
    url: string
  }
}

const emojiData: Emoji[] = emojiDataRow as any
const emojiCache: { [key: number]: Emoji } = {}

export function sample() {
  const index = Math.floor(Math.random() * emojiData.length)
  return emojiData[index].id
}

export default function get(id: number) {
  if (!emojiCache[id]) {
    const candidate = emojiData.find(({ id: emojiId }) => emojiId === id)
    if (candidate) {
      emojiCache[id] = {
        ...candidate,
        images: {
          ...candidate.images,
          url: `/api/twitchEmoji?u=${new URL(candidate.images.url).pathname}`,
        },
      }
    }
  }
  return emojiCache[id]
}
