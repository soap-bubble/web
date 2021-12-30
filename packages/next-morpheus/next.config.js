const { NODE_ENV } = process.env;

const prod = NODE_ENV === "production";

const env = prod ? {
  ASSET_HOST: "",
  FIREBASE_API_KEY: "AIzaSyBqBCDGshTp3uKhVOSvwUkvEeX3Ui8xdsU",
  FIREBASE_AUTH_DOMAIN: "soapbubble.firebaseapp.com",
  FIREBASE_DATABASE_URL: "https://soapbubble.firebaseio.com",
  FIREBASE_PROJECT_ID: "soapbubble",
  FIREBASE_STORAGE_BUCKET: "soapbubble.appspot.com",
  FIREBASE_MESSAGING_SENDER_ID: "342061559353",
  FIREBASE_APP_ID: "1:342061559353:web:fffc5c9458f484d3a267e8",
} : {
  ASSET_HOST: ""
}

module.exports = {
  env,
};
