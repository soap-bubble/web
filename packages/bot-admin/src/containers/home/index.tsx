import React from 'react'
import { NextPage } from 'next'
import Head from 'next/head'
import Content from './Content'

const Page: NextPage = () => {
  return (
    <>
      <Head>
        <title>Resume</title>
        <meta name="title" content="Home" />
        <meta name="description" content="The Resume of John Dean" />
      </Head>
      <Content />
    </>
  )
}

export default Page
