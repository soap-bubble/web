import React, { FunctionComponent } from 'react'
import BioSection from './BioSection'
import ExperienceSection from './ExperienceSection'
import MilestoneSection from './MilestoneSection'
import SkillSection from './SkillSection'
import ServiceSection from './ServiceSection'
import data from './data'

const Content: FunctionComponent = () => {
  return (
    <>
      <BioSection
        bio={data.bio}
        contacts={data.contacts}
        interests={data.interests}
      />
      <ExperienceSection
        experiences={data.experiences}
        educations={data.educations}
      />
      <MilestoneSection milestones={data.milestones} />
      <ServiceSection services={data.services} />
      <SkillSection skills={data.skills} />
    </>
  )
}

export default Content
