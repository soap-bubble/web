import React, {
  useCallback,
  useRef,
  useEffect,
  useMemo,
  SyntheticEvent,
} from 'react'
import { getAssetUrl } from 'service/gamedb'
import { MovieCast } from '../types'

interface ImageElProps {
  fileName: string
  onLoad: (e: SyntheticEvent<HTMLImageElement>) => void
  onError: (e: SyntheticEvent<HTMLImageElement>) => void
}

const ImageEl = ({ fileName, onLoad, onError }: ImageElProps) => {
  return (
    <img
      src={getAssetUrl(fileName, 'png')}
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
          const { fileName } = curr
          const ref = (memo[fileName] = memo[fileName] || [])
          ref.push(curr)
          return memo
        },
        {} as MovieCastCollectionMap,
      ),
    [movieSpecialCasts],
  )
  return (
    <React.Fragment>
      {Object.entries(aggregatedImageRefs).map(([fileName, casts]) => {
        return (
          <ImageEl
            key={fileName}
            fileName={fileName}
            onLoad={e => onImageCastLoad([e.currentTarget, casts])}
            onError={e => onImageCastError([e.currentTarget, casts])}
          />
        )
      })}
    </React.Fragment>
  )
}

export default Images
