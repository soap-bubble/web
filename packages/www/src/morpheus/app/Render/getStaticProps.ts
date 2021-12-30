import { Scene } from 'morpheus/casts/types';
import { GetStaticProps } from 'next';
import { firebaseAdmin } from 'service/firebaseAdmin';
import { fetch } from 'service/scene';
  
export const getStaticProps: GetStaticProps<
  { scene: Scene },
  { scene: string | string[] }
> = async (context) => {
  const { params } = context;
  if (!params) {
    throw new Error('F');
  }

  const { scene: sceneIdFromQuery } = params;
  const sceneId = Array.isArray(sceneIdFromQuery)
    ? Number(sceneIdFromQuery[0])
    : Number(sceneIdFromQuery) || 2000;

  const scene = await fetch(sceneId, firebaseAdmin.firestore());

  if (!scene) {
    throw new Error('F');
  }
  return {
    props: {
      scene,
    },
  };
};
