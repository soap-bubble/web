import axios from 'axios';
import { firebaseClient } from './firebase';

export async function fetchInitial() {
  try {
    const gsUrl = await firebaseClient
      .storage()
      .ref('gamestates')
      .getDownloadURL();
    const response = await axios.get(gsUrl);
    return response.data;
  } catch (error) {
    console.error('Failed to load gamestates', error);
    return [];
  }
}

export async function fetchInitial2() {
  try {
    const db = firebase.firestore();
    const doc = await db.collection('gamestates').get();
    return doc.docs.map((d) => d.data());
  } catch (error) {
    console.error('Failed to load gamestates', error);
    return [];
  }
}

export function lint() {}
