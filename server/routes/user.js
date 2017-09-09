export default function userRoute(app) {
  app.get('/usersTest', (req, res) => {
    res.status(200).send(`ok ${req.user && req.user.displayName}`);
  });
}
