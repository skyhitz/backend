import { pinAssetUrl } from 'src/util/pinata';

export const pinAssetUrlResolver = async (_: any, { url }: any, ctx: any) => {
  console.log('url', url);
  return pinAssetUrl(url);
};
