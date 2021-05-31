if (typeof firebase === 'undefined') throw new Error('hosting/init-error: Firebase SDK not detected. You must include it before /__/firebase/init.js');
firebase.initializeApp({
  "projectId": "soapbubble-dev",
  "appId": "1:415743162107:web:f760a34397828440bde25e",
  "databaseURL": "https://soapbubble-dev.firebaseio.com",
  "storageBucket": "soapbubble-dev.appspot.com",
  "locationId": "us-central",
  "apiKey": "AIzaSyDJctVbVAYjgzoeZ14xb-ZU73AMKsn_yWU",
  "authDomain": "soapbubble-dev.firebaseapp.com",
  "messagingSenderId": "415743162107"
});
