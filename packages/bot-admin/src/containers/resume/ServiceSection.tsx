import React, { FunctionComponent } from 'react'
import { Service } from './types'

const Item: FunctionComponent<{
  icon: string
  title: string
  summary: string
}> = ({ icon, title, summary }) => (
  <div className="service-box">
    <span className={`service-icon ${icon}`}></span>
    <div className="service-content">
      <h3>{title}</h3>
      <p>{summary}</p>
    </div>
  </div>
)

const Services: FunctionComponent<{ services: Service[] }> = ({ services }) => {
  const leftColumn = services
    .filter((_, index) => index % 2)
    .map(service => (
      <Item
        icon={service.icon}
        title={service.title}
        summary={service.summary}
      />
    ))
  const rightColumn = services
    .filter((_, index) => !(index % 2))
    .map(service => (
      <Item
        icon={service.icon}
        title={service.title}
        summary={service.summary}
      />
    ))

  return (
    <section id="service" className="section">
      <div className="container">
        <div className="section-title">
          <h2>My Services</h2>
          <span className="border"></span>
        </div>

        <div className="row">
          <div className="col-md-6 left-service">{leftColumn}</div>

          <div className="col-md-6 right-service">{rightColumn}</div>
        </div>
      </div>
    </section>
  )
}

export default Services
