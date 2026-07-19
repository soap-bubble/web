export interface PlayableMedia {
  play: () => Promise<void>
}

export type MediaPlaybackResult = 'started' | 'blocked' | 'failed'

type PlaybackErrorReporter = (message: string, error: unknown) => void

const defaultErrorReporter: PlaybackErrorReporter = (message, error) => {
  console.error(message, error)
}

export async function startMediaPlayback(
  media: PlayableMedia,
  reportError: PlaybackErrorReporter = defaultErrorReporter
): Promise<MediaPlaybackResult> {
  try {
    await media.play()
    return 'started'
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'NotAllowedError') {
      return 'blocked'
    }

    reportError('Video play failed:', error)
    return 'failed'
  }
}
