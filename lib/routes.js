import cors from 'cors';
import config from 'config';

export default function(app) {
  app.use(cors(config.cors));
}
