import React, { useEffect } from 'react'
import firebase from 'firebase'
import { NextPage } from 'next'
import Head from 'next/head'
import { useRouter } from 'next/router'

const Page: NextPage = () => {
  const { replace, query } = useRouter()
  useEffect(() => {
    if (query && query.token) {
      localStorage.setItem('token', query.token as string)
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
        <meta name="title" content="enter" />
        <meta name="description" content="" />
        <script src="/__/firebase/7.14.0/firebase-app.js"></script>
        <script src="/__/firebase/7.14.0/firebase-auth.js"></script>
        <script src="/__/firebase/init.js"></script>
      </Head>
    </>
  )
}

export default Page
