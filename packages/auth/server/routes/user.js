import uuid from 'uuid';
import passport from 'passport';

export default function userRoute(baseRoute, createLogger, db, permissions) {
  const logger = createLogger('routes:user');

  baseRoute.get(
    '/GetAllUsers',
    passport.authenticate('google-login-token'),
    (req, res) => {
      if (!permissions.isGranted('GetAllUsers', req.user)) {
        logger.info('Access not granted', {
          route: '/GetAllUsers',
        });
        return res.status(401).send({
          error: 'Not Authorized',
        });
      }
      logger.info('GetAllUsers');
      return db.model('User').find().exec()
        .then((users) => {
          res.status(200).send(users);
        })
        .catch((err) => {
          const payload = {
            message: 'Failed to load users',
          };
          if (process.NODE_ENV !== 'production') {
            payload.error = err;
          }
          res.status(500).send(payload);
        });
    },
  );

  baseRoute.get('/usersTest', (req, res) => {
    logger.info('/usersTest');
    res.status(200).send(`ok ${req.user && req.user.displayName}`);
  });

  baseRoute.post('/user/save', passport.authenticate(), (req, res) => {
    logger.info({
      route: '/user/save',
      method: 'POST',
    });
    if (req.user && Array.isArray(req.body)) {
      const gamestates = req.body;
      req.user.settings.saves = req.user.settings.saves || [];
      req.user.settings.saves.push({
        timestamp: Date.now(),
        gamestates,
        id: uuid(),
      });
      logger.info('success');
      return res.status(200).send('OK');
    }
    logger.info('success');
    return res.status(403).send('not logged in');
  });

  baseRoute.get('/user/save/:id', passport.authenticate('google-login-token'), (req, res) => {
    const gamestate = req.user.settings.saves.find(save => save.id === req.params.id);
    if (gamestate) {
      return res.status(200).send(gamestate);
    }
    return res.status(404).send({
      message: 'Not found',
    });
  });

  baseRoute.get('/user/saves', passport.authenticate('google-login-token'), (req, res) => {
    const saves = req.user.settings.saves.map(({ id, timestamp }) => ({
      id,
      timestamp,
    }));
    if (saves) {
      return res.status(200).send(saves);
    }
    return res.status(404).send({
      message: 'Not found',
    });
  });

  baseRoute.put('/user/:userId/roles', passport.authenticate('google-login-token'), async (req, res) => {
    if (!permissions.isGranted('add role', req.user)) {
      logger.info('Access not granted', {
        route: '/user/role',
      });
      return res.status(401).send({
        error: 'Not Authorized',
      });
    }
    const {
      userId,
    } = req.params;
    const roles = req.body;
    try {
      const user = await db.model('User').find({ id: userId }).exec();
      if (user) {
        user.roles = user.roles || [];
        user.roles = user.roles.filter(r => roles.includes(r)).concat(roles);
        await user.save().exec();
        res.status(200).send(user);
      } else {
        res.status(404).send({ message: 'User not found '});
      }
    } catch (e) {
      const error = { message: 'Unable to assign role to user' };
      if (process.env.NODE_ENV !== 'production') {
        res.status(500).send({ ...error, error: e });
      } else {
        res.status(500).send(error);
      }
    }
  });

  baseRoute.post('/user/:userId/roles', passport.authenticate('google-login-token'), async (req, res) => {
    if (!permissions.isGranted('add role', req.user)) {
      logger.info('Access not granted', {
        route: '/user/role',
      });
      return res.status(401).send({
        error: 'Not Authorized',
      });
    }
    const {
      userId,
    } = req.params;
    const roles = req.body;
    try {
      const user = await db.model('User').find({ id: userId }).exec();
      if (user) {
        user.roles = roles;
        await user.save().exec();
        res.status(200).send(user);
      } else {
        res.status(404).send({ message: 'User not found '});
      }
    } catch (e) {
      const error = { message: 'Unable to assign role to user' };
      if (process.env.NODE_ENV !== 'production') {
        res.status(500).send({ ...error, error: e });
      } else {
        res.status(500).send(error);
      }
    }
  });

  baseRoute.delete('/user/:userId/roles', passport.authenticate('google-login-token'), async (req, res) => {
    if (!permissions.isGranted('add role', req.user)) {
      logger.info('Access not granted', {
        route: '/user/role',
      });
      return res.status(401).send({
        error: 'Not Authorized',
      });
    }
    const {
      userId,
    } = req.params;
    const roles = req.body;
    try {
      const user = await db.model('User').find({ id: userId }).exec();
      if (user) {
        user.roles = user.roles || [];
        user.roles = user.roles.filter(r => roles.includes(r));
        await user.save().exec();
        res.status(200).send(user);
      } else {
        res.status(404).send({ message: 'User not found '});
      }
    } catch (e) {
      const error = { message: 'Unable to delete role' };
      if (process.env.NODE_ENV !== 'production') {
        res.status(500).send({ ...error, error: e });
      } else {
        res.status(500).send(error);
      }
    }
  });

  baseRoute.get('/user/roles', passport.authenticate('google-login-token'), async (req, res) => {
    if (!permissions.isGranted('add role', req.user)) {
      logger.info('Access not granted', {
        route: '/user/role',
      });
      return res.status(401).send({
        error: 'Not Authorized',
      });
    }
    if (req.user) {
      return res.status(200).send(user.roles);
    }
    const error = { message: 'Unable to read roles' };
    return res.status(500).send(error)
  });
}
