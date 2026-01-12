import { getScene } from '@/app/actions';
import { Providers } from '../../providers';
import { Client } from './client';

const ScenePage = async ({
  params,
}: {
  params: Promise<{ sceneId: string }>;
}) => {
  const { sceneId } = await params;
  const scene = await getScene(Number(sceneId));
  return (
    <Providers>
      <Client />
    </Providers>
  );
};

export default ScenePage;
