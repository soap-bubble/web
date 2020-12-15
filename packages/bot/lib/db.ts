import { Firestore } from '@google-cloud/firestore'
import googleServiceKey from './googleServiceKey'

export async function ref<T extends FirebaseFirestore.DocumentData>(
  path: string,
  notifier?: (snapshot: FirebaseFirestore.DocumentSnapshot<T>) => void,
  // Return true if we should notify
  discriminator?: (snapshot: FirebaseFirestore.DocumentSnapshot<T>) => boolean
) {
  const db = new Firestore(googleServiceKey)
  const docRef = db.doc(path)
  const docSnap = await docRef.get()
  const ret = docSnap.data() as T
  const self = { current: ret }
  onChange<T>(path, snapshot => {
    const data = snapshot.data()
    if (data) {
      self.current = data
      // If notifier exists, optionally calling discriminator to see if we notify
      if (notifier && (!discriminator || discriminator(snapshot))) {
        notifier(snapshot)
      }
    }
  })
  return self
}

export async function provide<T extends FirebaseFirestore.DocumentData>(
  path: string
) {
  const db = new Firestore(googleServiceKey)
  const docRef = db.doc(path)
  const docSnap = await docRef.get()
  const ret = docSnap.data()
  return ret as T | undefined
}

export function onChange<T extends FirebaseFirestore.DocumentData>(
  path: string,
  callback: (snapshot: FirebaseFirestore.DocumentSnapshot<T>) => void
) {
  const db = new Firestore(googleServiceKey)
  const docRef = db.doc(path)
  docRef.onSnapshot(
    callback as (
      snapshot: FirebaseFirestore.DocumentSnapshot<
        FirebaseFirestore.DocumentData
      >
    ) => void
  )
}

export async function save<T extends FirebaseFirestore.DocumentData>(
  path: string,
  data: T,
  options?: FirebaseFirestore.SetOptions
) {
  const db = new Firestore(googleServiceKey)
  const docRef = db.doc(path)
  await docRef.set(
    {
      ...data,
    },
    {
      merge: true,
      ...options,
    }
  )
}

export async function remove(path: string) {
  const db = new Firestore(googleServiceKey)
  const docRef = db.doc(path)
  await docRef.delete()
}
