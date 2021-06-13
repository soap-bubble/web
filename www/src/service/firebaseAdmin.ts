import firebaseAdmin from 'firebase-admin';

if (!firebaseAdmin.apps.length) {
  firebaseAdmin.initializeApp({
    databaseURL: 'https://soapbubble.firebaseio.com',
  });
}

export { firebaseAdmin };
