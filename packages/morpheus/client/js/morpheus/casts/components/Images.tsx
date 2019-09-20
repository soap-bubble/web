import React, {
  useCallback,
  useRef,
  useEffect,
  useMemo,
  SyntheticEvent,
} from 'react'
import { getAssetUrl } from 'service/gamedb'
import { MovieCast, MovieSpecialCast } from '../types'

interface ImageElProps {
  url: string
  onLoad: (e: SyntheticEvent<HTMLImageElement>) => void
  onError: (e: SyntheticEvent<HTMLImageElement>) => void
}

const ImageEl = ({ url, onLoad, onError }: ImageElProps) => {
  return (
    <img
      src={url}
      style={{
        display: 'none',
      }}
      crossOrigin="anonymous"
      onLoad={onLoad}
      onError={onError}
    />
  )
}

type ImageCastEventCallback = (ref: [HTMLImageElement, MovieCast[]]) => void

// Used to compute VideoMovieCastCollection
interface MovieCastCollectionMap {
  [key: string]: MovieCast[]
}

interface ImagesProps {
  movieSpecialCasts: MovieCast[]
  onImageCastLoad: ImageCastEventCallback
  onImageCastError: ImageCastEventCallback
}

const Images = ({
  movieSpecialCasts,
  onImageCastLoad,
  onImageCastError,
}: ImagesProps) => {
  const aggregatedImageRefs = useMemo(
    () =>
      movieSpecialCasts.reduce(
        (memo: MovieCastCollectionMap, curr: MovieCast) => {
          const { fileName, url, image, startFrame } = curr as MovieSpecialCast
          let key =
            (fileName &&
              getAssetUrl(
                image ? `${fileName}.${startFrame}` : fileName,
                'png',
              )) ||
            url
          const ref = (memo[key] = memo[key] || [])
          ref.push(curr)
          return memo
        },
        {} as MovieCastCollectionMap,
      ),
    [movieSpecialCasts],
  )
  return (
    <React.Fragment>
      {Object.entries(aggregatedImageRefs).map(([url, casts]) => {
        return (
          <ImageEl
            key={url}
            url={url}
            onLoad={e => onImageCastLoad([e.currentTarget, casts])}
            onError={e => onImageCastError([e.currentTarget, casts])}
          />
        )
      })}
    </React.Fragment>
  )
}

export default Images
