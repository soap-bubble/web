import { cache } from 'react';
import { notFound } from 'next/navigation';
import type { Metadata, NextPage } from 'next';

import Render from 'morpheus-app/Render/Render';
import { fetch as fetchScene } from 'service/scene';
import type { Scene } from 'morpheus/casts/types';

type PageParams = {
  scene: string;
};

type PageProps = {
  params: Promise<PageParams>;
};

const getScene = cache(
  async (sceneId: number): Promise<Scene | undefined> => fetchScene(sceneId),
);

const parseSceneId = (rawValue: string): number => {
  const parsed = Number.parseInt(rawValue, 10);
  if (Number.isNaN(parsed)) {
    return 2000;
  }
  return parsed;
};

const resolveBaseUrl = (): string | undefined => {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '');
  }
  if (process.env.SITE_URL) {
    return process.env.SITE_URL.replace(/\/$/, '');
  }
  if (process.env.VERCEL_URL) {
    const value = process.env.VERCEL_URL.startsWith('http')
      ? process.env.VERCEL_URL
      : `https://${process.env.VERCEL_URL}`;
    return value.replace(/\/$/, '');
  }
  return undefined;
};

const baseUrl = resolveBaseUrl();

const resolveScene = async (params: PageParams) => {
  const sceneId = parseSceneId(params.scene);
  const scene = await getScene(sceneId);
  return { sceneId, scene };
};

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { sceneId, scene } = await resolveScene(await params);
  const title = scene
    ? `Morpheus Scene ${scene.sceneId}`
    : `Morpheus Scene ${sceneId}`;
  const description = scene
    ? `Scene ${scene.sceneId} with ${scene.casts.length} casts`
    : 'Scene could not be loaded.';
  const url = baseUrl ? `${baseUrl}/render/${sceneId}` : undefined;
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

const RenderScenePage = (async ({ params }) => {
  const { scene } = await resolveScene(await params);
  if (!scene) {
    notFound();
  }
  return <Render scene={scene} />;
}) as NextPage<PageProps>;

export default RenderScenePage;
