export type IPage = {}

export interface Bio  {
  name: string
  primary: string
  tagline: string
}

export interface Contact {
  method: string
  address: string
}

export interface Interest {
  icon: string
  title: string
}

export interface Reference {
  name: string
  address: string
  icon: string
}

export interface Experience {
  title: string
  name: string
  timeFrame: string
  summary: string
}

export interface Service {
  icon: string
  title: string
  summary: string
}

export interface Milestone {
  icon: string
  total: string
  title: string
}

export interface Education {
  diploma: string
  name: string
  timeFrame: string
  summary: string
}

export interface Skill {
  amount: number
  title: string
  summary: string
}

export interface IResume {
  bio: Bio
  contacts: Contact[]
  interests: Interest[]
  references: Reference[]
  experiences: Experience[]
  services: Service[]
  milestones: Milestone[]
  educations: Education[]
  skills: Skill[]
}