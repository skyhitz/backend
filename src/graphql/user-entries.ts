import { loadSkyhitzAssets } from '../stellar/operations';
import { getEntryByCode, getUser } from '../algolia/algolia';

async function getEntriesWithAssetCodes(assetCodes: string[]) {
  return await Promise.all(assetCodes.map((id) => getEntryByCode(id)));
}

export const userEntriesResolver = async (root: any, { userId }: any) => {
  const user = await getUser(userId);
  const assetCodes = await loadSkyhitzAssets(user.publicKey);
  const entries = await getEntriesWithAssetCodes(assetCodes);

  return entries.filter((entry) => entry !== undefined);
};
