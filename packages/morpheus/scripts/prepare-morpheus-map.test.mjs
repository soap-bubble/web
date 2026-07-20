import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'

import {
  prepareMorpheusMap,
  validateMorpheusMap,
} from './prepare-morpheus-map.mjs'

const validMap = JSON.stringify([
  {
    type: 'Scene',
    data: { sceneId: 1050 },
  },
])

test('validates a nonempty authored map array', () => {
  assert.doesNotThrow(() => validateMorpheusMap(validMap))
  assert.throws(() => validateMorpheusMap('[]'), /nonempty array/)
  assert.throws(() => validateMorpheusMap('{'), /valid JSON/)
  assert.throws(
    () => validateMorpheusMap(JSON.stringify([{ type: 'Scene' }])),
    /type and object data/
  )
})

test('keeps a valid local map without fetching credentials', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'morpheus-map-'))
  const mapPath = join(directory, 'morpheus.map.json')
  const logs = []

  try {
    await writeFile(mapPath, validMap)
    const result = await prepareMorpheusMap({
      mapPath,
      env: {},
      fetchImpl: () => {
        throw new Error('fetch should not run for a valid local map')
      },
      log: message => logs.push(message),
    })

    assert.deepEqual(result, { source: 'local', bytes: Buffer.byteLength(validMap) })
    assert.deepEqual(logs, [
      `Morpheus map prepared: source=local bytes=${Buffer.byteLength(validMap)} validation=passed`,
    ])
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})

test('restores and validates a missing map from private Blob without logging secrets', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'morpheus-map-'))
  const mapPath = join(directory, 'morpheus.map.json')
  const logs = []
  const privateUrl =
    'https://map-store.private.blob.vercel-storage.com/morpheus.map.json'
  const token = 'private-token-that-must-not-appear-in-logs'

  try {
    const result = await prepareMorpheusMap({
      mapPath,
      env: {
        MORPHEUS_MAP_BLOB_URL: privateUrl,
        BLOB_READ_WRITE_TOKEN: token,
      },
      fetchImpl: async (url, options) => {
        assert.equal(String(url), privateUrl)
        assert.equal(options.headers.Authorization, `Bearer ${token}`)
        return new Response(validMap, { status: 200 })
      },
      log: message => logs.push(message),
    })

    assert.deepEqual(result, { source: 'private-blob', bytes: Buffer.byteLength(validMap) })
    assert.equal(await readFile(mapPath, 'utf8'), validMap)
    assert.equal(logs[0].includes(privateUrl), false)
    assert.equal(logs[0].includes(token), false)
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})

test('fails before writing when a missing map has no private build input', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'morpheus-map-'))
  const mapPath = join(directory, 'morpheus.map.json')

  try {
    await assert.rejects(
      prepareMorpheusMap({ mapPath, env: {}, log: () => {} }),
      /private map input is not configured/
    )
    await assert.rejects(readFile(mapPath, 'utf8'), { code: 'ENOENT' })
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})

test('rejects malformed private map data before writing it locally', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'morpheus-map-'))
  const mapPath = join(directory, 'morpheus.map.json')

  try {
    await assert.rejects(
      prepareMorpheusMap({
        mapPath,
        env: {
          MORPHEUS_MAP_BLOB_URL:
            'https://map-store.private.blob.vercel-storage.com/morpheus.map.json',
          BLOB_READ_WRITE_TOKEN: 'private-token',
        },
        fetchImpl: async () => new Response('[]', { status: 200 }),
        log: () => {},
      }),
      /nonempty array/
    )
    await assert.rejects(readFile(mapPath, 'utf8'), { code: 'ENOENT' })
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})
