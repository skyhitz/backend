import {
  assetsMeta,
  assetsMetaSortedByPublishedTimestamp,
  findAssetMeta,
} from '../redis';

/**
 * Query assets metadata from external resource.
 * @param {AssetQueryModel} queryParams - Query parameters.
 * @return {Promise<Array>}
 */
export async function queryExternal(queryParams) {
  // here the request to the external resource (database, private API etc) can be implemented
  //  cursor = `${code}-${issuer}`
  const { code, issuer, cursor, limit, order } = queryParams;

  if (code || issuer) {
    return await (
      await findAssetMeta(code, issuer)
    ).map(({ publishedAtTimestamp, ...rest }) => rest);
  }

  if (cursor) {
    const [{ publishedAtTimestamp }] = await findAssetMeta(
      cursor.substr(0, cursor.indexOf('-')),
      cursor.substr(cursor.indexOf('-') + 1, cursor.length)
    );
    return (await assetsMeta(publishedAtTimestamp, limit + 1, order)).shift();
  }

  return await assetsMetaSortedByPublishedTimestamp(limit, order);
}
