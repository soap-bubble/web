import uuid from 'uuid';
import passport from 'passport';

export default function userRoute(app, db, createLogger) {
  const logger = createLogger('routes:saves');
  app.post('/NewSaveGame', passport.authenticate('google-login-token'), (req, res) => {
    logger.info({
      route: 'SaveGame',
      method: 'POST',
    });
    const {
      currentSceneId,
      previousSceneId,
      gamestates,
      scenestate,
    } = req.body;
    const Save = db.model('Save');
    const save = new Save({
      playerId: req.user.id,
      currentSceneId,
      previousSceneId,
      gamestates,
      scenestate,
      saveId: uuid(),
      timestamp: Date.now(),
    });
    save
      .save()
      .then(() => {
        logger.info('success');
        res.status(200).send(save.toJSON());
      })
      .catch((err) => {
        logger.info('error', { err });
        res.status(500).send('failed to save');
      });
  });

  app.post('/SaveGame', passport.authenticate('google-login-token'), (req, res) => {
    const {
      saveId,
      gamestates,
      scenestate,
      currentScene,
      previousScene,
    } = req.body;
    const Save = db.model('Save');
    Save
      .findNewest(saveId)
      .then((save) => {
        if (save) {
          const newSave = new Save({
            playerId: save.playerId,
            saveId,
            gamestates,
            scenestate,
            currentScene,
            previousScene,
            timestamp: Date.now(),
          });
          return newSave.save().then(() => {
            logger.info('Updated save');
            res.status(200).send(newSave.toJSON());
          });
        }
        logger.error('Could not find save to update');
        res.status(404).send('not found');
        return Promise.reject(new Error('No save found to update'));
      })
      .catch((err) => {
        if (!res.headersSent) {
          logger.error('Failed to update save', {
            err,
          });
          res.status(500).send('error');
        }
      });
  });

  app.get('/GetAllSaveMeta', passport.authenticate('google-login-token'), (req, res) => {
    const Save = db.model('Save');
    Save.findAllForPlayer(req.user.id)
      .then((saves) => {
        if (saves) {
          logger.info('Loaded saves', {
            playerId: req.user.id,
            count: saves.length,
          });
          return res.status(200).send(saves
            .map(({
              saveId,
              timestamp,
              currentScene,
            }) => ({
              saveId,
              timestamp,
              currentScene,
            })));
        }
        logger.error('Could not load saves?');
        return res.status(500).send('failed');
      })
      .catch((err) => {
        logger.error('Failed to load all saves', {
          err,
        });
        res.status(500).send('error');
      });
  });

  app.post('/GetSaveGame', passport.authenticate('google-login-token'), (req, res) => {
    const Save = db.model('Save');
    const {
      saveId,
    } = req.body;
    Save.findNewest(saveId)
      .then((save) => {
        if (save) {
          return res.status(200).send(save.toJSON());
        }
        return res.status(404).send('not found');
      })
      .catch((err) => {
        logger.error('Failed to find save', {
          err,
        });
        res.status(500).send('error');
      });
  });
}
