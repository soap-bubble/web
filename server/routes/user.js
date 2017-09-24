import uuid from 'uuid';
import passport from 'passport';

export default function userRoute(app) {
  app.get('/usersTest', (req, res) => {
    res.status(200).send(`ok ${req.user && req.user.displayName}`);
  });

  app.post('/user/save', passport.authenticate(), (req, res) => {
    if (req.user && Array.isArray(req.body)) {
      const gamestates = req.body;
      req.user.settings.saves = req.user.settings.saves || [];
      req.user.settings.saves.push({
        timestamp: Date.now(),
        gamestates,
        id: uuid(),
      })
    }
    return res.status(403).send('not logged in');
  });

  app.get('/user/save/:id', passport.authenticate(), (req,res) => {
    const gamestate = req.user.settings.saves.find(save => save.id === req.params.id);
    if (gamestate) {
      return res.status(200).send(gamestate);
    }
    return res.status(404).send({
      message: 'Not found',
    });
  });
}
