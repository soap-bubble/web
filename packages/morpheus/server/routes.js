import _ from 'lodash';
import bunyan from 'bunyan';
import express from 'express';
import https from 'https';

import { getModel } from './db';

const logger = bunyan.createLogger({ name: 'webgl-pano-server' });
const router = express.Router();

if (process.env.NODE_ENV !== 'production') {
  router.get('/scenes', (req, res) => {
    getModel('Scene').find().exec().then((scenes) => {
      const castsToLoad = scenes.reduce(
        (memo, scene) => memo.concat(
          scene.casts.filter(c => c.ref).map(c => c.ref.castId),
        ),
        [],
      );
      getModel('Cast').find({ castId: { $in: castsToLoad } }).exec().then((casts) => {
        scenes.forEach((scene) => {
          scene.casts = scene.casts.map((c) => {
            if (c.ref) {
              return casts.find(c1 => c1.castId === c.ref.castId);
            }
            return c;
          });
        });
        res.json(scenes);
      });
    }, (err) => {
      res.status(500).send(err);
    });
  });
}


router
  .get('/gamestate', (req, res) => {
    getModel('GameState').find().exec().then((gamestates) => {
      res.json(gamestates);
    }, (err) => {
      res.status(500).send(err);
    });
  })
  .get('/scene/:sceneId', (req, res) => {
    const sceneId = Number(req.params.sceneId);
    logger.info(`/scene/${sceneId}`);
    getModel('Scene').findOne({ sceneId }).exec().then((scene) => {
      if (scene) {
        const castsToLoad = scene.casts.filter(c => c.ref).map(c => c.ref.castId);
        if (castsToLoad.length) {
          getModel('Cast').find({ castId: { $in: castsToLoad } }).exec().then((casts) => {
            scene.casts = scene.casts.map((c) => {
              if (c.ref) {
                return casts.find(c1 => c1.castId === c.ref.castId);
              }
              return c;
            });
            res.json(scene);
          }, (err) => {
            res.status(500).send(err);
          });
        } else {
          res.json(scene);
        }
      } else {
        logger.error('not found', { sceneId });
        res.status(404).send('Not found');
      }
    }, (err) => {
      logger.error({ req: `/scene/${sceneId}`, error: err });
      res.status(500).send(err);
    });
  })
  .get('/cast/:castId', (req, res) => {
    const castId = Number(req.params.castId);
    logger.info({ req: `/cast/${castId}` });
    getModel('Cast').findOne({ castId }).exec().then((cast) => {
      if (cast) {
        res.json(cast);
      } else {
        logger.error(`${castId} not found`);
        res.status(404).send('Not found');
      }
    }, (err) => {
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
