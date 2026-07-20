import { readFile, rename, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const packageRoot = resolve(fileURLToPath(new URL('..', import.meta.url)))
const defaultMapPath = resolve(
  packageRoot,
  'client/js/service/morpheus.map.json'
)
const privateBlobHostSuffix = '.private.blob.vercel-storage.com'

function validationError(message) {
  return new Error(`Morpheus map validation failed: ${message}`)
}

export function validateMorpheusMap(mapText) {
  if (mapText.trim().length === 0) {
    throw validationError('map is empty')
  }

  let map
  try {
    map = JSON.parse(mapText)
  } catch {
    throw validationError('map is not valid JSON')
  }

  if (!Array.isArray(map) || map.length === 0) {
    throw validationError('map must be a nonempty array')
  }

  if (
    !map.every(
      item =>
        item &&
        typeof item === 'object' &&
        !Array.isArray(item) &&
        typeof item.type === 'string' &&
        item.type.length > 0 &&
        item.data &&
        typeof item.data === 'object' &&
        !Array.isArray(item.data)
    )
  ) {
    throw validationError('every entry must have a nonempty type and object data')
  }

  return map
}

function getPrivateMapUrl(env) {
  const value = env.MORPHEUS_MAP_BLOB_URL
  if (!value) {
    throw new Error(
      'Morpheus map is missing and private map input is not configured.'
    )
  }

  let url
  try {
    url = new URL(value)
  } catch {
    throw new Error('Private Morpheus map input URL is invalid.')
  }

  if (
    url.protocol !== 'https:' ||
    !url.hostname.endsWith(privateBlobHostSuffix)
  ) {
    throw new Error('Private Morpheus map input must use a Vercel private Blob URL.')
  }

  return url
}

function getBuildCredential(env) {
  const credential = env.BLOB_READ_WRITE_TOKEN
  if (!credential) {
    throw new Error(
      'Morpheus map is missing and no private Blob build credential is available.'
    )
  }
  return credential
}

async function readLocalMap(mapPath) {
  try {
    return await readFile(mapPath, 'utf8')
  } catch (error) {
    if (error && typeof error === 'object' && error.code === 'ENOENT') {
      return null
    }
    throw new Error('Existing Morpheus map could not be read.')
  }
}

async function fetchPrivateMap({ env, fetchImpl }) {
  const url = getPrivateMapUrl(env)
  const credential = getBuildCredential(env)

  let response
  try {
    response = await fetchImpl(url, {
      headers: { Authorization: `Bearer ${credential}` },
    })
  } catch {
    throw new Error('Private Morpheus map input request failed.')
  }

  if (!response.ok) {
    throw new Error(
      `Private Morpheus map input could not be read (HTTP ${response.status}).`
    )
  }

  try {
    return await response.text()
  } catch {
    throw new Error('Private Morpheus map input response could not be read.')
  }
}

async function writeMapAtomically(mapPath, mapText) {
  const temporaryPath = `${mapPath}.${process.pid}.tmp`
  await writeFile(temporaryPath, mapText, 'utf8')
  await rename(temporaryPath, mapPath)
}

export async function prepareMorpheusMap({
  env = process.env,
  fetchImpl = fetch,
  log = console.log,
  mapPath = defaultMapPath,
} = {}) {
  const localMap = await readLocalMap(mapPath)
  const source = localMap === null ? 'private-blob' : 'local'
  const mapText =
    localMap === null ? await fetchPrivateMap({ env, fetchImpl }) : localMap

  validateMorpheusMap(mapText)

  if (localMap === null) {
    await writeMapAtomically(mapPath, mapText)
  }

  const bytes = Buffer.byteLength(mapText)
  log(`Morpheus map prepared: source=${source} bytes=${bytes} validation=passed`)
  return { source, bytes }
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : null
if (invokedPath === fileURLToPath(import.meta.url)) {
  prepareMorpheusMap().catch(error => {
    console.error(error.message)
    process.exitCode = 1
  })
}
