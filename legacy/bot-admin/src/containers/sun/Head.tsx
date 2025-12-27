import React from 'react'
import Head from 'next/head'

const CoreHead: React.FC = ({ children }) => {
  return (
    <Head>
      {children}
    </Head>
  )
}

export default CoreHead
