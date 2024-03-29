import axios from 'axios';
import { createEntryResolver } from './create-entry';
import { decentralizeEntryResolver } from './decentralize-entry';
import { indexEntryResolver } from './index-entry';
import { pinataGateway } from 'src/constants/constants';

export const processEntryResolver = async (
  _: any,
  { contract, tokenId, network }: any,
  ctx: any
) => {
  const { media, metadata } = await decentralizeEntryResolver(_, {
    contract,
    tokenId,
    network,
  });

  const { data } = await axios.get(`${pinataGateway}/ipfs/${metadata}`);

  const metaCode = `${data.name}`
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/ /g, '')
    .replace(/-/g, '')
    .replace(/[^0-9a-z]/gi, '')
    .slice(0, 12)
    .toUpperCase();

  const { publicKey } = await createEntryResolver(
    _,
    {
      fileCid: media,
      metaCid: metadata,
      code: metaCode,
      globalMint: true,
    },
    ctx
  );

  const res = await indexEntryResolver(
    _,
    { issuer: publicKey, contract, tokenId, network },
    ctx
  );

  return res;
};
