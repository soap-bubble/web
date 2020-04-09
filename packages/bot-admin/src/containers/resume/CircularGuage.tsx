import React, { FunctionComponent } from 'react'
// import ReactCountdownClock from 'react-countdown-clock'

const CircularGuage: FunctionComponent<{
  percentage: number
}> = ({ percentage }) => (
  <div className="chart">
    {/* <ReactCountdownClock 
					transitionMs={2000}
					targetPercentage={percentage}
					color="#000"
					alpha={0.9}
					size={170}
					animated={true}
				/> */}
  </div>
)

export default CircularGuage
