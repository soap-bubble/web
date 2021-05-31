import React, { FunctionComponent, MouseEvent } from 'react'
import styled from 'styled-components'
const DOMAIN = 'http://localhost:3080'

const Bot: FunctionComponent<{
  id: string
}> = ({ id }) => {
  return (
    <Text>
      <Location>{`${DOMAIN}/obs/${id}`}</Location>
      <Copy>Copy</Copy>
    </Text>
  )
}

const Text = styled.div`
  border: 3px solid black;
  padding: 4px;
  display: flex;
  justify-content: space-between;
`

const Location = styled.span`
  color: black;
  margin-left: 10px;
`

const Copy = styled.span`
  color: blue;
  margin-left: 20px;
`

export default Bot
