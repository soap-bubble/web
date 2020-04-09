import React from 'react'
import { NextPage } from 'next'
import { IPage } from './types'
import Head from 'next/head'
import Content from './Content'

const Page: NextPage<IPage> = () => {
  return (
    <>
      <Head>
        <title>Resume</title>
        <meta name="title" content="Resume" />
        <meta name="description" content="The Resume of John Dean" />
      </Head>
      <Content />
    </>
  )
}

export default Page
