import React from 'react'
import { NextPage } from 'next'
import { IPage } from './types'
import Head from './Head'
import Content from './Content'

const Page: NextPage<IPage> = () => {
  return (
    <>
      <Head>
        <title>Profile</title>
        <meta name="title" content="Sun" />
        <meta name="description" content="" />
      </Head>
      <Content />
    </>
  )
}

export default Page
