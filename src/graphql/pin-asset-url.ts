import { pinAssetUrl } from 'src/util/pinata';

export const pinAssetUrlResolver = async (
  _: any,
  { url }: any,
  ctx: any
) => {
    return pinAssetUrl(url)
};
