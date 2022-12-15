import { getAuthenticatedUser } from '../auth/logic';
import { getUserHiddenBids } from '../algolia/algolia';
import { Config } from '../config';
import axios from 'axios';
import { EmbeddedOffer } from '../util/types';

export const bids = async (_: any, args: any, ctx) => {
  const { assetCode, assetIssuer } = args;
  const user = await getAuthenticatedUser(ctx);
  const [hiddenBids, bids] = await Promise.all([
    getUserHiddenBids(user.publicKey),
    getBids(assetCode, assetIssuer),
  ]);
  const visibleBids = bids.filter(
    (item) => !hiddenBids.includes(item.id) && item.seller !== user.publicKey
  );

  return visibleBids;
};

const getBids = async (assetCode: string, assetIssuer: string) => {
  const result = await axios.get<EmbeddedOffer>(
    `${Config.HORIZON_URL}/offers?buying_asset_type=credit_alphanum12&buying_asset_issuer=${assetIssuer}&buying_asset_code=${assetCode}&include_failed=false`
  );
  return result.data._embedded.records;
};
