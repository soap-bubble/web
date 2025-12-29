import map from './morpheus.map.json' with { type: 'json' }
import type { MorpheusMap, MorpheusMapDataTypes } from './types'
// import { promises as fs } from 'fs'
// import path from 'path'
// const map = await fs.readFile(path.join(__dirname, 'morpheus.map.json'), 'utf8')
const morpheusMap = map.map(
  (m: MorpheusMapDataTypes): MorpheusMap => ({
    data: {
      ...m.data,
      __t: m.type,
    },
    type: m.type,
  })
) as MorpheusMap[]

export default morpheusMap
