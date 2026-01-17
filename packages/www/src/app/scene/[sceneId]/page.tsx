import { notFound } from 'next/navigation';
import { getScene } from '@/app/actions';
import { Client } from './client';
import { Providers } from '@/app/providers';

const ScenePage = async ({
  params,
}: {
  params: Promise<{ sceneId: string }>;
}) => {
  const { sceneId } = await params;
  const scene = await getScene(Number(sceneId));
  if (!scene) {
    notFound();
  }
  return (
    <Providers>
      <Client scene={scene} />
    </Providers>
  );
};

export default ScenePage;
