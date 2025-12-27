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
        <meta name="description" content="" />
        <script src="/__/firebase/7.14.0/firebase-app.js"></script>
        <script src="/__/firebase/7.14.0/firebase-auth.js"></script>
        <script src="/__/firebase/init.js"></script>
      </Head>
      <Content />
    </>
  )
}

export default Page
