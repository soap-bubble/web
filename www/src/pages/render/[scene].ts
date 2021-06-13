import RenderApp from 'morpheus/app/Render/Render';

export default RenderApp;
export { getStaticProps } from 'morpheus/app/Render/getStaticProps';

export async function getStaticPaths() {
  
  return {
    paths: ['/render/2000'],
    fallback: true,
  };
}
