import {
  Storage,
  SaveOptions,
  CreateWriteStreamOptions,
} from '@google-cloud/storage'
import { ThenArg } from './utils'

const func = async function(bucketName: string, googleServiceKey: any) {
  const storage = new Storage(googleServiceKey)

  const bucket = storage.bucket(bucketName)
  return {
    uploadStream(
      filename: string,
      stream: any,
      options?: CreateWriteStreamOptions
    ) {
      return new Promise((resolve, reject) => {
        const file = bucket.file(filename)
        stream
          .pipe(file.createWriteStream(options))
          .on('error', reject)
          .on('finish', resolve)
      })
    },
    async upload(filename: string, data: string, options?: SaveOptions) {
      const file = bucket.file(filename)
      await file.save(data, options)
    },
    async download(filename: string) {
      const [file] = await bucket.file(filename).get()
      const [contents] = await file.download()
      return contents.toString('utf8')
    },
  }
}

export default func
export type GoogleStorage = ThenArg<ReturnType<typeof func>>
