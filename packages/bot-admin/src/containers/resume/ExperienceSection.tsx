import React, { FunctionComponent } from 'react'
import { Experience as ExperienceType, Education } from './types'

const TimelinePost: FunctionComponent<ExperienceType> = ({
  name,
  title,
  timeFrame,
  summary,
}) => (
  <div className="timeline-post">
    <div className="timeline-post-content-holder">
      <div className="timeline-post-icon"></div>
      <div className="timeline-post-title">
        <h4>{name}</h4>
      </div>
      <div className="timeline-post-subtitle">
        <p>
          <span>{title} </span>
          <span className="timeline-duration">{timeFrame}</span>
        </p>
      </div>
      <div className="timeline-post-content">
        <p>{summary}</p>
      </div>
    </div>
  </div>
)
const Experience: FunctionComponent<{
  experiences: ExperienceType[]
  educations: Education[]
}> = ({ experiences, educations }) => {
  const leftXp = experiences
    .filter((_, index) => index % 2)
    .map(xp => (
      <TimelinePost
        name={xp.name}
        title={xp.title}
        timeFrame={xp.timeFrame}
        summary={xp.summary}
      />
    ))
  const rightXp = experiences
    .filter((_, index) => !(index % 2))
    .map(xp => (
      <TimelinePost
        name={xp.name}
        title={xp.title}
        timeFrame={xp.timeFrame}
        summary={xp.summary}
      />
    ))

  const leftEdu = educations
    .filter((_, index) => index % 2)
    .map(edu => (
      <TimelinePost
        name={edu.name}
        title={edu.diploma}
        timeFrame={edu.timeFrame}
        summary={edu.summary}
      />
    ))
  const rightEdu = educations
    .filter((_, index) => !(index % 2))
    .map(edu => (
      <TimelinePost
        name={edu.name}
        title={edu.diploma}
        timeFrame={edu.timeFrame}
        summary={edu.summary}
      />
    ))

  return (
    <section id="resume" className="section">
      <div className="container">
        <div className="section-title">
          <h2>My resume</h2>
          <span className="border"></span>
        </div>

        <div className="row">
          <div className="col-md-12">
            <div className="timeline">
              <div className="timeline-category exp-category">
                <a className="large bt-timeline">Experience</a>
                <div className="timeline-category-icon">
                  <div className="iconspace">
                    <i className="fa-folder-open"></i>
                  </div>
                </div>
              </div>
              <div className="col-md-6 timeline-post-left">{leftXp}</div>
              <div className="col-md-6 timeline-post-right">{rightXp}</div>

              <div className="timeline-category edu-cagegory">
                <a className="large bt-timeline">Education</a>
                <div className="timeline-category-icon">
                  <div className="iconspace">
                    <i className="fa-book"></i>
                  </div>
                </div>
              </div>
              <div className="col-md-6 timeline-post-left">{leftEdu}</div>
              <div className="col-md-6 timeline-post-right">{rightEdu}</div>

              <div className="timeline-end-icon">
                <span>
                  {' '}
                  <i className="fa-bookmark"></i>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
export default Experience
