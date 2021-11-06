import RenderApp from 'morpheus/app/Render/Render';
import scenes from 'fixtures/scenes.json';

export default RenderApp;
import { getStaticProps as a } from 'morpheus/app/Render/getStaticProps';

export async function getStaticPaths() {
  return {
    paths: scenes.map(scene => `/render/{scene}`),
    fallback: true
  };
}

export const getStaticProps = a;
