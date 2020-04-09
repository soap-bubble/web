import React, { FunctionComponent } from 'react'
import classnames from 'classnames'
import CircularGuage from './CircularGuage'
import { Skill } from './types'

const Experience: FunctionComponent<{
  skills: Skill[]
}> = ({ skills }) => (
  <section id="skills" className="section">
    <div className="container">
      <div className="section-title">
        <h2>Skill</h2>
        <span className="border"></span>
      </div>

      <div className="row">
        {skills.map((skill, index) => (
          <>
            <div className="col-xs-12 col-sm-6 col-md-3 chart-padding">
              <CircularGuage key={'gauge.' + index} percentage={skill.amount} />
              <div className="skills-content">
                <h3>{skill.title}</h3>
                <p>{skill.summary}</p>
              </div>
            </div>
            <div
              className={classnames(
                'clearfix',
                'visible-xs-block',
                index % 4 === 3 ? 'visible-lg-block visible-md-block' : null,
                index % 2 === 1 ? 'visible-sm-block' : null
              )}
            ></div>
          </>
        ))}
      </div>
    </div>
  </section>
)

export default Experience
