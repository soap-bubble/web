import {
  app,
  protocol,
} from 'electron';
import path from 'path';
import fileCache from './fileCache';
const MORPHEUS_API_HOST = 'https://soapbubble.online/morpheus/api';

export default function () {

  protocol.registerStreamProtocol('morpheus', async (req, callback) => {
    try {
      const endOfService = req.url.indexOf('/', 11);
      const service = req.url.substring(11, endOfService);
      const endpoint = req.url.substr(endOfService + 1);

      if (service === 'api') {
        const cachedLocation = path.resolve(app.getPath('userData'), '.cache', service, endpoint);
        const url = `${MORPHEUS_API_HOST}/${endpoint}`;
        const outputStream = await fileCache({
          localFilePath: cachedLocation,
          tutorial,
        });
        if (outputStream) {
          return callback({
            statusCode: 200,
            headers: {
              'content-type': 'application/json'
            },
            data: outputStream,
          });
        }
        return callback({
          statusCode: 500,
        });
      }
    } catch (protocolErr) {
      console.error('Protocol response error', protocolErr);
      callback({
        statusCode: 500,
      });
    }
  }, (error) => {
    if (error) console.error('Failed to register protocol')
  });
}
