const resolveAssetBase = () => {
  const raw =
    process.env.NEXT_PUBLIC_MORPHEUS_ASSET_BASE ||
    process.env.MORPHEUS_ASSET_BASE ||
    '/morpheus-assets';
  return raw.replace(/\/+$/, '') || '/morpheus-assets';
};

const basePath = resolveAssetBase();

if (typeof globalThis !== 'undefined') {
  (globalThis as Record<string, unknown>).__MORPHEUS_ASSET_BASE__ = basePath;
}

export const morpheusAssetBase = basePath;



