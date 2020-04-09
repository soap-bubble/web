import React, { FunctionComponent } from 'react'
import { Bio, Contact, Interest } from './types'
const BioSection: FunctionComponent<{
  bio: Bio
  contacts: Contact[]
  interests: Interest[]
}> = ({ bio, contacts, interests }) => (
  <section id="bio" className="section about">
    <div className="container">
      <div className="section-title">
        <h2>About Me</h2>
        <span className="border" />
        <p>
          <span>{bio.primary}</span>
        </p>
        <p>{bio.tagline}</p>
      </div>
      <div className="row">
        <div className="col-md-4">
          <img src="img/avatar.jpg" alt="avatar" className="img-responsive" />
        </div>

        <div className="col-md-4">
          <div className="about-info">
            <div className="info-title">
              Name
              {contacts.map(({ method }) => (
                <p>{method}</p>
              ))}
            </div>
            <div className="info-details">
              {bio.name}
              {contacts.map(({ address }) => (
                <p>{address}</p>
              ))}
            </div>
            {/*
                <p className="about-signature">{bio.name}</p>
                <a href="#" className="mt-button large btn"><i className="fa-download"></i><span>Download Resume</span></a>
                */}
          </div>
        </div>
        <div className="col-md-4">
          <div className="about-extra">
            <h4>HOBBIES &amp; INTERESTS</h4>
            <div className="about-extra-icon-style2">
              <ul>
                {interests.map(interest => (
                  <li>
                    <p>
                      <i className={interest.icon}></i>
                      <br />
                      <span>{interest.title}</span>
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
)

export default BioSection
