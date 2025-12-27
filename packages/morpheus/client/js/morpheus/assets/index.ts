type AssetResolver = (relativePath: string) => string

const MORPHEUS_ASSET_BASE_GLOBAL = '__MORPHEUS_ASSET_BASE__'

let resolver: AssetResolver | null = null

const normalizePath = (path: string) => path.replace(/^\/+/, '')
const normalizeBase = (base: string) =>
  base.trim().replace(/\/+$/, '')

const readGlobalBase = (): string | undefined => {
  if (typeof globalThis === 'undefined') {
    return undefined
  }
  const base = (globalThis as Record<string, unknown>)[
    MORPHEUS_ASSET_BASE_GLOBAL
  ]
  if (typeof base === 'string' && base.trim().length > 0) {
    return normalizeBase(base)
  }
  return undefined
}

export const setAssetResolver = (customResolver: AssetResolver) => {
  resolver = (relativePath: string) =>
    customResolver(normalizePath(relativePath))
}

export const setAssetBasePath = (basePath: string) => {
  const normalizedBase = normalizeBase(basePath)
  setAssetResolver(
    (relativePath) => `${normalizedBase}/${normalizePath(relativePath)}`
  )
}

export const resolveAssetPath = (relativePath: string): string => {
  const normalizedPath = normalizePath(relativePath)
  if (resolver) {
    return resolver(normalizedPath)
  }
  const globalBase = readGlobalBase()
  if (globalBase) {
    return `${globalBase}/${normalizedPath}`
  }
  return normalizedPath
}

export const assetGlobals = {
  BASE_KEY: MORPHEUS_ASSET_BASE_GLOBAL,
}



