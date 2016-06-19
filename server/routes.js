import express from 'express';
import _ from 'lodash';
import morpheus from './models/morpheus';

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
    morpheus.get('Scene').findOne({ sceneId }).exec().then(scene => {
      const castsToLoad = scene.casts.filter(c => c.ref).map(c => c.ref.castId);
      if (castsToLoad.length) {
        morpheus.get('Cast').find({ castId: { $in: castsToLoad }}).exec().then(casts => {
          scene.casts = scene.casts.filter(c => !c.ref).concat(casts);
          res.json(scene);
        }, err => {
          res.send(500).send(err);
        });
      } else {
        res.json(scene);
      }
    }, err => {
      res.send(500).send(err);
    });
  });

export default router;