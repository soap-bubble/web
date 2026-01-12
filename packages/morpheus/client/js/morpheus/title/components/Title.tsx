import { useCallback } from 'react'
import cn from 'classnames'
import { useSelector, useDispatch } from 'react-redux'
import type { AppDispatch } from 'store/types'
import { titleDimensions, titleStyle } from '../selectors'
import { canvasCreated } from '../actions'

interface TitleProps {
  opacity: number
}

function Title({ opacity }: TitleProps) {
  const dispatch = useDispatch<AppDispatch>()
  const style = useSelector(titleStyle)
  const { width, height } = useSelector(titleDimensions)

  const handleCanvasRef = useCallback(
    (canvas: HTMLCanvasElement | null) => {
      dispatch(canvasCreated(canvas))
    },
    [dispatch]
  )

  return (
    <canvas
      style={{
        opacity,
        ...style,
      }}
      className={cn('title')}
      width={width}
      height={height}
      ref={handleCanvasRef}
    />
  )
}

export default Title
