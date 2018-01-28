import bunyan from 'bunyan';
import fs from 'fs';
import Promise from 'bluebird';

import { get as getModel } from './install';

const logger = bunyan.createLogger({ name: 'primeDb' });
Promise.promisifyAll(fs);

export default function update() {
  return getModel('Cast').find({
    fileName: { $regex: /(.*\/deck1\/.*)/ },
  }).exec()
    .map((cast) => {
      logger.info('Patching deck1 to Deck1', { fileName: cast.fileName });
      cast.fileName = cast.fileName.replace('deck1', 'Deck1');
      return cast.save();
    })
    .then(() => getModel('Cast').find({
      fileName: { $regex: /(.*\/harem\/.*)/ },
    }).exec()
      .map((cast) => {
        logger.info('Patching harem to Harem', { fileName: cast.fileName });
        cast.fileName = cast.fileName.replace('harem', 'Harem');
        return cast.save();
      }))
    .then(() => getModel('Cast').find({
      fileName: { $regex: /(.*\/cargoH\/.*)/ },
    }).exec()
      .map((cast) => {
        logger.info('Patching cargoH to CargoH', { fileName: cast.fileName });
        cast.fileName = cast.fileName.replace('cargoH', 'CargoH');
        return cast.save();
      }));
}
