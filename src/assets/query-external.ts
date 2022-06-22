import { assetsMeta, findAssetMeta } from '../algolia/algolia';

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
    return await await findAssetMeta(code, issuer);
  }

  if (cursor) {
    const [{ timestamp }] = await findAssetMeta(
      cursor.substr(0, cursor.indexOf('-')),
      cursor.substr(cursor.indexOf('-') + 1, cursor.length)
    );
    return await assetsMeta(timestamp, limit, order);
  }

  return await assetsMeta(0, limit, order);
}
