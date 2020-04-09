import React, { FunctionComponent } from 'react'
import { Parallax } from 'react-parallax'
import { Milestone as MilestoneType } from './types'

const Milestone: FunctionComponent<MilestoneType> = ({
  icon,
  total,
  title,
}) => (
  <div className="col-xs-6 col-sm-6 col-md-3 single">
    <div className="total-numbers" data-perc="1300">
      <div className="iconspace">
        <i className={`cicon ${icon}`}></i>
      </div>
      <span className="sum">{total}</span>
      {title}
    </div>
  </div>
)

const Milestones: FunctionComponent<{ milestones: MilestoneType[] }> = ({
  milestones,
}) => (
  <Parallax
    bgImage="../img/parallax_code.png"
    strength={300}
    className="parallax"
  >
    <div className="parallax">
      <div className="container">
        <div className="title">
          <h1>Milestones Achieved</h1>
        </div>

        <div className="row count">
          {milestones.map(milestone => (
            <Milestone
              icon={milestone.icon}
              total={milestone.total}
              title={milestone.title}
            />
          ))}
        </div>
      </div>
    </div>
  </Parallax>
)

export default Milestones
