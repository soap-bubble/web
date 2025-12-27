import { MongoClient } from "mongodb";
import { omit } from "ramda";
import {
  credential,
  initializeApp,
  storage,
  ServiceAccount,
} from "firebase-admin";

import serviceAccount from "../../../serviceAccount.json";

initializeApp({
  credential: credential.cert(serviceAccount as ServiceAccount),
  storageBucket: "soapbubble.appspot.com",
});

async function doit() {
  const noId = omit(["_id", "__v"]);
  const bucket = storage().bucket();

  const client = await MongoClient.connect("mongodb://localhost", {
    useNewUrlParser: true,
  });
  const mongodb = client.db("morpheus_dev");
  const gamestatesCursor = mongodb.collection("gamestates").find();

  const gs = [];
  while (await gamestatesCursor.hasNext()) {
    const gamestateAttr = await gamestatesCursor.next();
    const data = JSON.parse(JSON.stringify(noId(gamestateAttr)));
    gs.push(data);
  }
  await bucket.file("gamestates").save(JSON.stringify(gs), {
    gzip: true,
    metadata: {
      cacheControl: "public, max-age=31536000",
    },
  });
}

doit().then(
  () => console.log("success"),
  (err) => console.error(err)
);
