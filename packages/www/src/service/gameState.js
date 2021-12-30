import axios from 'axios';
import { firebaseClient, isFirebaseLoaded } from './firebase';
import morpheusMap from './morpheusMap';

export async function fetchInitial() {
  if (isFirebaseLoaded) {
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
  return morpheusMap.filter(m => m.type === 'GameState').map(g => g.data)
}

export function lint() { }
