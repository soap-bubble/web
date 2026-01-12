import { notFound } from 'next/navigation';
import { getScene } from '@/app/actions';
import { Client } from './client';

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
  return <Client scene={scene} />;
};

export default ScenePage;
