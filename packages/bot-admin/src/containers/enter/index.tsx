import React, { useEffect } from 'react'
import { NextPage } from 'next'
import Head from 'next/head'
import { useRouter } from 'next/router'

const Page: NextPage = () => {
  const { replace, query } = useRouter()
  useEffect(() => {
    if (query && query.token) {
      // @ts-ignore
      firebase
        .auth()
        .signInWithCustomToken(query.token as string)
        .then(response => {
          if (response.user) {
            if (query.r) {
              replace(query.r as string)
            } else {
              replace('/')
            }
          }
        })
    }
  }, [query])
  return (
    <>
      <Head>
        <title>Resume</title>
        <meta name="title" content="Resume" />
        <meta name="description" content="The Resume of John Dean" />
        <script src="/__/firebase/7.14.0/firebase-app.js"></script>
        <script src="/__/firebase/7.14.0/firebase-auth.js"></script>
        <script src="/__/firebase/init.js"></script>
      </Head>
    </>
  )
}

export default Page
