import path from 'path';
import fs from 'fs';
import mkdirp from 'mkdirp';
import request from 'request';
import { promisify } from 'util';
const openFileAsync = promisify(fs.open);
const mkdirpAsync = promisify(mkdirp);

async function openFile({ path }) {
  let fd;
  try {
    fd = await openFileAsync(path.toString(), 'r');
  } catch (e) {
    // File does not exist
    return false;
  }
  return fd;
}

export default async function ({
  localFilePath,
  url,
}) {
  try {
    let outputStream;
    // get file handle
    const fd = await openFile({
      path: localFilePath,
    });
    // If file exists
    if (fd) {
      // Use file as stream source
      outputStream = fs.createReadStream('', {
        fd,
      });
    } else {
      console.log(`cache for ${url} does not exist, so creating it`);
      // Network request
      const response = request(url);
      // Create directory if needed
      await mkdirpAsync(path.dirname(localFilePath));
      // pipe to file
      response.pipe(fs.createWriteStream(localFilePath));
      // Use network as stream source
      outputStream = response;
    }
    return outputStream;
  } catch (fileCacheErr) {
    console.error('File cache error', fileCacheErr);
  }
  return null;
}
