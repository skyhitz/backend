import { preparePagedData } from './list-helper';
import { queryExternal } from './query-external';

/**
 * Query assets metadata.
 * @param {AssetQueryModel} queryParams - Query parameters.
 * @return {Promise<Array>}
 */
export function queryAssets(queryParams) {
  return queryExternal(queryParams).then((res) =>
    preparePagedData(
      queryParams,
      res.map(({ timestamp, ...rest }) => rest)
    )
  );
}
