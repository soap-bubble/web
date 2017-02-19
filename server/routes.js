import _ from 'lodash';
import bunyan from 'bunyan';
import express from 'express';
import morpheus from './models/morpheus';
import https from 'https';

const logger = bunyan.createLogger({name: 'webgl-pano-server'});
const router = express.Router();

router
  .get('/scenes', function (req, res) {
    morpheus.get('Scene').find().exec().then((scenes) => {
      res.json(scenes);
    }, err => {
      res.send(500, err);
    });
  })
  .get('/scene/:sceneId', (req, res) => {
    const sceneId = Number(req.params.sceneId);
    logger.info({ req: `/scene/${sceneId}` });
    morpheus.get('Scene').findOne({ sceneId }).exec().then(scene => {
      logger.info({ req: `/scene/${sceneId}`, scene })
      const castsToLoad = scene.casts.filter(c => c.ref).map(c => c.ref.castId);
      logger.info({ req: `/scene/${sceneId}`, castsToLoad });
      if (castsToLoad.length) {
        morpheus.get('Cast').find({ castId: { $in: castsToLoad } }).exec().then(casts => {
          logger.info({ req: `/scene/${sceneId}`, casts: casts });
          scene.casts = scene.casts.filter(c => !c.ref).concat(casts);
          res.json(scene);
        }, err => {
          res.send(500).send(err);
        });
      } else {
        res.json(scene);
      }
    }, err => {
      logger.error({ req: `/scene/${sceneId}`, error: err });
      res.send(500).send(err);
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
