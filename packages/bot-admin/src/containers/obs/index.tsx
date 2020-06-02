import React from 'react'
import { NextPage } from 'next'
import Head from 'next/head'
import Content from './Content'

const Page: NextPage = () => {
  return (
    <>
      <Head>
        <title>Overlay</title>
        <meta name="title" content="Sun" />
        <meta name="description" content="" />
      </Head>
      <Content />
    </>
  )
}

export default Page
