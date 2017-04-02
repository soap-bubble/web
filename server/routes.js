import _ from 'lodash';
import bunyan from 'bunyan';
import express from 'express';
import { getModel } from './db';
import https from 'https';

const logger = bunyan.createLogger({name: 'webgl-pano-server'});
const router = express.Router();

router
  .get('/scenes', function (req, res) {
    getModel('Scene').find().exec().then((scenes) => {
      res.json(scenes);
    }, err => {
      res.status(500).send(err);
    });
  })
  .get('/scene/:sceneId', (req, res) => {
    const sceneId = Number(req.params.sceneId);
    logger.info({ req: `/scene/${sceneId}` });
    getModel('Scene').findOne({ sceneId }).exec().then(scene => {
      logger.info({ req: `/scene/${sceneId}`, scene })
      if (!scene) {
        console.error(`${sceneId} not found`);
        return res.status(404).send('Not found');
      }
      const castsToLoad = scene.casts.filter(c => c.ref).map(c => c.ref.castId);
      logger.info({ req: `/scene/${sceneId}`, castsToLoad });
      if (castsToLoad.length) {
        getModel('Cast').find({ castId: { $in: castsToLoad } }).exec().then(casts => {
          logger.info({ req: `/scene/${sceneId}`, casts: casts });
          scene.casts = scene.casts.filter(c => !c.ref).concat(casts);
          res.json(scene);
        }, err => {
          res.status(500).send(err);
        });
      } else {
        res.json(scene);
      }
    }, err => {
      logger.error({ req: `/scene/${sceneId}`, error: err });
      res.status(500).send(err);
    });
  })
  .get('/cast/:castId', (req, res) => {
    const castId = Number(req.params.castId);
    logger.info({ req: `/cast/${castId}` });
    getModel('Cast').findOne({ castId }).exec().then(cast => {
      logger.info({ req: `/cast/${castId}`, cast })
      if (!cast) {
        console.error(`${castId} not found`);
        return res.status(404).send('Not found');
      }
      res.json(cast);
    }, err => {
      logger.error({ req: `/cast/${castId}`, error: err });
      res.status(500).send(err);
    });
  })
  .get('/brokeniOSProxy/*', (req, res) => {
    logger.info('Requesting proxied request to AWS for content', {
      params: req.params,
      headers: req.headers,
    });
    req.pipe(https.request({
      protocol: 'https:',
      hostname: 's3-us-west-2.amazonaws.com',
      path: `/soapbubble-morpheus-dev/${req.params[0]}`,
      method: 'GET',
      headers: _.omit(req.headers, 'host', 'referer'),
    }, (proxyResponse) => {
      logger.info('Received reponse from endpoint and sending back to client', {
        headers: proxyResponse.headers,
      });
      res.set(proxyResponse.headers);
      proxyResponse.pipe(res);
    }));
  });

export default router;
