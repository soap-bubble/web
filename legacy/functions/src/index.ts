import { credential, initializeApp } from "firebase-admin";
import { config, https } from "firebase-functions";
import fetchScene from "./scene";
import fetchGamestates from "./gamestates";
import logger from "./logger";

if (process.env.NODE_ENV === "development") {
  const serviceAccount = require("../../serviceAccount.json");
  initializeApp({
    credential: credential.cert(serviceAccount),
    databaseURL: "https://soapbubble-dev.firebaseio.com",
  });
} else {
  initializeApp(config().firebase);
}

export const scene = https.onRequest(async (req, res) => {
  try {
    const sceneId = Number(req.query.id);
    if (sceneId) {
      const scene = await fetchScene(sceneId);
      if (scene) {
        res.status(200).send(scene);
        return;
      }
      res.status(404).send("NOT FOUND");
      return;
    }
    res.status(400).send("ERROR");
    return;
  } catch (error) {
    logger.error(`Scene error`, error);
    res.status(500).send("ERROR");
    return;
  }
});

export const gamestates = https.onRequest(async (req, res) => {
  try {
    const gamestates = await fetchGamestates();
    if (gamestates) {
      res.status(200).send(gamestates);
      return;
    }
    res.status(404).send("NOT FOUND");
    return;
  } catch (error) {
    logger.error("Gamestate error", error);
    res.status(500).send("ERROR");
    return;
  }
});
