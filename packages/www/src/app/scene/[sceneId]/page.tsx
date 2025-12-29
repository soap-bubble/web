import { Providers } from '../../providers';
import { Client } from './client';

const ScenePage = async ({
  params,
}: {
  params: Promise<{ sceneId: string }>;
}) => {
  const { sceneId } = await params;
  return (
    <Providers>
      <Client />
    </Providers>
  );
};

export default ScenePage;
