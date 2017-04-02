import mongoose from 'mongoose';
import bunyan from 'bunyan';
import fs from 'fs';
import Promise from 'bluebird';
import { get as getModel } from './install';
const logger = bunyan.createLogger({ name: 'primeDb' });
Promise.promisifyAll(fs);

export function v0tov1(cb) {
  return getModel('Cast').find({
    fileName: { $regex: /.*deck1.*/ }
  }).exec()
    .map(cast => {
      logger.info('Patching deck1 to Deck1', { fileName: cast.fileName });
      cast.fileName = cast.fileName.replace('deck1', 'Deck1');
      return cast.save();
    })
    .then(() => Promise.all([
      getModel('ControlledMovieCast').find({
        __v: 0,
      }).exec().map(cmc => {
        const { fileName, castId } = cmc;
        const atlasFileName = `${fileName}.atlas.png`;
        const possibleAtlasFile = `../${atlasFileName}`;
        logger.info('Checking for atlast file', { possibleAtlasFile });
        return fs.accessAsync(possibleAtlasFile)
          .then(
            () => {
              cmc.atlas = true;
              cmc.fileName = atlasFileName;
              logger.info('Found atlas file', { castId, fileName: atlasFileName });
            },
            () => {
              cmc.fileName = `${fileName}.png`;
              cmc.atlas = false
            }
          )
          .then(() => cmc.__v = 1 )
          .then(() => cmc.save());
      })
        .then(cb)
    ])
  );
}

export default function (cb) {
  v0tov1(cb);
}

// .then(controlledMovieCasts => {
//   logger.info('Updating ControlledMovieCasts', { count: controlledMovieCasts.length });
//
//   controlledMovieCasts.forEach(cmc => {
//
//   });
//   cb();
